'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { fixture } = require('./helpers');
const Content = require('../lib/content');
const Courses = require('../lib/courses');
const { U } = require('../lib/utils');
const EMP = 'emp1@spun.test';

// ===== Authentication =====
test('auth: registered active employee is admitted with the role from the database', async () => {
  const { data } = await fixture(); const s = await data('EMP1@spun.test', 'getSession');
  assert.deepStrictEqual([s.role, s.isAdmin, s.canViewTeam], ['EMPLOYEE', false, false]);
});
test('auth: unregistered, inactive, empty identity and wrong domain are denied', async () => {
  const { code } = await fixture();
  await code('NOT_REGISTERED', 'stranger@spun.test', 'getSession');
  await code('INACTIVE', 'inactive@spun.test', 'getSession');
  await code('NO_IDENTITY', '', 'listMyCourses');
  process.env.ALLOWED_DOMAINS = 'spun.test';
  try { await code('DOMAIN_DENIED', 'someone@gmail.com', 'getSession'); } finally { process.env.ALLOWED_DOMAINS = ''; }
});
test('auth: unknown role fails closed', async () => {
  const { code, store } = await fixture(); store.t.users.find((u) => u.user_id === 'u_emp1').role = 'ROOT';
  await code('BAD_ROLE', EMP, 'getSession');
});
test('gmail: dots, +tags and googlemail.com resolve to the same registered person', async () => {
  const { store, data, code } = await fixture();
  await store.update('users', { email: 'riyan.riyadi@gmail.com', email_key: 'riyanriyadi@gmail.com' }, { eq: { user_id: 'u_emp1' } });
  for (const e of ['riyan.riyadi@gmail.com', 'riyanriyadi@gmail.com', 'Riyan.Riyadi+lms@googlemail.com']) assert.strictEqual((await data(e, 'getSession')).role, 'EMPLOYEE', e);
  await code('NOT_REGISTERED', 'someone.else@gmail.com', 'getSession');
});
test('gmail: saveUser updates (never duplicates) a dotted/tagged variant; team lead matching is canonical', async () => {
  const { data, store } = await fixture();
  assert.strictEqual((await data('super@spun.test', 'saveUser', { email: 'a.b@gmail.com', fullName: 'AB', role: 'EMPLOYEE', isActive: true, managerEmail: 'Lead.er@gmail.com' })).created, true);
  assert.strictEqual((await data('super@spun.test', 'saveUser', { email: 'ab+x@gmail.com', fullName: 'AB 2', role: 'EMPLOYEE', isActive: true, managerEmail: 'lead.er@gmail.com' })).created, false);
  assert.strictEqual(store.t.users.filter((u) => u.email_key === 'ab@gmail.com').length, 1);
  await data('super@spun.test', 'saveUser', { email: 'lead.er@gmail.com', fullName: 'Leader', role: 'TEAM_LEAD', isActive: true });
  assert.deepStrictEqual((await data('leader@gmail.com', 'getTeamProgress')).members.map((m) => m.fullName), ['AB 2']);
});

// ===== Roles =====
test('roles: employee blocked from every admin, team, user and authoring function', async () => {
  const { code } = await fixture();
  for (const [fn, args] of [['getAdminSummary', []], ['getAdminOptions', []], ['getTeamProgress', []], ['listUsers', []], ['assignCourse', [{}]], ['saveUser', [{}]],
    ['importUsers', [{ text: 'a@b.co' }]], ['adminListCourses', []], ['adminGetCourse', ['c_safety']], ['adminSaveCourse', [{ title: 'x' }]], ['adminDeleteCourse', ['c_safety']],
    ['adminSaveLesson', [{}]], ['adminDeleteLesson', ['c_safety', 'l1']], ['adminMoveLesson', ['c_safety', 'l1', 'up']], ['adminPreviewLesson', ['c_safety', 'l1']]]) {
    await code('FORBIDDEN', EMP, fn, ...args);
  }
});
test('roles: team lead sees only direct reports and cannot use admin functions', async () => {
  const { data, code } = await fixture(); const d = await data('lead@spun.test', 'getTeamProgress');
  assert.strictEqual(d.scope, 'DIRECT_REPORTS'); assert.deepStrictEqual(d.members.map((m) => m.userId).sort(), ['u_emp1', 'u_emp2']);
  await code('FORBIDDEN', 'lead@spun.test', 'getAdminSummary'); await code('FORBIDDEN', 'lead@spun.test', 'adminSaveCourse', { title: 'x' });
});
test('roles: LMS admin gets aggregates only and cannot manage users', async () => {
  const { data, code } = await fixture(); const s = await data('admin@spun.test', 'getAdminSummary');
  assert.strictEqual(s.totals.courses, 3); assert.ok(!/emp1@spun/.test(JSON.stringify(s)), 'no personal data');
  await code('FORBIDDEN', 'admin@spun.test', 'listUsers'); await code('FORBIDDEN', 'admin@spun.test', 'saveUser', {});
  assert.strictEqual((await data('admin@spun.test', 'getTeamProgress')).scope, 'ALL');
});
test('roles: super admin manages users but cannot demote or deactivate self', async () => {
  const { data, code } = await fixture();
  assert.ok((await data('super@spun.test', 'saveUser', { email: 'New.Person@spun.test', fullName: 'New', role: 'EMPLOYEE', isActive: true })).created);
  await code('INVALID_INPUT', 'super@spun.test', 'saveUser', { email: 'super@spun.test', fullName: 'S', role: 'EMPLOYEE', isActive: true });
  await code('INVALID_INPUT', 'super@spun.test', 'saveUser', { email: 'super@spun.test', fullName: 'S', role: 'SUPER_ADMIN', isActive: false });
});

