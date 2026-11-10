'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { fixture } = require('./helpers');
const ADM = 'admin@spun.test', SUP = 'super@spun.test', EMP = 'emp1@spun.test';

async function newCourse(f, extra) { return (await f.data(ADM, 'adminSaveCourse', Object.assign({ title: 'Onboarding', description: 'Welcome', category: 'HR', durationMinutes: 30 }, extra))).courseId; }
const text = (f, courseId, title, extra) => f.data(ADM, 'adminSaveLesson', Object.assign({ courseId, title, lessonType: 'TEXT', contentText: 'Hello ' + title, isRequired: true }, extra));

test('authoring: a new course starts as a draft and employees cannot see it', async () => {
  const f = await fixture(); const id = await newCourse(f);
  const c = (await f.data(ADM, 'adminGetCourse', id)).course; assert.strictEqual(c.isPublished, false); assert.strictEqual(c.title, 'Onboarding');
  assert.ok(!(await f.data(EMP, 'listMyCourses')).some((x) => x.courseId === id));
});
test('authoring: course form is validated with plain-language messages', async () => {
  const f = await fixture();
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { title: '  ' })).message, /Title is required/);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { title: 'x', durationMinutes: 'abc' })).message, /whole number/);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { title: 'x', durationMinutes: -5 })).message, /whole number/);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { title: 'x', overviewUrl: 'www.example.com' })).message, /https/);
  await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { title: 'x'.repeat(151) });
  await f.code('NOT_FOUND', ADM, 'adminSaveCourse', { courseId: 'nope', title: 'x' });
  await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', null);
});
test('authoring: lessons get consecutive order, and invalid links are explained', async () => {
  const f = await fixture(); const id = await newCourse(f);
  await text(f, id, 'One'); await text(f, id, 'Two');
  await f.data(ADM, 'adminSaveLesson', { courseId: id, title: 'Video', lessonType: 'VIDEO', contentUrl: 'https://youtu.be/dQw4w9WgXcQ', isRequired: false });
  const d = await f.data(ADM, 'adminGetCourse', id); assert.deepStrictEqual(d.lessons.map((l) => [l.title, l.order, l.required]), [['One', 1, true], ['Two', 2, true], ['Video', 3, false]]);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveLesson', { courseId: id, title: 'V', lessonType: 'VIDEO', contentUrl: 'https://example.com/v.mp4' })).message, /YouTube, Vimeo and Google Drive/);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveLesson', { courseId: id, title: 'D', lessonType: 'DRIVE', contentUrl: 'drive.google.com/file/d/abc' })).message, /https/);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveLesson', { courseId: id, title: 'I', lessonType: 'IMAGE', contentUrl: '' })).message, /Paste the link/);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveLesson', { courseId: id, title: 'T', lessonType: 'TEXT', contentText: '' })).message, /Lesson text is required/);
  await f.code('INVALID_INPUT', ADM, 'adminSaveLesson', { courseId: id, title: 'T', lessonType: 'FLASH', contentText: 'x' });
  await f.code('NOT_FOUND', ADM, 'adminSaveLesson', { courseId: 'nope', title: 'T', lessonType: 'TEXT', contentText: 'x' });
});
test('authoring: publishing needs a required lesson; then learners see edits after assignment', async () => {
  const f = await fixture(); const id = await newCourse(f);
  assert.match((await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { courseId: id, title: 'Onboarding', isPublished: true })).message, /at least one required lesson/);
  await text(f, id, 'One', { isRequired: false });
  await f.code('INVALID_INPUT', ADM, 'adminSaveCourse', { courseId: id, title: 'Onboarding', isPublished: true });
  const l = await text(f, id, 'Two'); await f.data(ADM, 'adminSaveCourse', { courseId: id, title: 'Onboarding', isPublished: true });
  const r = await f.data(ADM, 'assignCourse', { courseId: id, userIds: ['u_emp1'] }); assert.strictEqual(r.assigned, 1);
  assert.ok((await f.data(EMP, 'listMyCourses')).some((c) => c.courseId === id));
  await f.data(ADM, 'adminSaveLesson', { courseId: id, lessonId: l.lessonId, title: 'Two (edited)', lessonType: 'TEXT', contentText: 'New text', isRequired: true });
  const opened = await f.data(EMP, 'openLesson', id, l.lessonId); assert.strictEqual(opened.lesson.title, 'Two (edited)'); assert.strictEqual(opened.lesson.content.text, 'New text');
});
test('authoring: a published course must keep at least one required lesson', async () => {
  const f = await fixture(); const only = 'l1';
  await f.data(ADM, 'adminDeleteLesson', 'c_safety', 'l2');
  await f.code('INVALID_INPUT', ADM, 'adminDeleteLesson', 'c_safety', only);
  await f.code('INVALID_INPUT', ADM, 'adminSaveLesson', { courseId: 'c_safety', lessonId: only, title: 'x', lessonType: 'TEXT', contentText: 'x', isRequired: false });
  await f.data(ADM, 'adminSaveCourse', { courseId: 'c_safety', title: 'c_safety title', isPublished: false });
  await f.data(ADM, 'adminDeleteLesson', 'c_safety', only);
});
test('authoring: move up/down renumbers 1..n, handles edges and keeps the learner\'s order in sync', async () => {
  const f = await fixture(); const id = await newCourse(f);
  const a = (await text(f, id, 'A')).lessonId, b = (await text(f, id, 'B')).lessonId, c = (await text(f, id, 'C')).lessonId;
  const order = async () => (await f.data(ADM, 'adminGetCourse', id)).lessons.map((l) => l.title + l.order).join(',');
  await f.data(ADM, 'adminMoveLesson', id, c, 'up'); assert.strictEqual(await order(), 'A1,C2,B3');
  await f.data(ADM, 'adminMoveLesson', id, a, 'up'); assert.strictEqual(await order(), 'A1,C2,B3');
  assert.strictEqual((await f.data(ADM, 'adminMoveLesson', id, b, 'down')).moved, false);
  await f.data(ADM, 'adminMoveLesson', id, a, 'down'); assert.strictEqual(await order(), 'C1,A2,B3');
  await f.code('INVALID_INPUT', ADM, 'adminMoveLesson', id, a, 'sideways'); await f.code('NOT_FOUND', ADM, 'adminMoveLesson', id, 'nope', 'up');
  f.store.t.lessons.filter((l) => l.course_id === id).forEach((l) => { l.sort_order = 5; }); // simulate ties from manual edits
  await f.data(ADM, 'adminMoveLesson', id, a, 'up'); assert.ok(/1,.*2,.*3/.test((await f.data(ADM, 'adminGetCourse', id)).lessons.map((l) => l.order).join(',')));
});
test('authoring: deleting a lesson removes its progress; deleting a course in use is refused', async () => {
  const f = await fixture(); await f.data(EMP, 'completeLesson', 'c_safety', 'l1');
  await f.data(ADM, 'adminDeleteLesson', 'c_safety', 'l1'); assert.strictEqual(f.store.t.lesson_progress.length, 0);
  assert.match((await f.code('IN_USE', ADM, 'adminDeleteCourse', 'c_safety')).message, /Unpublish it instead/);
  const id = await newCourse(f); await text(f, id, 'One'); await f.data(ADM, 'adminDeleteCourse', id);
  assert.ok(!f.store.t.courses.some((c) => c.course_id === id) && !f.store.t.lessons.some((l) => l.course_id === id));
  await f.code('NOT_FOUND', ADM, 'adminDeleteCourse', id);
});
test('authoring: preview shows learner content and records nothing', async () => {
  const f = await fixture(); const id = await newCourse(f);
  const l = (await f.data(ADM, 'adminSaveLesson', { courseId: id, title: 'V', lessonType: 'VIDEO', contentUrl: 'https://youtu.be/dQw4w9WgXcQ', contentText: 'Watch' })).lessonId;
  const p = await f.data(ADM, 'adminPreviewLesson', id, l); assert.strictEqual(p.lesson.content.kind, 'embed'); assert.strictEqual(f.store.t.lesson_progress.length, 0);
});
test('authoring: listing shows counts; unpublish keeps assignments and hides the course from learners', async () => {
  const f = await fixture(); const list = await f.data(ADM, 'adminListCourses'); const s = list.find((c) => c.courseId === 'c_safety');
  assert.deepStrictEqual([s.lessonCount, s.assignedCount, s.published], [3, 2, true]);
  await f.data(ADM, 'adminSaveCourse', { courseId: 'c_safety', title: 'c_safety title', isPublished: false });
  assert.deepStrictEqual(await f.data(EMP, 'listMyCourses'), []);
  assert.strictEqual(f.store.t.enrollments.filter((e) => e.course_id === 'c_safety').length, 2);
});

