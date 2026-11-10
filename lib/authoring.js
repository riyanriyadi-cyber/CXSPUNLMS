'use strict';
/**
 * Course and lesson management for non-technical admins (LMS_ADMIN, SUPER_ADMIN).
 * Messages are written in plain language because the people reading them are not developers.
 */
const { U, AppError } = require('./utils');
const C = require('./constants');
const Auth = require('./auth');
const Courses = require('./courses');
const Content = require('./content');

const guard = (user) => Auth.requireRole(user, C.ADMIN_ROLES);

async function getCourseRow(store, courseId) {
  const course = (await store.select('courses', { eq: { course_id: courseId } }))[0];
  if (!course) throw new AppError('NOT_FOUND', 'That course was not found.');
  return course;
}
const lessonsOf = async (store, courseId) => Courses.normalizeLessons(await store.select('lessons', { eq: { course_id: courseId } }));
const touch = (store, courseId) => store.update('courses', { updated_at: U.nowIso() }, { eq: { course_id: courseId } });

function lessonView(l) {
  return { lessonId: l.id, title: l.title, type: l.type, contentText: l.row.content_text, contentUrl: l.row.content_url, required: l.required, order: l.order };
}

async function listCourses(store, user) {
  guard(user);
  const [courses, lessons, enrollments] = await Promise.all([store.select('courses'), store.select('lessons'), store.select('enrollments')]);
  const lc = {}; lessons.forEach((l) => { lc[l.course_id] = (lc[l.course_id] || 0) + 1; });
  const ec = {}; enrollments.filter((e) => e.status !== 'CANCELLED').forEach((e) => { ec[e.course_id] = (ec[e.course_id] || 0) + 1; });
  return courses.map((c) => ({
    courseId: c.course_id, title: c.title, category: c.category, published: c.is_published === true,
    lessonCount: lc[c.course_id] || 0, assignedCount: ec[c.course_id] || 0, updatedAt: c.updated_at
  })).sort((a, b) => (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1));
}

async function getCourse(store, user, courseId) {
  guard(user);
  courseId = U.requireId(courseId, 'course');
  const c = await getCourseRow(store, courseId);
  const lessons = await lessonsOf(store, courseId);
  const enrolled = (await store.select('enrollments', { eq: { course_id: courseId } })).filter((e) => e.status !== 'CANCELLED').length;
  return {
    course: { courseId: c.course_id, title: c.title, description: c.description, category: c.category,
      durationMinutes: c.duration_minutes, overviewUrl: c.content_url, isPublished: c.is_published === true },
    lessons: lessons.map(lessonView), assignedCount: enrolled,
    categories: Array.from(new Set((await store.select('courses')).map((x) => x.category).filter(Boolean))).sort()
  };
}

async function saveCourse(store, user, p) {
  guard(user);
  if (!p || typeof p !== 'object') throw new AppError('INVALID_INPUT', 'Missing course details.');
  const L = C.LIMITS;
  const fields = {
    title: U.cleanText(p.title, 'Title', L.TITLE, true),
    description: U.cleanText(p.description, 'Description', L.DESCRIPTION, false),
    category: U.cleanText(p.category, 'Category', L.CATEGORY, false),
    duration_minutes: p.durationMinutes === '' || p.durationMinutes == null ? 0 : U.toInt(p.durationMinutes, NaN),
    content_url: ''
  };
  if (!Number.isInteger(fields.duration_minutes) || fields.duration_minutes < 0 || fields.duration_minutes > 10000) {
    throw new AppError('INVALID_INPUT', 'Duration must be a whole number of minutes (0 to 10000).');
  }
  const link = String(p.overviewUrl || '').trim();
  if (link) {
    if (!Content.parse(link)) throw new AppError('INVALID_INPUT', 'The materials link must be a complete web address starting with https://');
    fields.content_url = link;
  }
  fields.updated_at = U.nowIso();

  if (!p.courseId) { // new courses always start as drafts: add lessons first, then publish
    const row = Object.assign({ course_id: U.newId(), is_published: false, created_by: user.user_id, created_at: U.nowIso(), passing_score: null }, fields);
    await store.insert('courses', [row]);
    return { courseId: row.course_id, created: true };
  }
  const courseId = U.requireId(p.courseId, 'course');
  await getCourseRow(store, courseId);
  const publish = U.asBool(p.isPublished);
  if (publish) {
    const lessons = await lessonsOf(store, courseId);
    if (!lessons.some((l) => l.required)) throw new AppError('INVALID_INPUT', 'Add at least one required lesson before publishing. Progress is calculated from required lessons.');
  }
  await store.update('courses', Object.assign({ is_published: publish }, fields), { eq: { course_id: courseId } });
  return { courseId, created: false };
}

async function deleteCourse(store, user, courseId) {
  guard(user);
  courseId = U.requireId(courseId, 'course');
  await getCourseRow(store, courseId);
  const any = await store.select('enrollments', { eq: { course_id: courseId }, limit: 1 });
  if (any.length) throw new AppError('IN_USE', 'Employees have been assigned this course, so it cannot be deleted. Unpublish it instead and their records stay safe.');
  await store.remove('courses', { eq: { course_id: courseId } }); // lessons are removed with it
  return { deleted: true };
}

