'use strict';
/**
 * Course visibility and progress maths. computeProgress()/summarize() are pure.
 * Every function takes the server-resolved `user`; none accepts a user ID from the client.
 */
const { U, AppError } = require('./utils');
const C = require('./constants');
const Content = require('./content');

/** select rows where `col` is in ids (null = no filter). Large lists are filtered in memory to keep URLs short. */
async function selectIn(store, table, col, ids) {
  if (ids === null) return store.select(table);
  if (!ids.length) return [];
  if (ids.length <= 50) { const f = {}; f[col] = ids; return store.select(table, { in: f }); }
  const set = new Set(ids);
  return (await store.select(table)).filter((r) => set.has(r[col]));
}

function normalizeLessons(rows) {
  return rows.map((l) => ({
    id: l.lesson_id, title: l.title || '(Untitled lesson)', type: U.upper(l.lesson_type),
    order: U.toInt(l.sort_order, 1000000), required: l.is_required === true, row: l
  })).sort((a, b) => (a.order - b.order) || (a.id < b.id ? -1 : 1));
}

/** Course progress uses REQUIRED lessons only. No pass/score here: assessments belong to Phase 2. */
function computeProgress(lessons, progressRows) {
  const byLesson = {};
  progressRows.forEach((p) => {
    const cur = byLesson[p.lesson_id];
    if (!cur || (cur.status !== 'COMPLETED' && p.status === 'COMPLETED')) byLesson[p.lesson_id] = p;
  });
  const lessonStatus = {};
  lessons.forEach((l) => {
    const s = byLesson[l.id] ? U.upper(byLesson[l.id].status) : 'NOT_STARTED';
    lessonStatus[l.id] = C.LESSON_STATUS.indexOf(s) >= 0 ? s : 'NOT_STARTED';
  });
  const required = lessons.filter((l) => l.required);
  const done = required.filter((l) => lessonStatus[l.id] === 'COMPLETED').length;
  const touched = lessons.some((l) => lessonStatus[l.id] !== 'NOT_STARTED');
  const status = (required.length > 0 && done === required.length) ? 'COMPLETED' : (touched ? 'IN_PROGRESS' : 'NOT_STARTED');

  let resume = lessons.length ? lessons[0].id : null;
  let last = null;
  lessons.forEach((l) => {
    const p = byLesson[l.id];
    if (p && p.last_accessed_at && (!last || p.last_accessed_at > last.at)) last = { id: l.id, at: p.last_accessed_at };
  });
  if (last) {
    resume = last.id;
    if (lessonStatus[last.id] === 'COMPLETED') {
      const i = lessons.findIndex((l) => l.id === last.id);
      const next = lessons.slice(i + 1).find((l) => lessonStatus[l.id] !== 'COMPLETED');
      if (next) resume = next.id;
    }
  }
  return {
    requiredTotal: required.length, requiredCompleted: done,
    percent: required.length ? Math.round(done * 100 / required.length) : 0,
    status, resumeLessonId: resume, lessonStatus
  };
}

function summarize(enrollment, course, lessons, progressRows, today) {
  const p = computeProgress(lessons, progressRows);
  const due = U.isDate(enrollment.due_date) ? enrollment.due_date : '';
  return {
    courseId: course.course_id, title: course.title || '(Untitled course)', description: course.description || '',
    category: course.category || '', durationMinutes: Math.max(0, U.toInt(course.duration_minutes, 0)),
    dueDate: due, overdue: !!due && due < today && p.status !== 'COMPLETED',
    status: p.status, percent: p.percent, requiredCompleted: p.requiredCompleted, requiredTotal: p.requiredTotal,
    resumeLessonId: p.resumeLessonId, lessonCount: lessons.length, assignedAt: enrollment.assigned_at
  };
}

/** Load everything needed to summarise the given users (null = all users). */
async function load(store, userIds) {
  const enrollments = (await selectIn(store, 'enrollments', 'user_id', userIds)).filter((e) => U.upper(e.status) !== 'CANCELLED');
  const courseIds = Array.from(new Set(enrollments.map((e) => e.course_id)));
  const courses = userIds === null ? await store.select('courses') : await selectIn(store, 'courses', 'course_id', courseIds);
  const ids = courses.map((c) => c.course_id);
  const lessonRows = userIds === null ? await store.select('lessons') : await selectIn(store, 'lessons', 'course_id', ids);
  const progress = await selectIn(store, 'lesson_progress', 'user_id', userIds);
  const courseById = {}; courses.forEach((c) => { courseById[c.course_id] = c; });
  const grouped = {}; lessonRows.forEach((l) => { (grouped[l.course_id] = grouped[l.course_id] || []).push(l); });
  const lessonsByCourse = {}; Object.keys(grouped).forEach((k) => { lessonsByCourse[k] = normalizeLessons(grouped[k]); });
  const progByKey = {}; progress.forEach((p) => { const k = p.user_id + '|' + p.course_id; (progByKey[k] = progByKey[k] || []).push(p); });
  return { enrollments, courseById, lessonsByCourse, progByKey, courses };
}

function rowsForUser(userId, data, today) {
  const seen = {}; const out = [];
  data.enrollments.forEach((e) => {
    if (e.user_id !== userId || seen[e.course_id]) return;
    const c = data.courseById[e.course_id];
    if (!c || c.is_published !== true) return;
    seen[e.course_id] = true;
    out.push(summarize(e, c, data.lessonsByCourse[e.course_id] || [], data.progByKey[userId + '|' + e.course_id] || [], today));
  });
  return out;
}

async function listForUser(store, user) {
  const rows = rowsForUser(user.user_id, await load(store, [user.user_id]), U.today());
  rows.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.dueDate !== b.dueDate) return !a.dueDate ? 1 : (!b.dueDate ? -1 : (a.dueDate < b.dueDate ? -1 : 1));
    return a.title < b.title ? -1 : 1;
  });
  return rows;
}

/** Central access gate: the course must be published AND actively assigned to THIS user. */
async function access(store, user, courseId) {
  const enr = (await store.select('enrollments', { eq: { user_id: user.user_id, course_id: courseId } }))
    .find((e) => U.upper(e.status) !== 'CANCELLED');
  const course = (await store.select('courses', { eq: { course_id: courseId } }))[0];
  if (!enr || !course || course.is_published !== true) throw new AppError('NOT_FOUND', 'This course is not available to you.');
  return { enrollment: enr, course };
}

async function detail(store, user, courseId) {
  const ctx = await access(store, user, courseId);
  const lessons = normalizeLessons(await store.select('lessons', { eq: { course_id: courseId } }));
  const mine = await store.select('lesson_progress', { eq: { user_id: user.user_id, course_id: courseId } });
  const sum = summarize(ctx.enrollment, ctx.course, lessons, mine, U.today());
  const status = computeProgress(lessons, mine).lessonStatus;
  sum.overviewUrl = Content.safeLink(ctx.course.content_url);
  return {
    course: sum, resumeLessonId: sum.resumeLessonId,
    lessons: lessons.map((l) => ({ lessonId: l.id, title: l.title, type: l.type, required: l.required, status: status[l.id] }))
  };
}

module.exports = { normalizeLessons, computeProgress, summarize, load, rowsForUser, listForUser, access, detail, selectIn };
