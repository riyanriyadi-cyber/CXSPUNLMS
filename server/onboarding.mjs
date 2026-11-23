// Program onboarding karyawan baru: paket course wajib dengan tenggat.
// Selama onboarding aktif, peserta hanya bisa membuka course onboarding (dan quiz yang ditautkan ke course itu).
// Selesai = semua modul selesai + semua quiz course itu lulus (skor ≥ 80, sudah dinilai).
import {sql, fail} from './http.mjs';
import {teamIdsOf, teamsByUser, scopeCatalog} from './teams.mjs';

const DAY = 86400000;
export const DEFAULT_DAYS = 14;
const iso = v => v == null ? null : v instanceof Date ? v.toISOString() : String(v);
const parseJson = v => typeof v === 'string' ? JSON.parse(v) : v;

export async function getSettings(db) {
  const row = await sql(db, "SELECT value FROM app_settings WHERE key='onboarding'").first();
  const v = row ? parseJson(row.value) : {};
  const byTeam = {};
  for (const [t, list] of Object.entries(v.byTeam && typeof v.byTeam === 'object' ? v.byTeam : {})) if (Array.isArray(list)) byTeam[t] = list.filter(x => typeof x === 'string');
  return {courses: Array.isArray(v.courses) ? v.courses.filter(x => typeof x === 'string') : [], byTeam, days: Number.isInteger(v.days) ? v.days : DEFAULT_DAYS};
}

export async function saveSettings(db, body, catalogIds, userId, teamIds = []) {
  const clean = list => {
    if (!Array.isArray(list) || list.length > 30) fail(422, 'Pilih maksimal 30 course.');
    const out = [...new Set(list)];
    if (out.some(id => typeof id !== 'string' || !catalogIds.includes(id))) fail(422, 'Ada course yang tidak ditemukan. Muat ulang halaman.');
    return out;
  };
  const courses = clean(body.courses ?? []), byTeam = {};
  for (const [t, list] of Object.entries(body.byTeam && typeof body.byTeam === 'object' ? body.byTeam : {})) {
    if (!teamIds.includes(t)) fail(422, 'Ada tim yang tidak ditemukan. Muat ulang halaman.');
    const l = clean(list).filter(id => !courses.includes(id));
    if (l.length) byTeam[t] = l;
  }
  const days = Number(body.days);
  if (!Number.isInteger(days) || days < 1 || days > 90) fail(422, 'Tenggat harus 1–90 hari.');
  await sql(db, "INSERT INTO app_settings(key,value,updated_at,updated_by) VALUES('onboarding',?::jsonb,now(),?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=now(), updated_by=excluded.updated_by",
    JSON.stringify({courses, byTeam, days}), userId).run();
  return {courses, byTeam, days};
}

// Course onboarding yang tayang untuk seseorang: course umum + course tim-timnya (catalog sudah disaring per tim).
export function program(settings, catalog, teams = []) {
  const ids = [...new Set([...settings.courses, ...teams.flatMap(t => settings.byTeam[t] || [])])];
  return ids.map(id => catalog.courses.find(c => c.id === id)).filter(Boolean)
    .map(c => ({id: c.id, title: c.title, lessons: c.lessons.map(l => l.id), quizzes: catalog.quizzes.filter(q => q.course === c.id).map(q => ({id: q.id, title: q.title}))}));
}

// progress: {courseId: Set(lessonId)}, best: {quizId: skor terbaik dinilai}, pending: {quizId: n}
function evaluate(prog, progress, best, pending) {
  const courses = prog.map(c => {
    const lessonsDone = c.lessons.filter(id => progress[c.id]?.has(id)).length;
    const quizzes = c.quizzes.map(q => ({id: q.id, title: q.title, best: best[q.id] ?? null, passed: (best[q.id] ?? -1) >= 80, pending: (pending[q.id] || 0) > 0}));
    return {id: c.id, title: c.title, lessonsDone, lessonsTotal: c.lessons.length, quizzes, done: lessonsDone === c.lessons.length && quizzes.every(q => q.passed)};
  });
  return {courses, done: courses.filter(c => c.done).length, total: courses.length};
}

