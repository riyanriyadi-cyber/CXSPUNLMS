'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { MemoryStore, SupabaseStore } = require('../lib/store');
const { user, course, lesson, enr } = require('./helpers');

const rejects = async (code, fn) => { try { await fn(); } catch (e) { assert.strictEqual(e.code, code, e.message); return; } assert.fail('expected ' + code); };

test('MemoryStore mirrors the schema: pk, unique, partial unique, foreign keys, checks', async () => {
  const s = new MemoryStore();
  await s.insert('users', [user('u1', 'a@x.co', 'EMPLOYEE'), user('u2', 'b@x.co', 'EMPLOYEE')]);
  await rejects('DUPLICATE', () => s.insert('users', [user('u1', 'c@x.co', 'EMPLOYEE')]));           // primary key
  await rejects('DUPLICATE', () => s.insert('users', [user('u3', 'A.@x.co', 'EMPLOYEE')].map((u) => Object.assign(u, { email_key: 'a@x.co' })))); // unique email_key
  await rejects('INVALID', () => s.insert('users', [user('u4', 'd@x.co', 'WIZARD')]));               // check constraint
  await s.insert('courses', [course('c1', true)]);
  await s.insert('enrollments', [enr('e1', 'u1', 'c1')]);
  await rejects('DUPLICATE', () => s.insert('enrollments', [enr('e2', 'u1', 'c1')]));                // one ACTIVE enrollment
  await s.update('enrollments', { status: 'CANCELLED' }, { eq: { enrollment_id: 'e1' } });
  await s.insert('enrollments', [enr('e2', 'u1', 'c1')]);                                            // allowed after cancel
  await rejects('FK', () => s.insert('enrollments', [enr('e3', 'nobody', 'c1')]));                   // foreign key
  assert.strictEqual((await s.select('users')).length, 2, 'a failed multi-row insert leaves nothing behind');
  await rejects('DUPLICATE', () => s.insert('users', [user('u5', 'e@x.co', 'EMPLOYEE'), user('u1', 'f@x.co', 'EMPLOYEE')]));
  assert.strictEqual((await s.select('users')).length, 2);
});

test('MemoryStore: cascades and set-null behave like the SQL schema', async () => {
  const s = new MemoryStore();
  await s.insert('users', [user('u1', 'a@x.co', 'EMPLOYEE'), user('adm', 'adm@x.co', 'LMS_ADMIN')]);
  await s.insert('courses', [Object.assign(course('c1', true), { created_by: 'adm' })]);
  await s.insert('lessons', [lesson('l1', 'c1', 1, true)]);
  await s.insert('enrollments', [Object.assign(enr('e1', 'u1', 'c1'), { assigned_by: 'adm' })]);
  await s.insert('lesson_progress', [{ user_id: 'u1', course_id: 'c1', lesson_id: 'l1', status: 'COMPLETED', started_at: null, completed_at: null, last_accessed_at: null }]);
  await rejects('DUPLICATE', () => s.insert('lesson_progress', [{ user_id: 'u1', course_id: 'c1', lesson_id: 'l1', status: 'IN_PROGRESS' }]));
  await s.remove('users', { eq: { user_id: 'adm' } });
  assert.strictEqual((await s.select('courses'))[0].created_by, null); assert.strictEqual((await s.select('enrollments'))[0].assigned_by, null);
  await s.remove('lessons', { eq: { lesson_id: 'l1' } }); assert.strictEqual((await s.select('lesson_progress')).length, 0);
  await s.remove('courses', { eq: { course_id: 'c1' } }); assert.strictEqual((await s.select('enrollments')).length, 0);
});

