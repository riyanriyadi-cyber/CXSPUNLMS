'use strict';
const assert = require('node:assert');
const { MemoryStore, setStore } = require('../lib/store');
const { dispatch } = require('../lib/routes');
const { U } = require('../lib/utils');

const NOW = '2026-01-01T00:00:00.000Z';
const user = (id, email, role, mgr, active) => ({ user_id: id, email, email_key: U.canonEmail(email), full_name: id + ' name', department: 'Ops', role,
  manager_email: mgr || '', manager_key: U.canonEmail(mgr || ''), is_active: active !== false, created_at: NOW });
const course = (id, pub) => ({ course_id: id, title: id + ' title', description: 'd', category: 'Cat', content_url: '', duration_minutes: 15,
  passing_score: null, is_published: pub, created_by: null, created_at: NOW, updated_at: NOW });
const lesson = (id, c, order, req) => ({ lesson_id: id, course_id: c, title: id, lesson_type: 'TEXT', content_text: 'text ' + id, content_url: '',
  sort_order: order, is_required: req, created_at: NOW, updated_at: NOW });
const enr = (id, u, c, due, st) => ({ enrollment_id: id, user_id: u, course_id: c, assigned_at: NOW, due_date: due || null, assigned_by: null, status: st || 'ASSIGNED' });

/** Fresh fictional fixture (same scenario as the original Apps Script test suite). */
async function fixture() {
  process.env.ALLOWED_DOMAINS = '';
  const store = new MemoryStore();
  setStore(store);
  await store.insert('users', [user('u_admin', 'admin@spun.test', 'LMS_ADMIN'), user('u_super', 'super@spun.test', 'SUPER_ADMIN'),
    user('u_lead', 'lead@spun.test', 'TEAM_LEAD'), user('u_emp1', 'emp1@spun.test', 'EMPLOYEE', 'lead@spun.test'),
    user('u_emp2', 'emp2@spun.test', 'EMPLOYEE', 'lead@spun.test'), user('u_emp3', 'emp3@spun.test', 'EMPLOYEE', 'other.lead@spun.test'),
    user('u_off', 'inactive@spun.test', 'EMPLOYEE', '', false)]);
  await store.insert('courses', [course('c_safety', true), course('c_draft', false), course('c_hidden', true)]);
  await store.insert('lessons', [lesson('l1', 'c_safety', 1, true), lesson('l2', 'c_safety', 2, true), lesson('l3', 'c_safety', 3, false),
    lesson('lh1', 'c_hidden', 1, true), lesson('ld1', 'c_draft', 1, true)]);
  await store.insert('enrollments', [enr('e1', 'u_emp1', 'c_safety', '2020-01-01'), enr('e2', 'u_emp1', 'c_draft'), enr('e3', 'u_emp2', 'c_safety'),
    enr('e4', 'u_emp2', 'c_hidden'), enr('e5', 'u_emp3', 'c_hidden')]);
  const call = (email, fn, ...args) => dispatch(store, email, fn, args);
  const data = async (email, fn, ...args) => { const r = await call(email, fn, ...args); assert.ok(r.ok, fn + ' failed: ' + r.code + ' ' + r.message); return r.data; };
  const code = async (expected, email, fn, ...args) => { const r = await call(email, fn, ...args); assert.strictEqual(r.ok, false, fn + ' unexpectedly succeeded'); assert.strictEqual(r.code, expected, r.message); return r; };
  return { store, call, data, code };
}
module.exports = { fixture, user, course, lesson, enr, NOW };
