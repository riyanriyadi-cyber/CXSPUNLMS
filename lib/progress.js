'use strict';
/**
 * The only module that writes lesson_progress / enrollment status. Safe for repeated and concurrent requests:
 * the table's primary key (user, course, lesson) forbids duplicates, inserts that lose a race are retried as
 * updates, and "complete" is a guarded UPDATE (… WHERE status <> 'COMPLETED') so completed_at is set only once.
 */
const { U, AppError } = require('./utils');
const Courses = require('./courses');
const Content = require('./content');

async function record(store, user, courseId, lessonId, action) {
  const ctx = await Courses.access(store, user, courseId);
  const lessons = Courses.normalizeLessons(await store.select('lessons', { eq: { course_id: courseId } }));
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new AppError('NOT_FOUND', 'This lesson was not found in the course.');

  const now = U.nowIso();
  const key = { user_id: user.user_id, course_id: courseId, lesson_id: lessonId };
  const getRec = async () => (await store.select('lesson_progress', { eq: key }))[0];
  let rec = await getRec();
  if (!rec) {
    try {
      await store.insert('lesson_progress', [Object.assign({}, key, {
        status: action === 'COMPLETE' ? 'COMPLETED' : 'IN_PROGRESS', started_at: now,
        completed_at: action === 'COMPLETE' ? now : null, last_accessed_at: now
      })]);
      rec = null;
    } catch (e) {
      if (e.code !== 'DUPLICATE') throw e;
      rec = await getRec(); // lost a race with a parallel request: continue as an update
    }
  }
  if (rec) {
    if (action === 'COMPLETE' && rec.status !== 'COMPLETED') {
      await store.update('lesson_progress', { status: 'COMPLETED', completed_at: now, started_at: rec.started_at || now, last_accessed_at: now },
        { eq: key, neq: { status: 'COMPLETED' } });
    } else if (action === 'OPEN' && rec.status === 'NOT_STARTED') {
      await store.update('lesson_progress', { status: 'IN_PROGRESS', started_at: rec.started_at || now, last_accessed_at: now },
        { eq: Object.assign({}, key, { status: 'NOT_STARTED' }) });
    } else {
      await store.update('lesson_progress', { last_accessed_at: now }, { eq: key });
    }
  }

  const mine = await store.select('lesson_progress', { eq: { user_id: user.user_id, course_id: courseId } });
  const prog = Courses.computeProgress(lessons, mine);
  const enrStatus = prog.status === 'COMPLETED' ? 'COMPLETED' : (prog.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'ASSIGNED');
  if (U.upper(ctx.enrollment.status) !== enrStatus) {
    await store.update('enrollments', { status: enrStatus }, { eq: { enrollment_id: ctx.enrollment.enrollment_id } });
  }
  return { lesson, prog };
}

const publicProgress = (p) => ({ percent: p.percent, requiredCompleted: p.requiredCompleted, requiredTotal: p.requiredTotal, status: p.status });

async function openLesson(store, user, courseId, lessonId) {
  const r = await record(store, user, courseId, lessonId, 'OPEN');
  return {
    lesson: { lessonId: r.lesson.id, title: r.lesson.title, type: r.lesson.type, required: r.lesson.required,
      status: r.prog.lessonStatus[r.lesson.id], content: Content.resolve(r.lesson.row) },
    progress: publicProgress(r.prog)
  };
}

async function completeLesson(store, user, courseId, lessonId) {
  const r = await record(store, user, courseId, lessonId, 'COMPLETE');
  return { lesson: { lessonId: r.lesson.id, status: r.prog.lessonStatus[r.lesson.id] }, progress: publicProgress(r.prog) };
}

module.exports = { openLesson, completeLesson };
