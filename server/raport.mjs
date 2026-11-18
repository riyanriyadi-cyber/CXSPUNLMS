// Raport pembelajaran per peserta, dengan filter periode (zona waktu Asia/Jakarta).
// Dipakai oleh /api/me/raport (peserta, raport sendiri) dan /api/admin/users/:id/raport (admin).
// Data dikembalikan sebagai teks mentah; frontend wajib meng-escape saat menampilkan.
import {sql, fail} from './http.mjs';
import {loadCatalog} from './catalog.mjs';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const iso = v => v == null ? null : v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const dayKey = d => new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(d));
const mondayOf = key => {const d = new Date(key + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10);};
const addDays = (key, n) => {const d = new Date(key + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);};
const MAX_WEEKS = 26;

export function parsePeriod(url) {
  const f = url.searchParams.get('from') || '', t = url.searchParams.get('to') || '';
  if ((f && !DAY_RE.test(f)) || (t && !DAY_RE.test(t))) fail(422, 'Format tanggal harus YYYY-MM-DD.');
  const from = f ? new Date(`${f}T00:00:00+07:00`) : null, to = t ? new Date(`${t}T23:59:59.999+07:00`) : null;
  if ((from && isNaN(from)) || (to && isNaN(to))) fail(422, 'Tanggal tidak valid.');
  if (from && to && from > to) fail(422, 'Tanggal awal harus sebelum tanggal akhir.');
  return {from, to, fromDay: f || null, toDay: t || null};
}

export async function buildRaport(db, userId, period, catalog) {
  catalog ||= await loadCatalog(db);
  const {from, to} = period;
  const u = await sql(db, 'SELECT id,name,email,role,status,created_at FROM users WHERE id=?', userId).first() || fail(404, 'Peserta tidak ditemukan.');
  const [p, a, r, e] = await Promise.all([
    sql(db, 'SELECT course_id,lesson_id,completed_at FROM lesson_progress WHERE user_id=? ORDER BY completed_at', userId).all(),
    sql(db, 'SELECT quiz_id,score,created_at FROM quiz_attempts WHERE user_id=? ORDER BY created_at,attempt_id', userId).all(),
    sql(db, 'SELECT article_id,read_at FROM article_reads WHERE user_id=? ORDER BY read_at', userId).all(),
    sql(db, 'SELECT course_id,created_at FROM enrollments WHERE user_id=?', userId).all()
  ]);
  const t = v => new Date(v).getTime();
  const inPeriod = v => (!from || t(v) >= from.getTime()) && (!to || t(v) <= to.getTime());
  const upToEnd = v => !to || t(v) <= to.getTime();

  const lessonEvents = [];
  const courses = [];
  for (const c of catalog.courses) {
    const byId = new Map(c.lessons.map(l => [l.id, l]));
    const rows = p.results.filter(x => x.course_id === c.id && byId.has(x.lesson_id));
    const enrolled = e.results.find(x => x.course_id === c.id);
    const cumulative = rows.filter(x => upToEnd(x.completed_at));
    const startCandidates = [enrolled?.created_at, rows[0]?.completed_at].filter(Boolean).map(t);
    const startedAt = startCandidates.length ? Math.min(...startCandidates) : null;
    if (startedAt === null || (to && startedAt > to.getTime())) continue; // belum mengikuti course ini pada akhir periode
    const period = rows.filter(x => inPeriod(x.completed_at));
    for (const x of period) lessonEvents.push({at: x.completed_at, minutes: byId.get(x.lesson_id).duration});
    const done = cumulative.length, total = c.lessons.length;
    courses.push({
      id: c.id, title: c.title, category: c.category, done, total, percent: total ? Math.round(done / total * 100) : 0,
      startedAt: iso(startedAt), completedAt: done === total && total ? iso(Math.max(...cumulative.map(x => t(x.completed_at)))) : null,
      lessonsInPeriod: period.length, minutesInPeriod: period.reduce((s, x) => s + byId.get(x.lesson_id).duration, 0)
    });
  }

  const quizEvents = a.results.filter(x => inPeriod(x.created_at) && catalog.quizzes.some(q => q.id === x.quiz_id));
  const quizzes = catalog.quizzes.map(q => {
    const rows = quizEvents.filter(x => x.quiz_id === q.id);
    if (!rows.length) return null;
    const best = Math.max(...rows.map(x => x.score)), last = rows[rows.length - 1];
    return {id: q.id, title: q.title, category: q.category, best, last: last.score, attempts: rows.length, passed: best >= 80, firstAt: iso(rows[0].created_at), lastAt: iso(last.created_at)};
  }).filter(Boolean);

  const articles = r.results.filter(x => inPeriod(x.read_at)).map(x => {
    const art = catalog.articles.find(a => a.id === x.article_id);
    return art ? {id: art.id, title: art.title, category: art.category, readAt: iso(x.read_at)} : null;
  }).filter(Boolean);

  // Aktivitas mingguan (Senin–Minggu, WIB)
  const allActivity = [...p.results.map(x => x.completed_at), ...a.results.map(x => x.created_at), ...r.results.map(x => x.read_at)].filter(upToEnd).map(t);
  const lastActivity = allActivity.length ? iso(Math.max(...allActivity)) : null;
  const endKey = dayKey(to || new Date());
  const firstKey = from ? dayKey(from) : dayKey(Math.min(t(u.created_at), ...(allActivity.length ? allActivity : [Date.now()])));
  let startWeek = mondayOf(firstKey);
  const endWeek = mondayOf(endKey);
  let truncated = false;
  const span = Math.round((t(endWeek) - t(startWeek)) / 6048e5) + 1;
  if (span > MAX_WEEKS) {startWeek = addDays(endWeek, -7 * (MAX_WEEKS - 1)); truncated = true;}
  const weeks = [];
  for (let w = startWeek; w <= endWeek; w = addDays(w, 7)) weeks.push({week: w, minutes: 0, lessons: 0, quizzes: 0});
  const bucket = at => weeks.find(x => x.week === mondayOf(dayKey(at)));
  for (const ev of lessonEvents) {const b = bucket(ev.at); if (b) {b.minutes += ev.minutes; b.lessons++;}}
  for (const ev of quizEvents) {const b = bucket(ev.created_at); if (b) b.quizzes++;}

  const bests = quizzes.map(q => q.best);
  return {
    user: {id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, joinedAt: iso(u.created_at), lastActivity},
    period: {from: period.fromDay, to: period.toDay},
    summary: {
      coursesAvailable: catalog.courses.length, coursesFollowed: courses.length, coursesCompleted: courses.filter(c => c.completedAt).length,
      lessonsCompleted: lessonEvents.length, minutes: lessonEvents.reduce((s, x) => s + x.minutes, 0),
      quizzesAttempted: quizzes.length, quizzesPassed: quizzes.filter(q => q.passed).length,
      avgBest: bests.length ? Math.round(bests.reduce((s, x) => s + x, 0) / bests.length) : null,
      articlesRead: articles.length
    },
    courses, quizzes, articles, weekly: {weeks, truncated},
    generatedAt: new Date().toISOString()
  };
}
