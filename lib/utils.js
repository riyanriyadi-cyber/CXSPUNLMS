'use strict';
const crypto = require('crypto');

class AppError extends Error {
  constructor(code, message) { super(message); this.name = 'AppError'; this.code = code; }
}

const U = {
  newId: () => crypto.randomUUID(),
  nowIso: () => new Date().toISOString(),
  /** Today as YYYY-MM-DD in the company time zone (default Asia/Jakarta). */
  today() { return new Date().toLocaleDateString('en-CA', { timeZone: process.env.APP_TIMEZONE || 'Asia/Jakarta' }); },
  addDays(dateStr, n) {
    const p = dateStr.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().substring(0, 10);
  },
  normEmail: (v) => String(v == null ? '' : v).trim().toLowerCase(),
  /** Comparison key: Gmail ignores dots and +tags in the local part; googlemail.com == gmail.com. */
  canonEmail(v) {
    const e = U.normEmail(v);
    const at = e.lastIndexOf('@');
    if (at < 1) return e;
    let local = e.substring(0, at), dom = e.substring(at + 1);
    if (dom === 'googlemail.com') dom = 'gmail.com';
    if (dom === 'gmail.com') local = local.split('+')[0].replace(/\./g, '');
    return local + '@' + dom;
  },
  isEmail: (v) => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  isDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const p = s.split('-').map(Number);
    const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  },
  requireId(v, field) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new AppError('INVALID_INPUT', 'Invalid ' + field + '.');
    return s;
  },
  cleanText(v, field, max, required) {
    const s = (v == null ? '' : String(v)).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').trim();
    if (required && !s) throw new AppError('INVALID_INPUT', field + ' is required.');
    if (s.length > max) throw new AppError('INVALID_INPUT', field + ' must be at most ' + max + ' characters.');
    return s;
  },
  asBool: (v) => v === true || String(v).trim().toLowerCase() === 'true',
  toInt(v, fallback) { const n = parseInt(v, 10); return isFinite(n) ? n : fallback; },
  upper: (v) => String(v == null ? '' : v).trim().toUpperCase(),
  /** Split an array into chunks (used for batched DB calls). */
  chunk(a, n) { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
};

module.exports = { U, AppError };
