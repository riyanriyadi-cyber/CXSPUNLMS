'use strict';
/**
 * Data-access layer. Business logic only ever talks to this small interface:
 *   select(table, {eq, neq, in, order, limit}) → rows
 *   insert(table, rows) → inserted rows          (throws StoreError DUPLICATE / FK / INVALID)
 *   update(table, patch, {eq, neq}) → updated rows
 *   remove(table, {eq}) → deleted rows
 * SupabaseStore implements it on supabase-js (service-role key, server only). MemoryStore is a faithful
 * in-memory copy of the schema's constraints, used by the test suite.
 */
const { need } = require('./env');

class StoreError extends Error {
  constructor(code, message) { super(message); this.name = 'StoreError'; this.code = code; }
}

const PK_ORDER = {
  users: ['user_id'], courses: ['course_id'], lessons: ['lesson_id'], enrollments: ['enrollment_id'],
  lesson_progress: ['user_id', 'course_id', 'lesson_id']
};
const PAGE = 1000; // PostgREST returns at most 1000 rows per request by default, so we page.

function wrapError(error) {
  const code = String(error && error.code || '');
  if (code === '23505') return new StoreError('DUPLICATE', 'Duplicate record.');
  if (code === '23503') return new StoreError('FK', 'Referenced record does not exist or is still in use.');
  if (code === '23514' || code === '22P02' || code === '23502') return new StoreError('INVALID', 'Invalid value.');
  const e = new StoreError('DB', 'Database error: ' + (error && error.message ? error.message : 'unknown'));
  e.original = error;
  return e;
}

class SupabaseStore {
  constructor(client) { this.db = client; }

  _filter(q, o) {
    Object.keys(o.eq || {}).forEach((k) => { q = q.eq(k, o.eq[k]); });
    Object.keys(o.neq || {}).forEach((k) => { q = q.neq(k, o.neq[k]); });
    Object.keys(o.in || {}).forEach((k) => { q = q.in(k, o.in[k]); });
    return q;
  }

  async select(table, o) {
    o = o || {};
    for (const k of Object.keys(o.in || {})) if (!o.in[k].length) return [];
    const order = o.order || PK_ORDER[table].map((c) => [c, 'asc']);
    const out = [];
    for (let from = 0; ; from += PAGE) {
      const want = o.limit ? Math.min(PAGE, o.limit - out.length) : PAGE;
      let q = this._filter(this.db.from(table).select('*'), o);
      order.forEach((x) => { q = q.order(x[0], { ascending: x[1] !== 'desc' }); });
      const { data, error } = await q.range(from, from + want - 1);
      if (error) throw wrapError(error);
      out.push.apply(out, data);
      if (data.length < want || (o.limit && out.length >= o.limit)) break;
    }
    return out;
  }

  async insert(table, rows) {
    if (!rows.length) return [];
    const { data, error } = await this.db.from(table).insert(rows).select();
    if (error) throw wrapError(error);
    return data;
  }

  async update(table, patch, o) {
    const { data, error } = await this._filter(this.db.from(table).update(patch), o || {}).select();
    if (error) throw wrapError(error);
    return data;
  }

  async remove(table, o) {
    const { data, error } = await this._filter(this.db.from(table).delete(), o || {}).select();
    if (error) throw wrapError(error);
    return data;
  }
}

/** In-memory store enforcing the same keys, uniqueness, foreign keys, cascades and checks as supabase/schema.sql. */
const SPECS = {
  users: { pk: ['user_id'], unique: [{ cols: ['email_key'] }],
    check: (r) => ['EMPLOYEE', 'TEAM_LEAD', 'LMS_ADMIN', 'SUPER_ADMIN'].includes(r.role) && !!r.full_name && r.full_name.length <= 120 && typeof r.is_active === 'boolean' },
  courses: { pk: ['course_id'], setNull: [{ col: 'created_by', ref: 'users', refCol: 'user_id' }],
    check: (r) => !!r.title && r.title.length <= 150 && (r.description || '').length <= 2000 && Number.isInteger(r.duration_minutes) && r.duration_minutes >= 0 && typeof r.is_published === 'boolean' },
  lessons: { pk: ['lesson_id'], fk: [{ col: 'course_id', ref: 'courses', refCol: 'course_id' }],
    check: (r) => !!r.title && ['TEXT', 'IMAGE', 'VIDEO', 'DRIVE'].includes(r.lesson_type) && Number.isInteger(r.sort_order) && typeof r.is_required === 'boolean' },
  enrollments: { pk: ['enrollment_id'],
    unique: [{ cols: ['user_id', 'course_id'], where: (r) => r.status !== 'CANCELLED' }],
    fk: [{ col: 'user_id', ref: 'users', refCol: 'user_id' }, { col: 'course_id', ref: 'courses', refCol: 'course_id' }],
    setNull: [{ col: 'assigned_by', ref: 'users', refCol: 'user_id' }],
    check: (r) => ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(r.status) },
  lesson_progress: { pk: ['user_id', 'course_id', 'lesson_id'],
    fk: [{ col: 'user_id', ref: 'users', refCol: 'user_id' }, { col: 'course_id', ref: 'courses', refCol: 'course_id' }, { col: 'lesson_id', ref: 'lessons', refCol: 'lesson_id' }],
    check: (r) => ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status) }
};