// ----- bulk assignment -----
test('assign: many employees at once; duplicates, inactive and unknown people are skipped with reasons', async () => {
  const f = await fixture();
  const r = await f.data(ADM, 'assignCourse', { courseId: 'c_safety', userIds: ['u_emp1', 'u_emp3', 'u_off', 'ghost', 'u_emp3'], dueDate: '2099-12-31' });
  assert.strictEqual(r.assigned, 1); assert.deepStrictEqual(r.skipped.map((s) => s.reason).sort(), ['already assigned', 'not found or inactive', 'not found or inactive']);
  assert.strictEqual(f.store.t.enrollments.find((e) => e.user_id === 'u_emp3' && e.course_id === 'c_safety').due_date, '2099-12-31');
});
test('assign: validation and re-assignment after cancellation', async () => {
  const f = await fixture();
  await f.code('INVALID_INPUT', ADM, 'assignCourse', { courseId: 'c_safety', userIds: [] }); await f.code('INVALID_INPUT', ADM, 'assignCourse', { courseId: 'c_safety', userIds: ['u_emp3'], dueDate: '2026-02-30' });
  await f.code('INVALID_INPUT', ADM, 'assignCourse', { courseId: 'c_safety', userIds: ['u_emp3'], dueDate: '2001-01-01' }); await f.code('INVALID_INPUT', ADM, 'assignCourse', { courseId: 'c_draft', userIds: ['u_emp3'] });
  await f.code('NOT_FOUND', ADM, 'assignCourse', { courseId: 'nope', userIds: ['u_emp3'] }); await f.code('INVALID_INPUT', ADM, 'assignCourse', { courseId: 'c_safety', userIds: Array.from({ length: 201 }, (_, i) => 'u' + i) });
  await f.store.update('enrollments', { status: 'CANCELLED' }, { eq: { enrollment_id: 'e1' } });
  assert.strictEqual((await f.data(ADM, 'assignCourse', { courseId: 'c_safety', userIds: ['u_emp1'] })).assigned, 1);
});