function describe(row, ev, now = Date.now()) {
  const required = !!row.onboarding_required;
  const completedAt = iso(row.onboarding_completed_at), dueAt = iso(row.onboarding_due_at), startedAt = iso(row.onboarding_started_at);
  const status = !required ? 'none' : completedAt ? 'completed' : !ev.total ? 'none' : !startedAt ? 'not_started' : now > Date.parse(dueAt) ? 'overdue' : 'active';
  return {
    required, status, active: status === 'active' || status === 'overdue',
    startedAt, dueAt, completedAt, manual: !!(completedAt && row.onboarding_completed_by),
    daysLeft: dueAt && !completedAt ? Math.ceil((Date.parse(dueAt) - now) / DAY) : null,
    ...ev
  };
}

// Untuk peserta yang sedang login. Memulai hitungan tenggat saat pertama kali dipanggil dan
// mencatat selesai otomatis begitu semua syarat terpenuhi.
export async function learnerOnboarding(db, userId, catalog) {
  const row = await sql(db, 'SELECT onboarding_required,onboarding_started_at,onboarding_due_at,onboarding_completed_at,onboarding_completed_by FROM users WHERE id=?', userId).first();
  if (!row?.onboarding_required) return {required: false, status: 'none', active: false};
  const settings = await getSettings(db), prog = program(settings, catalog, await teamIdsOf(db, userId));
  if (!row.onboarding_completed_at && prog.length && !row.onboarding_started_at) {
    const start = new Date(), due = new Date(start.getTime() + settings.days * DAY);
    await sql(db, 'UPDATE users SET onboarding_started_at=?, onboarding_due_at=? WHERE id=? AND onboarding_started_at IS NULL', start.toISOString(), due.toISOString(), userId).run();
    Object.assign(row, {onboarding_started_at: start.toISOString(), onboarding_due_at: due.toISOString()});
  }
  let ev = {courses: [], done: 0, total: prog.length};
  if (prog.length) {
    const [p, a] = await Promise.all([
      sql(db, 'SELECT course_id,lesson_id FROM lesson_progress WHERE user_id=?', userId).all(),
      sql(db, 'SELECT quiz_id,score,status FROM quiz_attempts WHERE user_id=?', userId).all()
    ]);
    const progress = {}, best = {}, pending = {};
    for (const r of p.results) (progress[r.course_id] ||= new Set()).add(r.lesson_id);
    for (const r of a.results) r.status === 'pending' ? pending[r.quiz_id] = (pending[r.quiz_id] || 0) + 1 : best[r.quiz_id] = Math.max(best[r.quiz_id] ?? 0, r.score);
    ev = evaluate(prog, progress, best, pending);
    if (!row.onboarding_completed_at && ev.done === ev.total) {
      const now = new Date().toISOString();
      await sql(db, 'UPDATE users SET onboarding_completed_at=?, onboarding_completed_by=NULL WHERE id=? AND onboarding_completed_at IS NULL', now, userId).run();
      row.onboarding_completed_at = now; row.onboarding_completed_by = null;
    }
  }
  return describe(row, ev);
}

// Daftar yang boleh dibuka selama onboarding aktif.
export function allowedIds(onb) {
  return {courses: new Set(onb.courses.map(c => c.id)), quizzes: new Set(onb.courses.flatMap(c => c.quizzes.map(q => q.id)))};
}