class MemoryStore {
  constructor() { this.t = {}; Object.keys(SPECS).forEach((k) => { this.t[k] = []; }); this.calls = 0; }

  _match(row, o) {
    o = o || {};
    return Object.keys(o.eq || {}).every((k) => row[k] === o.eq[k]) &&
      Object.keys(o.neq || {}).every((k) => row[k] !== o.neq[k]) &&
      Object.keys(o.in || {}).every((k) => o.in[k].indexOf(row[k]) >= 0);
  }

  _validate(table, row, ignore) {
    const s = SPECS[table];
    if (!s.check(row)) throw new StoreError('INVALID', 'Check constraint failed on ' + table);
    s.pk.forEach((c) => { if (row[c] === undefined || row[c] === null || row[c] === '') throw new StoreError('INVALID', 'Missing ' + c); });
    const others = this.t[table].filter((r) => r !== ignore);
    if (others.some((r) => s.pk.every((c) => r[c] === row[c]))) throw new StoreError('DUPLICATE', 'pk');
    (s.unique || []).forEach((u) => {
      if (u.where && !u.where(row)) return;
      if (others.some((r) => (!u.where || u.where(r)) && u.cols.every((c) => r[c] === row[c]))) throw new StoreError('DUPLICATE', u.cols.join(','));
    });
    (s.fk || []).forEach((f) => {
      if (!this.t[f.ref].some((r) => r[f.refCol] === row[f.col])) throw new StoreError('FK', f.col);
    });
  }

  async select(table, o) {
    this.calls++;
    o = o || {};
    let rows = this.t[table].filter((r) => this._match(r, o)).map((r) => Object.assign({}, r));
    const order = o.order || PK_ORDER[table].map((c) => [c, 'asc']);
    rows.sort((a, b) => {
      for (const x of order) {
        if (a[x[0]] === b[x[0]]) continue;
        const r = a[x[0]] < b[x[0]] ? -1 : 1;
        return x[1] === 'desc' ? -r : r;
      }
      return 0;
    });
    return o.limit ? rows.slice(0, o.limit) : rows;
  }

  async insert(table, rows) {
    this.calls++;
    const inserted = [];
    const snapshot = this.t[table].slice();
    try {
      rows.forEach((r) => {
        const row = Object.assign({}, r);
        this._validate(table, row);
        this.t[table].push(row);
        inserted.push(Object.assign({}, row));
      });
    } catch (e) { this.t[table] = snapshot; throw e; } // all-or-nothing, like one INSERT statement
    return inserted;
  }

  async update(table, patch, o) {
    this.calls++;
    const out = [];
    this.t[table].filter((r) => this._match(r, o)).forEach((r) => {
      const next = Object.assign({}, r, patch);
      this._validate(table, next, r);
      Object.assign(r, patch);
      out.push(Object.assign({}, r));
    });
    return out;
  }

  async remove(table, o) {
    this.calls++;
    const gone = this.t[table].filter((r) => this._match(r, o));
    this.t[table] = this.t[table].filter((r) => gone.indexOf(r) < 0);
    gone.forEach((row) => this._cascade(table, row));
    return gone.map((r) => Object.assign({}, r));
  }

  _cascade(table, row) {
    Object.keys(SPECS).forEach((child) => {
      (SPECS[child].fk || []).filter((f) => f.ref === table).forEach((f) => {
        const kids = this.t[child].filter((r) => r[f.col] === row[f.refCol]);
        this.t[child] = this.t[child].filter((r) => kids.indexOf(r) < 0);
        kids.forEach((k) => this._cascade(child, k));
      });
      (SPECS[child].setNull || []).filter((f) => f.ref === table).forEach((f) => {
        this.t[child].forEach((r) => { if (r[f.col] === row[f.refCol]) r[f.col] = null; });
      });
    });
  }
}

let current = null;
function setStore(s) { current = s; }
function getStore() {
  if (current) return current;
  const { createClient } = require('@supabase/supabase-js'); // loaded lazily so tests don't need the package
  const client = createClient(need('SUPABASE_URL', 10), need('SUPABASE_SERVICE_ROLE_KEY', 20),
    { auth: { persistSession: false, autoRefreshToken: false } });
  current = new SupabaseStore(client);
  return current;
}

module.exports = { SupabaseStore, MemoryStore, StoreError, getStore, setStore };
