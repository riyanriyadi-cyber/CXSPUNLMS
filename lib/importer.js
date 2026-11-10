'use strict';
/**
 * One-time migration: CSV exports of the old Google Sheet tabs → database. Keeps the original IDs so links and
 * progress stay valid. Rows are validated; bad rows are reported (never silently dropped) and parents are
 * inserted before children. Safe to re-run: records that already exist are skipped.
 */
const { U } = require('./utils');
const C = require('./constants');

/** Small RFC-4180 CSV parser (quotes, doubled quotes, commas and newlines inside quotes, CRLF, BOM). */
function parseCsv(text) {
  text = String(text).replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!nonEmpty.length) return [];
  const head = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r, i) => { const o = { _line: i + 2 }; head.forEach((h, k) => { o[h] = (r[k] === undefined ? '' : r[k]).trim(); }); return o; });
}

const bool = (v) => String(v).trim().toUpperCase() === 'TRUE';
const ts = (v) => { const d = new Date(v); return v && !isNaN(d) ? d.toISOString() : null; };

async function importAll(store, csv) {
  const report = { inserted: {}, skipped: [] };
  const bad = (table, line, why) => report.skipped.push({ table, line, why });
  const has = async (table, col) => { const s = new Set(); (await store.select(table)).forEach((r) => s.add(r[col])); return s; };
  const put = async (table, rows) => { for (const r of rows) { try { await store.insert(table, [r]); report.inserted[table] = (report.inserted[table] || 0) + 1; } catch (e) { if (e.code === 'DUPLICATE') continue; throw e; } } };

  // users
  const users = await has('users', 'user_id'); const keys = await has('users', 'email_key');
  const rows = [];
  parseCsv(csv.USERS || '').forEach((r) => {
    const email = U.normEmail(r.email); const role = U.upper(r.role) || 'EMPLOYEE';
    try { U.requireId(r.user_id, 'user_id'); } catch (e) { return bad('users', r._line, 'invalid user_id'); }
    if (!U.isEmail(email)) return bad('users', r._line, 'invalid email');
    if (C.ROLES.indexOf(role) < 0) return bad('users', r._line, 'unknown role "' + r.role + '"');
    const key = U.canonEmail(email);
    if (keys.has(key) || users.has(r.user_id)) return;
    keys.add(key); users.add(r.user_id);
    const mgr = U.normEmail(r.manager_email);
    rows.push({ user_id: r.user_id, email, email_key: key, full_name: (r.full_name || email).slice(0, 120), department: (r.department || '').slice(0, 80), role,
      manager_email: U.isEmail(mgr) ? mgr : '', manager_key: U.isEmail(mgr) ? U.canonEmail(mgr) : '', is_active: r.is_active === '' ? true : bool(r.is_active), created_at: ts(r.created_at) || U.nowIso() });
  });
  await put('users', rows);

  // courses
  const courses = await has('courses', 'course_id'); const courseRows = [];
  const allUsers = await has('users', 'user_id');
  parseCsv(csv.COURSES || '').forEach((r) => {
    try { U.requireId(r.course_id, 'course_id'); } catch (e) { return bad('courses', r._line, 'invalid course_id'); }
    if (!r.title) return bad('courses', r._line, 'missing title');
    if (courses.has(r.course_id)) return; courses.add(r.course_id);
    courseRows.push({ course_id: r.course_id, title: r.title.slice(0, 150), description: (r.description || '').slice(0, 2000), category: (r.category || '').slice(0, 60),
      content_url: /^https:\/\//i.test(r.content_url) ? r.content_url : '', duration_minutes: Math.max(0, Math.min(10000, U.toInt(r.duration_minutes, 0))), passing_score: null,
      is_published: bool(r.is_published), created_by: allUsers.has(r.created_by) ? r.created_by : null, created_at: U.nowIso(), updated_at: ts(r.updated_at) || U.nowIso() });
  });
  await put('courses', courseRows);

  // lessons
  const lessons = await has('lessons', 'lesson_id'); const knownCourses = await has('courses', 'course_id'); const lessonRows = [];
  parseCsv(csv.LESSONS || '').forEach((r) => {
    try { U.requireId(r.lesson_id, 'lesson_id'); } catch (e) { return bad('lessons', r._line, 'invalid lesson_id'); }
    if (!knownCourses.has(r.course_id)) return bad('lessons', r._line, 'course "' + r.course_id + '" not found');
    const type = U.upper(r.lesson_type);
    if (C.LESSON_TYPES.indexOf(type) < 0) return bad('lessons', r._line, 'unknown lesson_type "' + r.lesson_type + '"');
    if (!r.title) return bad('lessons', r._line, 'missing title');
    if (lessons.has(r.lesson_id)) return; lessons.add(r.lesson_id);
    lessonRows.push({ lesson_id: r.lesson_id, course_id: r.course_id, title: r.title.slice(0, 150), lesson_type: type, content_text: (r.content_text || '').slice(0, 20000),
      content_url: (r.content_url || '').slice(0, 2000), sort_order: U.toInt(r.sort_order, 1), is_required: r.is_required === '' ? true : bool(r.is_required), created_at: U.nowIso(), updated_at: U.nowIso() });
  });
  await put('lessons', lessonRows);

  // enrollments (one active per user+course)
  const enrolIds = await has('enrollments', 'enrollment_id'); const active = new Set(); const enrolRows = [];
  (await store.select('enrollments')).forEach((e) => { if (e.status !== 'CANCELLED') active.add(e.user_id + '|' + e.course_id); });
  parseCsv(csv.ENROLLMENTS || '').forEach((r) => {
    try { U.requireId(r.enrollment_id, 'enrollment_id'); } catch (e) { return bad('enrollments', r._line, 'invalid enrollment_id'); }
    if (!allUsers.has(r.user_id)) return bad('enrollments', r._line, 'user "' + r.user_id + '" not found');
    if (!knownCourses.has(r.course_id)) return bad('enrollments', r._line, 'course "' + r.course_id + '" not found');
    const status = U.upper(r.status) || 'ASSIGNED';
    if (C.ENROLLMENT_STATUS.indexOf(status) < 0) return bad('enrollments', r._line, 'unknown status "' + r.status + '"');
    if (enrolIds.has(r.enrollment_id)) return;
    const k = r.user_id + '|' + r.course_id;
    if (status !== 'CANCELLED') { if (active.has(k)) return bad('enrollments', r._line, 'duplicate active enrollment'); active.add(k); }
    enrolIds.add(r.enrollment_id);
    enrolRows.push({ enrollment_id: r.enrollment_id, user_id: r.user_id, course_id: r.course_id, assigned_at: ts(r.assigned_at) || U.nowIso(),
      due_date: U.isDate(r.due_date) ? r.due_date : null, assigned_by: allUsers.has(r.assigned_by) ? r.assigned_by : null, status });
  });
  await put('enrollments', enrolRows);

  // lesson progress (lesson must belong to the stated course)
  const lessonCourse = {}; (await store.select('lessons')).forEach((l) => { lessonCourse[l.lesson_id] = l.course_id; });
  const seen = new Set((await store.select('lesson_progress')).map((p) => p.user_id + '|' + p.course_id + '|' + p.lesson_id)); const progRows = [];
  parseCsv(csv.LESSON_PROGRESS || '').forEach((r) => {
    if (!allUsers.has(r.user_id)) return bad('lesson_progress', r._line, 'user not found');
    if (lessonCourse[r.lesson_id] !== r.course_id) return bad('lesson_progress', r._line, 'lesson not found in that course');
    const status = U.upper(r.status) || 'NOT_STARTED';
    if (C.LESSON_STATUS.indexOf(status) < 0) return bad('lesson_progress', r._line, 'unknown status "' + r.status + '"');
    const k = r.user_id + '|' + r.course_id + '|' + r.lesson_id; if (seen.has(k)) return; seen.add(k);
    progRows.push({ user_id: r.user_id, course_id: r.course_id, lesson_id: r.lesson_id, status, started_at: ts(r.started_at), completed_at: ts(r.completed_at), last_accessed_at: ts(r.last_accessed_at) });
  });
  await put('lesson_progress', progRows);
  return report;
}

module.exports = { importAll, parseCsv };