async function checkPublishedKeepsRequired(course, lessonsAfter) {
  if (course.is_published === true && !lessonsAfter.some((l) => l.required)) {
    throw new AppError('INVALID_INPUT', 'A published course needs at least one required lesson. Unpublish the course first, or keep a lesson required.');
  }
}

async function saveLesson(store, user, p) {
  guard(user);
  if (!p || typeof p !== 'object') throw new AppError('INVALID_INPUT', 'Missing lesson details.');
  const courseId = U.requireId(p.courseId, 'course');
  const course = await getCourseRow(store, courseId);
  const L = C.LIMITS;
  const type = U.upper(p.lessonType);
  if (C.LESSON_TYPES.indexOf(type) < 0) throw new AppError('INVALID_INPUT', 'Choose a lesson type.');
  const title = U.cleanText(p.title, 'Lesson title', L.TITLE, true);
  const text = U.cleanText(p.contentText, type === 'TEXT' ? 'Lesson text' : 'Caption', type === 'TEXT' ? L.LESSON_TEXT : L.CAPTION, type === 'TEXT');
  let url = '';
  if (type !== 'TEXT') {
    url = String(p.contentUrl || '').trim();
    if (!url) throw new AppError('INVALID_INPUT', 'Paste the link for this lesson.');
    const r = Content.resolve({ lesson_type: type, content_url: url, content_text: '' });
    if (r.kind === 'unsupported') throw new AppError('INVALID_INPUT', r.note);
  }
  const required = p.isRequired === undefined ? true : U.asBool(p.isRequired);
  const lessons = await lessonsOf(store, courseId);
  const fields = { title, lesson_type: type, content_text: text, content_url: url, is_required: required, updated_at: U.nowIso() };

  if (!p.lessonId) {
    const next = lessons.reduce((m, l) => Math.max(m, l.order < 1000000 ? l.order : 0), 0) + 1;
    const row = Object.assign({ lesson_id: U.newId(), course_id: courseId, sort_order: next, created_at: U.nowIso() }, fields);
    await store.insert('lessons', [row]);
    await touch(store, courseId);
    return { lessonId: row.lesson_id, created: true };
  }
  const lessonId = U.requireId(p.lessonId, 'lesson');
  const cur = lessons.find((l) => l.id === lessonId);
  if (!cur) throw new AppError('NOT_FOUND', 'That lesson was not found in this course.');
  await checkPublishedKeepsRequired(course, lessons.map((l) => (l.id === lessonId ? { required } : l)));
  await store.update('lessons', fields, { eq: { lesson_id: lessonId, course_id: courseId } });
  await touch(store, courseId);
  return { lessonId, created: false };
}

async function deleteLesson(store, user, courseId, lessonId) {
  guard(user);
  courseId = U.requireId(courseId, 'course'); lessonId = U.requireId(lessonId, 'lesson');
  const course = await getCourseRow(store, courseId);
  const lessons = await lessonsOf(store, courseId);
  if (!lessons.some((l) => l.id === lessonId)) throw new AppError('NOT_FOUND', 'That lesson was not found in this course.');
  await checkPublishedKeepsRequired(course, lessons.filter((l) => l.id !== lessonId));
  await store.remove('lessons', { eq: { lesson_id: lessonId, course_id: courseId } }); // learners' progress on it goes too
  await touch(store, courseId);
  return { deleted: true };
}

/** Move a lesson up or down. Order numbers are re-written as 1..n so ties and gaps can never confuse the order. */
async function moveLesson(store, user, courseId, lessonId, direction) {
  guard(user);
  courseId = U.requireId(courseId, 'course'); lessonId = U.requireId(lessonId, 'lesson');
  if (direction !== 'up' && direction !== 'down') throw new AppError('INVALID_INPUT', 'Direction must be up or down.');
  await getCourseRow(store, courseId);
  const lessons = await lessonsOf(store, courseId);
  const i = lessons.findIndex((l) => l.id === lessonId);
  if (i < 0) throw new AppError('NOT_FOUND', 'That lesson was not found in this course.');
  const j = direction === 'up' ? i - 1 : i + 1;
  if (j >= 0 && j < lessons.length) { const t = lessons[i]; lessons[i] = lessons[j]; lessons[j] = t; }
  for (let k = 0; k < lessons.length; k++) {
    if (lessons[k].order !== k + 1) await store.update('lessons', { sort_order: k + 1 }, { eq: { lesson_id: lessons[k].id } });
  }
  await touch(store, courseId);
  return { moved: j >= 0 && j < lessons.length };
}

/** Shows an admin exactly what a learner will see. Records nothing. */
async function previewLesson(store, user, courseId, lessonId) {
  guard(user);
  courseId = U.requireId(courseId, 'course'); lessonId = U.requireId(lessonId, 'lesson');
  const l = (await lessonsOf(store, courseId)).find((x) => x.id === lessonId);
  if (!l) throw new AppError('NOT_FOUND', 'That lesson was not found in this course.');
  return { lesson: { lessonId: l.id, title: l.title, type: l.type, required: l.required, content: Content.resolve(l.row) } };
}

module.exports = { listCourses, getCourse, saveCourse, deleteCourse, saveLesson, deleteLesson, moveLesson, previewLesson };