// ----- bulk user import -----
test('import users: adds employees, skips header, reports bad lines by number, keeps existing roles', async () => {
  const f = await fixture();
  const text = ['email, full name, department, manager email', 'new.one@spun.test, New One, Sales, lead@spun.test', 'bad-email, Nobody, X,', 'new.two@spun.test,,Sales,',
    'admin@spun.test, Renamed Admin, Finance,', 'new.one@spun.test, New One Again, Sales, lead@spun.test'].join('\n');
  const r = await f.data(SUP, 'importUsers', { text });
  assert.deepStrictEqual([r.added, r.updated], [1, 2]); assert.deepStrictEqual(r.errors.map((e) => e.line), [3, 4]);
  assert.strictEqual(f.store.t.users.find((u) => u.email === 'admin@spun.test').role, 'LMS_ADMIN');
  assert.strictEqual(f.store.t.users.find((u) => u.email === 'new.one@spun.test').full_name, 'New One Again');
  assert.deepStrictEqual((await f.data('lead@spun.test', 'getTeamProgress')).members.map((m) => m.fullName).sort(), ['New One Again', 'u_emp1 name', 'u_emp2 name']);
  await f.code('INVALID_INPUT', SUP, 'importUsers', { text: '' }); await f.code('INVALID_INPUT', SUP, 'importUsers', { text: Array.from({ length: 301 }, (_, i) => 'p' + i + '@spun.test,P').join('\n') });
  await f.code('FORBIDDEN', ADM, 'importUsers', { text: 'a@spun.test,A' });
});