// ===== Visibility =====
test('visibility: only own, published, non-cancelled courses', async () => {
  const { data, store } = await fixture();
  assert.deepStrictEqual((await data(EMP, 'listMyCourses')).map((c) => c.courseId), ['c_safety']);
  assert.deepStrictEqual((await data('emp3@spun.test', 'listMyCourses')).map((c) => c.courseId), ['c_hidden']);
  await store.update('enrollments', { status: 'CANCELLED' }, { eq: { enrollment_id: 'e1' } });
  assert.deepStrictEqual(await data(EMP, 'listMyCourses'), []);
});
test('visibility: unassigned/unpublished/unknown courses and cross-course lessons return NOT_FOUND', async () => {
  const { code } = await fixture();
  for (const c of ['c_hidden', 'c_draft', 'c_nope']) await code('NOT_FOUND', EMP, 'getCourse', c);
  await code('NOT_FOUND', EMP, 'openLesson', 'c_safety', 'lh1');
});
test('visibility: overdue flag and due date', async () => {
  const { data } = await fixture(); const c = (await data(EMP, 'listMyCourses'))[0];
  assert.deepStrictEqual([c.overdue, c.dueDate], [true, '2020-01-01']);
});

// ===== Lessons and progress =====
test('progress: open sets IN_PROGRESS and is remembered for resume', async () => {
  const { data } = await fixture(); await data(EMP, 'openLesson', 'c_safety', 'l2'); const d = await data(EMP, 'getCourse', 'c_safety');
  assert.strictEqual(d.resumeLessonId, 'l2'); assert.strictEqual(d.course.status, 'IN_PROGRESS');
  assert.deepStrictEqual(d.lessons.map((l) => l.status), ['NOT_STARTED', 'IN_PROGRESS', 'NOT_STARTED']);
});
test('progress: completion persists, resume moves on, repeated completion is idempotent', async () => {
  const { data, store } = await fixture();
  await data(EMP, 'completeLesson', 'c_safety', 'l1'); const first = store.t.lesson_progress[0].completed_at;
  await new Promise((r) => setTimeout(r, 5)); await data(EMP, 'completeLesson', 'c_safety', 'l1'); await data(EMP, 'openLesson', 'c_safety', 'l1');
  assert.strictEqual(store.t.lesson_progress.length, 1); assert.strictEqual(store.t.lesson_progress[0].completed_at, first); assert.strictEqual(store.t.lesson_progress[0].status, 'COMPLETED');
  const d = await data(EMP, 'getCourse', 'c_safety'); assert.strictEqual(d.course.percent, 50); assert.strictEqual(d.resumeLessonId, 'l2');
});
test('progress: parallel duplicate requests create exactly one row and one completion time', async () => {
  const { call, store } = await fixture();
  const rs = await Promise.all([1, 2, 3, 4].map(() => call(EMP, 'completeLesson', 'c_safety', 'l1')));
  assert.ok(rs.every((r) => r.ok)); assert.strictEqual(store.t.lesson_progress.length, 1);
  assert.strictEqual(store.t.lesson_progress[0].status, 'COMPLETED');
});
test('progress: only required lessons count', async () => {
  const { data } = await fixture(); await data(EMP, 'completeLesson', 'c_safety', 'l3');
  const c = (await data(EMP, 'getCourse', 'c_safety')).course; assert.deepStrictEqual([c.percent, c.requiredCompleted, c.requiredTotal], [0, 0, 2]);
});
test('progress: all required done → COMPLETED, enrollment updated, no pass/score field', async () => {
  const { data, store } = await fixture(); await data(EMP, 'completeLesson', 'c_safety', 'l1'); const r = await data(EMP, 'completeLesson', 'c_safety', 'l2');
  assert.deepStrictEqual([r.progress.status, r.progress.percent], ['COMPLETED', 100]);
  assert.strictEqual(store.t.enrollments.find((e) => e.enrollment_id === 'e1').status, 'COMPLETED');
  assert.ok(!/pass|score/i.test(JSON.stringify(await data(EMP, 'getCourse', 'c_safety'))));
});
test('isolation: employees cannot see or change each other\'s progress; client identity args are ignored', async () => {
  const { data, code, store } = await fixture(); await data(EMP, 'completeLesson', 'c_safety', 'l1');
  assert.strictEqual((await data('emp2@spun.test', 'getCourse', 'c_safety')).course.percent, 0);
  await data('emp2@spun.test', 'completeLesson', 'c_safety', 'l2', 'u_emp1', 'emp1@spun.test');
  assert.deepStrictEqual(store.t.lesson_progress.map((p) => p.user_id + ':' + p.lesson_id).sort(), ['u_emp1:l1', 'u_emp2:l2']);
  await code('NOT_FOUND', EMP, 'completeLesson', 'c_hidden', 'lh1');
});
test('progress: malformed data (bad sort_order, orphan progress) does not break calculation', async () => {
  const { data, store } = await fixture(); store.t.lessons.find((l) => l.lesson_id === 'l2').sort_order = NaN;
  const d = await data(EMP, 'getCourse', 'c_safety'); assert.deepStrictEqual(d.lessons.map((l) => l.lessonId), ['l1', 'l3', 'l2']);
});

