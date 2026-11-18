// Memuat katalog materi yang sudah publish dari database.
import {sql} from './http.mjs';

const iso = v => v instanceof Date ? v.toISOString() : String(v);
const parseJson = v => typeof v === 'string' ? JSON.parse(v) : v;
const LIST = {course: 'courses', quiz: 'quizzes', article: 'articles'};

export async function loadCatalog(db) {
  const rows = await sql(db, 'SELECT kind,id,published,published_at FROM content_items WHERE published IS NOT NULL ORDER BY sort_order, created_at, id').all();
  const catalog = {courses: [], quizzes: [], articles: []};
  for (const r of rows.results) catalog[LIST[r.kind]]?.push({...parseJson(r.published), id: r.id, version: iso(r.published_at)});
  return catalog;
}