// Untuk panel admin: semua peserta yang di-assign onboarding.
export async function onboardingOverview(db, catalog) {
  const settings = await getSettings(db), teamMap = await teamsByUser(db);
  const progFor = id => program(settings, scopeCatalog(catalog, teamMap[id] || []), teamMap[id] || []);
  const rows = (await sql(db, `SELECT u.id,u.name,u.email,u.onboarding_required,u.onboarding_started_at,u.onboarding_due_at,u.onboarding_completed_at,u.onboarding_completed_by,
      cb.name AS completed_by_name, au.last_sign_in_at
    FROM users u LEFT JOIN users cb ON cb.id=u.onboarding_completed_by LEFT JOIN auth.users au ON au.id=u.id
    WHERE u.onboarding_required ORDER BY u.onboarding_completed_at NULLS FIRST, u.onboarding_due_at NULLS LAST, lower(u.name)`).all()).results;
  const progress = {}, best = {}, pending = {};
  if (rows.length) {
    const [p, a] = await Promise.all([
      sql(db, 'SELECT p.user_id,p.course_id,p.lesson_id FROM lesson_progress p JOIN users u ON u.id=p.user_id WHERE u.onboarding_required').all(),
      sql(db, 'SELECT a.user_id,a.quiz_id,a.score,a.status FROM quiz_attempts a JOIN users u ON u.id=a.user_id WHERE u.onboarding_required').all()
    ]);
    for (const r of p.results) ((progress[r.user_id] ||= {})[r.course_id] ||= new Set()).add(r.lesson_id);
    for (const r of a.results) {
      if (r.status === 'pending') {const x = (pending[r.user_id] ||= {}); x[r.quiz_id] = (x[r.quiz_id] || 0) + 1;}
      else {const x = (best[r.user_id] ||= {}); x[r.quiz_id] = Math.max(x[r.quiz_id] ?? 0, r.score);}
    }
  }
  const people = [];
  for (const r of rows) {
    const prog = progFor(r.id);
    const ev = evaluate(prog, progress[r.id] || {}, best[r.id] || {}, pending[r.id] || {});
    if (!r.onboarding_completed_at && r.onboarding_started_at && prog.length && ev.done === ev.total) {
      r.onboarding_completed_at = new Date().toISOString(); r.onboarding_completed_by = null;
      await sql(db, 'UPDATE users SET onboarding_completed_at=?, onboarding_completed_by=NULL WHERE id=? AND onboarding_completed_at IS NULL', r.onboarding_completed_at, r.id).run();
    }
    people.push({id: r.id, name: r.name, email: r.email, teams: teamMap[r.id] || [], signedIn: !!r.last_sign_in_at, completedBy: r.onboarding_completed_by ? r.completed_by_name : null, ...describe(r, ev)});
  }
  const courses = catalog.courses.map(c => ({id: c.id, title: c.title, teams: c.teams || [], lessons: c.lessons.length, quizzes: catalog.quizzes.filter(q => q.course === c.id).map(q => ({id: q.id, title: q.title}))}));
  const published = new Set(catalog.courses.map(c => c.id));
  const programTotal = new Set([...settings.courses, ...Object.values(settings.byTeam).flat()].filter(id => published.has(id))).size;
  return {settings, courses, people, programTotal};
}

export async function updateUserOnboarding(db, targetId, body, adminId) {
  const action = body.action;
  if (action === 'assign') {
    await sql(db, 'UPDATE users SET onboarding_required=true, onboarding_started_at=NULL, onboarding_due_at=NULL, onboarding_completed_at=NULL, onboarding_completed_by=NULL WHERE id=?', targetId).run();
  } else if (action === 'cancel') {
    await sql(db, 'UPDATE users SET onboarding_required=false WHERE id=?', targetId).run();
  } else if (action === 'extend') {
    const days = Number(body.days);
    if (!Number.isInteger(days) || days < 1 || days > 60) fail(422, 'Perpanjangan 1–60 hari.');
    const row = await sql(db, 'SELECT onboarding_required,onboarding_due_at,onboarding_completed_at FROM users WHERE id=?', targetId).first();
    if (!row?.onboarding_required || row.onboarding_completed_at) fail(409, 'Peserta ini tidak sedang onboarding.');
    if (!row.onboarding_due_at) fail(409, 'Tenggat baru mulai dihitung saat peserta login pertama kali.');
    const base = Math.max(Date.parse(iso(row.onboarding_due_at)), Date.now());
    await sql(db, 'UPDATE users SET onboarding_due_at=? WHERE id=?', new Date(base + days * DAY).toISOString(), targetId).run();
  } else if (action === 'unlock') {
    const row = await sql(db, 'SELECT onboarding_required,onboarding_completed_at FROM users WHERE id=?', targetId).first();
    if (!row?.onboarding_required || row.onboarding_completed_at) fail(409, 'Peserta ini tidak sedang onboarding.');
    await sql(db, 'UPDATE users SET onboarding_completed_at=now(), onboarding_completed_by=? WHERE id=?', adminId, targetId).run();
  } else fail(422, 'Aksi tidak dikenal.');
}
