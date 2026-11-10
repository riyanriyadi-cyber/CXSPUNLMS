'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { importAll, parseCsv } = require('../lib/importer');
const { MemoryStore, setStore } = require('../lib/store');
const { dispatch } = require('../lib/routes');

test('csv parser: quotes, commas, newlines inside cells, CRLF, BOM', () => {
  const r = parseCsv('\uFEFFa,b,c\r\n1,"x, y","line1\nline2"\r\n2,"say ""hi""",\r\n');
  assert.deepStrictEqual(r.map((x) => [x.a, x.b, x.c]), [['1', 'x, y', 'line1\nline2'], ['2', 'say "hi"', '']]);
});

const CSV = {
  USERS: 'user_id,email,full_name,department,role,manager_email,is_active,created_at\nusr_1,Riyan.Riyadi@gmail.com,Riyan,IT,SUPER_ADMIN,,TRUE,2026-01-01T00:00:00Z\nusr_2,emp@gmail.com,Emp,Ops,EMPLOYEE,riyanriyadi@gmail.com,TRUE,\nusr_3,riyanriyadi+x@gmail.com,Dup,Ops,EMPLOYEE,,TRUE,\nusr_4,bad,Bad,,EMPLOYEE,,TRUE,\nusr_5,r@gmail.com,R,,WIZARD,,TRUE,',
  COURSES: 'course_id,title,description,category,content_type,content_url,duration_minutes,passing_score,is_published,created_by,updated_at\nonb_2026,Orientasi,Intro,HR,,https://example.com/m,45,,TRUE,someone_unknown,\nno title,,,,,,,,,,',
  LESSONS: 'lesson_id,course_id,title,lesson_type,content_text,content_url,sort_order,is_required\nonb_01,onb_2026,Welcome,TEXT,"Line 1\nLine 2",,1,TRUE\nonb_02,onb_2026,Video,VIDEO,,https://youtu.be/dQw4w9WgXcQ,2,TRUE\nx_1,missing_course,X,TEXT,x,,1,TRUE\nonb_03,onb_2026,Odd,POEM,x,,3,TRUE',
  ENROLLMENTS: 'enrollment_id,user_id,course_id,assigned_at,due_date,assigned_by,status\nenr_1,usr_2,onb_2026,2026-02-01T00:00:00Z,2026-12-31,usr_1,ASSIGNED\nenr_2,usr_2,onb_2026,,,,ASSIGNED\nenr_3,ghost,onb_2026,,,,ASSIGNED',
  LESSON_PROGRESS: 'user_id,course_id,lesson_id,status,started_at,completed_at,last_accessed_at\nusr_2,onb_2026,onb_01,COMPLETED,2026-02-02T00:00:00Z,2026-02-02T00:10:00Z,2026-02-02T00:10:00Z\nusr_2,onb_2026,nope,COMPLETED,,,'
};

test('import: keeps IDs, validates, reports bad rows, is safe to re-run, and the result works in the app', async () => {
  const s = new MemoryStore(); setStore(s);
  const rep = await importAll(s, CSV);
  assert.deepStrictEqual(rep.inserted, { users: 2, courses: 1, lessons: 2, enrollments: 1, lesson_progress: 1 });
  assert.deepStrictEqual(rep.skipped.map((x) => x.table + ':' + x.line).sort(), ['courses:3', 'enrollments:3', 'enrollments:4', 'lesson_progress:3', 'lessons:4', 'lessons:5', 'users:5', 'users:6'].sort());
  const again = await importAll(s, CSV); assert.deepStrictEqual(again.inserted, {}); assert.strictEqual(s.t.users.length, 2);
  assert.strictEqual(s.t.lessons[0].content_text, 'Line 1\nLine 2');
  const me = await dispatch(s, 'emp@gmail.com', 'getCourse', ['onb_2026']);
  assert.ok(me.ok); assert.strictEqual(me.data.course.percent, 50); assert.strictEqual(me.data.lessons[0].status, 'COMPLETED');
  assert.strictEqual((await dispatch(s, 'riyan.riyadi@gmail.com', 'getSession')).data.role, 'SUPER_ADMIN');
});
