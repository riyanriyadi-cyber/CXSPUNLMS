// Tim: pengelompokan peserta dan audiens materi.
// Materi tanpa tim = untuk semua tim. Admin selalu melihat semua materi.
import {sql, fail} from './http.mjs';
import {slugify} from './content.mjs';

export async function listTeams(db) {
  const rows = (await sql(db, `SELECT t.id,t.name,(SELECT count(*) FROM user_teams ut WHERE ut.team_id=t.id) AS members FROM teams t ORDER BY lower(t.name)`).all()).results;
  const usage = await contentUsage(db);
  return rows.map(r => ({id: r.id, name: r.name, members: Number(r.members), content: usage[r.id] || 0}));
}

async function contentUsage(db) {
  const rows = (await sql(db, "SELECT draft->'teams' AS d, published->'teams' AS p FROM content_items").all()).results;
  const n = {};
  for (const r of rows) {
    const ids = new Set([...(parse(r.d) || []), ...(parse(r.p) || [])]);
    for (const id of ids) n[id] = (n[id] || 0) + 1;
  }
  return n;
}
const parse = v => typeof v === 'string' ? JSON.parse(v) : v;

const cleanName = v => {
  const name = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 60) fail(422, 'Nama tim wajib diisi (maksimal 60 karakter).');
  return name;
};

export async function createTeam(db, body) {
  const name = cleanName(body.name);
  if (await sql(db, 'SELECT 1 AS x FROM teams WHERE lower(name)=lower(?)', name).first()) fail(409, `Tim "${name}" sudah ada.`);
  if ((await sql(db, 'SELECT count(*) AS n FROM teams').first()).n >= 50) fail(422, 'Maksimal 50 tim.');
  const base = slugify(name) || 'tim'; let id = base;
  for (let n = 2; await sql(db, 'SELECT 1 AS x FROM teams WHERE id=?', id).first(); n++) id = `${base.slice(0, 54)}-${n}`;
  await sql(db, 'INSERT INTO teams(id,name) VALUES(?,?)', id, name).run();
  return id;
}

export async function renameTeam(db, id, body) {
  const name = cleanName(body.name);
  if (!(await sql(db, 'SELECT 1 AS x FROM teams WHERE id=?', id).first())) fail(404, 'Tim tidak ditemukan.');
  if (await sql(db, 'SELECT 1 AS x FROM teams WHERE lower(name)=lower(?) AND id<>?', name, id).first()) fail(409, `Tim "${name}" sudah ada.`);
  await sql(db, 'UPDATE teams SET name=? WHERE id=?', name, id).run();
}

export async function deleteTeam(db, id) {
  if (!(await sql(db, 'SELECT 1 AS x FROM teams WHERE id=?', id).first())) fail(404, 'Tim tidak ditemukan.');
  const used = (await contentUsage(db))[id] || 0;
  if (used) fail(409, `Tim ini masih dipakai sebagai audiens ${used} materi. Ubah audiens materi tersebut dulu.`);
  const ob = await sql(db, "SELECT value FROM app_settings WHERE key='onboarding'").first();
  const byTeam = ob ? parse(ob.value).byTeam || {} : {};
  if (byTeam[id]?.length) fail(409, 'Tim ini masih punya course onboarding. Kosongkan dulu di menu Onboarding.');
  await sql(db, 'DELETE FROM teams WHERE id=?', id).run(); // anggota ikut terhapus (cascade)
}

export async function teamIdsOf(db, userId) {
  return (await sql(db, 'SELECT team_id FROM user_teams WHERE user_id=? ORDER BY team_id', userId).all()).results.map(r => r.team_id);
}

export async function teamsByUser(db) {
  const map = {};
  for (const r of (await sql(db, 'SELECT user_id,team_id FROM user_teams ORDER BY team_id').all()).results) (map[r.user_id] ||= []).push(r.team_id);
  return map;
}

export async function assertTeams(db, ids) {
  if (!Array.isArray(ids)) fail(422, 'Pilihan tim tidak valid.');
  const uniq = [...new Set(ids)];
  if (uniq.length > 20 || uniq.some(t => typeof t !== 'string')) fail(422, 'Pilihan tim tidak valid.');
  if (!uniq.length) return uniq;
  const found = new Set((await sql(db, 'SELECT id FROM teams').all()).results.map(r => r.id));
  const missing = uniq.filter(t => !found.has(t));
  if (missing.length) fail(422, 'Ada tim yang tidak ditemukan. Muat ulang halaman.');
  return uniq;
}

export async function setUserTeams(db, userId, ids) {
  const teams = await assertTeams(db, ids);
  await db.batch([
    db.prepare('DELETE FROM user_teams WHERE user_id=?').bind(userId),
    ...teams.map(t => db.prepare('INSERT INTO user_teams(user_id,team_id) VALUES(?,?)').bind(userId, t))
  ]);
  return teams;
}

// Tim efektif sebuah materi. Quiz yang ditautkan ke course mengikuti audiens course-nya.
export function audienceOf(item, kind, catalog) {
  if (kind === 'quiz' && item.course) {
    const c = catalog.courses.find(x => x.id === item.course);
    if (c) return c.teams || [];
  }
  return item.teams || [];
}
export const canSee = (aud, teams) => !aud.length || aud.some(t => teams.includes(t));

// Katalog yang boleh dilihat seorang peserta.
export function scopeCatalog(catalog, teams) {
  return {
    courses: catalog.courses.filter(c => canSee(c.teams || [], teams)),
    quizzes: catalog.quizzes.filter(q => canSee(audienceOf(q, 'quiz', catalog), teams)),
    articles: catalog.articles.filter(a => canSee(a.teams || [], teams)),
    sops: (catalog.sops || []).filter(x => canSee(x.teams || [], teams))
  };
}