// ===== Validation =====
test('validation: malformed IDs, unknown functions and non-array args are rejected', async () => {
  const { code, call } = await fixture();
  for (const bad of ['', '../x', 'a b', 'x'.repeat(65), null, 42]) await code('INVALID_INPUT', EMP, 'getCourse', bad);
  await code('INVALID_INPUT', EMP, 'completeLesson', 'c_safety', "l1'); DROP TABLE users;--");
  await code('BAD_REQUEST', EMP, 'deleteEverything'); await code('BAD_REQUEST', EMP, 'constructor');
  assert.strictEqual((await call(EMP, 'getSession', 'ignored')).ok, true);
});
test('validation: lesson content resolver accepts safe links only', () => {
  const r = (type, url) => Content.resolve({ lesson_type: type, content_url: url, content_text: '' });
  assert.strictEqual(r('VIDEO', 'https://youtu.be/dQw4w9WgXcQ').src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.strictEqual(r('VIDEO', 'https://vimeo.com/123456789').src, 'https://player.vimeo.com/video/123456789');
  assert.strictEqual(r('DRIVE', 'https://drive.google.com/file/d/ABCDEFGHIJKLMNOP/view?usp=sharing').src, 'https://drive.google.com/file/d/ABCDEFGHIJKLMNOP/preview');
  assert.strictEqual(r('DRIVE', 'https://docs.google.com/document/d/ABCDEFGHIJKLMNOP/edit').src, 'https://docs.google.com/document/d/ABCDEFGHIJKLMNOP/preview');
  assert.strictEqual(r('DRIVE', 'https://drive.google.com/drive/folders/ABCDEFGHIJKLMNOP').kind, 'link');
  assert.strictEqual(r('IMAGE', 'https://example.com/a.png').kind, 'image');
  for (const u of ['javascript:alert(1)', 'http://example.com/a.png', 'data:text/html,x', 'https://evil.com@good.com/']) assert.strictEqual(r('IMAGE', u).kind, 'unsupported', u);
  assert.strictEqual(r('VIDEO', 'https://evil.example/watch?v=dQw4w9WgXcQ').kind, 'unsupported');
  assert.strictEqual(r('DRIVE', 'https://evil.example/file').kind, 'unsupported');
});
test('pure maths: progress with zero required lessons stays at 0 and never completes', () => {
  const lessons = Courses.normalizeLessons([{ lesson_id: 'a', course_id: 'c', is_required: false, sort_order: 1, lesson_type: 'TEXT', title: 'a' }]);
  const p = Courses.computeProgress(lessons, [{ lesson_id: 'a', status: 'COMPLETED', last_accessed_at: 'x' }]);
  assert.deepStrictEqual([p.percent, p.status], [0, 'IN_PROGRESS']);
  assert.strictEqual(U.canonEmail('A.B+c@Googlemail.com'), 'ab@gmail.com');
});