// ---- a stand-in for supabase-js's query builder, to check SupabaseStore uses the API correctly ----
function fakeClient(tables, opts) {
  opts = opts || {}; const log = [];
  return { log, from(name) {
    const st = { op: 'select', filters: [], orders: [], range: null, patch: null, rows: null };
    const b = {
      select() { return b; }, insert(r) { st.op = 'insert'; st.rows = r; return b; }, update(p) { st.op = 'update'; st.patch = p; return b; }, delete() { st.op = 'delete'; return b; },
      eq(k, v) { st.filters.push((r) => r[k] === v); return b; }, neq(k, v) { st.filters.push((r) => r[k] !== v); return b; }, in(k, a) { st.filters.push((r) => a.indexOf(r[k]) >= 0); return b; },
      order(c, o) { st.orders.push([c, o && o.ascending !== false]); return b; }, range(a, z) { st.range = [a, z]; return b; },
      then(ok, bad) { try { ok(run()); } catch (e) { bad(e); } }
    };
    function run() {
      log.push({ table: name, op: st.op, range: st.range, orders: st.orders.map((o) => o[0]) });
      if (opts.fail) return { data: null, error: opts.fail };
      const rows = tables[name] || (tables[name] = []);
      if (st.op === 'insert') { st.rows.forEach((r) => rows.push(Object.assign({}, r))); return { data: st.rows, error: null }; }
      const hit = rows.filter((r) => st.filters.every((f) => f(r)));
      if (st.op === 'update') { hit.forEach((r) => Object.assign(r, st.patch)); return { data: hit.map((r) => Object.assign({}, r)), error: null }; }
      if (st.op === 'delete') { tables[name] = rows.filter((r) => hit.indexOf(r) < 0); return { data: hit, error: null }; }
      let out = hit.slice(); st.orders.slice().reverse().forEach(([c, asc]) => out.sort((x, y) => (x[c] === y[c] ? 0 : (x[c] < y[c] ? -1 : 1) * (asc ? 1 : -1))));
      return { data: st.range ? out.slice(st.range[0], st.range[1] + 1) : out, error: null };
    }
    return b;
  } };
}

test('SupabaseStore: pages past the 1000-row API limit, orders deterministically, filters', async () => {
  const rows = Array.from({ length: 2500 }, (_, i) => ({ enrollment_id: 'e' + String(i).padStart(5, '0'), user_id: i % 2 ? 'a' : 'b', status: 'ASSIGNED' }));
  const c = fakeClient({ enrollments: rows }); const s = new SupabaseStore(c);
  assert.strictEqual((await s.select('enrollments')).length, 2500); assert.strictEqual(c.log.length, 3);
  assert.ok(c.log.every((l) => l.orders[0] === 'enrollment_id'), 'ordered by primary key for stable paging');
  assert.strictEqual((await s.select('enrollments', { eq: { user_id: 'a' }, limit: 5 })).length, 5);
  assert.strictEqual((await s.select('enrollments', { in: { user_id: ['a'] }, neq: { status: 'X' } })).length, 1250);
  const before = c.log.length; assert.deepStrictEqual(await s.select('enrollments', { in: { user_id: [] } }), []); assert.strictEqual(c.log.length, before, 'empty IN makes no request');
});

test('SupabaseStore: insert/update/remove return rows; database errors map to typed codes', async () => {
  const t = { courses: [] }; const s = new SupabaseStore(fakeClient(t));
  assert.strictEqual((await s.insert('courses', [{ course_id: 'c1', title: 'T' }])).length, 1); assert.deepStrictEqual(await s.insert('courses', []), []);
  assert.strictEqual((await s.update('courses', { title: 'N' }, { eq: { course_id: 'c1' } }))[0].title, 'N');
  assert.strictEqual((await s.remove('courses', { eq: { course_id: 'c1' } })).length, 1);
  for (const [pg, code] of [['23505', 'DUPLICATE'], ['23503', 'FK'], ['23514', 'INVALID'], ['XX000', 'DB']]) {
    await rejects(code, () => new SupabaseStore(fakeClient({}, { fail: { code: pg, message: 'boom' } })).insert('courses', [{ a: 1 }]));
  }
});
