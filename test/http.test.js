'use strict';
const test = require('node:test');
const assert = require('node:assert');
process.env.SESSION_SECRET = 's'.repeat(48);
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';

const session = require('../lib/cookie-session');
const google = require('../lib/google');
const rpc = require('../api/rpc');
const sessionApi = require('../api/session');
const { setStore } = require('../lib/store');
const { fixture } = require('./helpers');

const mockRes = () => { const r = { headers: {}, statusCode: 200, body: null, setHeader(k, v) { r.headers[k] = v; }, end(s) { r.body = s ? JSON.parse(s) : null; } }; return r; };
const HOST = 'lms.example.com';
const sameSite = { host: HOST, origin: 'https://' + HOST, 'content-type': 'application/json' };
const cookieFor = (email) => ({ cookie: session.COOKIE + '=' + session.createToken({ email, name: 'N' }, process.env.SESSION_SECRET, 600) });
const call = async (handler, req) => { const res = mockRes(); await handler(req, res); return res; };
const post = (email, body, extra) => call(rpc, { method: 'POST', headers: Object.assign({}, sameSite, email ? cookieFor(email) : {}, extra), body });

test('session token: valid, tampered, wrong secret, expired', () => {
  const k = 'x'.repeat(40); const t = session.createToken({ email: 'a@gmail.com' }, k, 60);
  assert.strictEqual(session.verifyToken(t, k).email, 'a@gmail.com');
  const evil = Buffer.from(JSON.stringify({ email: 'boss@gmail.com', exp: 9999999999 })).toString('base64url');
  assert.strictEqual(session.verifyToken(evil + '.' + t.split('.')[1], k), null);
  assert.strictEqual(session.verifyToken(t, 'y'.repeat(40)), null);
  assert.strictEqual(session.verifyToken(session.createToken({ email: 'a@gmail.com' }, k, -5), k), null);
  assert.strictEqual(session.verifyToken('garbage', k), null);
});

test('rpc: no/forged cookie → 401; cross-site, missing origin, non-JSON, wrong method refused', async () => {
  await fixture();
  assert.strictEqual((await post(null, { fn: 'getSession' })).statusCode, 401);
  assert.strictEqual((await call(rpc, { method: 'POST', headers: Object.assign({}, sameSite, { cookie: session.COOKIE + '=abc.def' }), body: { fn: 'getSession' } })).statusCode, 401);
  assert.strictEqual((await post('emp1@spun.test', { fn: 'getSession' }, { origin: 'https://evil.example' })).statusCode, 403);
  const h = Object.assign({}, sameSite, cookieFor('emp1@spun.test')); delete h.origin;
  assert.strictEqual((await call(rpc, { method: 'POST', headers: h, body: { fn: 'getSession' } })).statusCode, 403);
  assert.strictEqual((await post('emp1@spun.test', {}, { 'content-type': 'text/plain' })).statusCode, 415);
  assert.strictEqual((await call(rpc, { method: 'GET', headers: sameSite })).statusCode, 405);
});

test('rpc: unknown functions and oversized argument lists are refused', async () => {
  await fixture();
  for (const body of [{ fn: 'deleteAll' }, { fn: 'constructor' }, { fn: 7 }, { fn: 'getCourse', args: [1, 2, 3, 4, 5, 6] }, { fn: 'getCourse', args: 'x' }]) {
    assert.strictEqual((await post('emp1@spun.test', body)).statusCode, 400, JSON.stringify(body));
  }
});

test('rpc: identity is the cookie email — role/email/userId in the body are ignored', async () => {
  await fixture();
  let r = await post('emp1@spun.test', { fn: 'getAdminSummary', args: [], email: 'admin@spun.test', role: 'SUPER_ADMIN', userId: 'u_super' });
  assert.strictEqual(r.body.code, 'FORBIDDEN');
  r = await post('emp1@spun.test', { fn: 'getSession', args: [], email: 'admin@spun.test' }); assert.strictEqual(r.body.data.role, 'EMPLOYEE');
  r = await post('stranger@gmail.com', { fn: 'getSession' }); assert.strictEqual(r.body.code, 'NOT_REGISTERED');
  r = await post('admin@spun.test', { fn: 'adminListCourses' }); assert.ok(r.body.ok);
});

test('rpc: database misconfiguration gives a generic CONFIG error, not internals', async () => {
  setStore(null); delete process.env.SUPABASE_URL;
  const r = await post('emp1@spun.test', { fn: 'getSession' });
  assert.strictEqual(r.statusCode, 500); assert.strictEqual(r.body.code, 'CONFIG'); assert.ok(!/SUPABASE|key/i.test(r.body.message));
});

test('session: sign-in sets an HttpOnly Secure cookie only for a verified Google identity', async () => {
  google.verifyIdToken = async () => ({ email: 'riyan@gmail.com', name: 'Riyan' });
  let r = await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'c'.repeat(30) } });
  assert.strictEqual(r.statusCode, 200); assert.match(r.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Lax/);
  const token = r.headers['Set-Cookie'].split(';')[0].split('=').slice(1).join('=');
  assert.strictEqual(session.verifyToken(token, process.env.SESSION_SECRET).email, 'riyan@gmail.com');
  google.verifyIdToken = async () => null;
  r = await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'c'.repeat(30) } }); assert.strictEqual(r.statusCode, 401); assert.strictEqual(r.headers['Set-Cookie'], undefined);
  google.verifyIdToken = async () => { throw new Error('bad signature'); };
  assert.strictEqual((await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'c'.repeat(30) } })).statusCode, 401);
  assert.strictEqual((await call(sessionApi, { method: 'POST', headers: Object.assign({}, sameSite, { origin: 'https://evil.example' }), body: { credential: 'c'.repeat(30) } })).statusCode, 403);
  assert.strictEqual((await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'short' } })).statusCode, 400);
});

test('session: GET reports state; DELETE clears the cookie', async () => {
  let r = await call(sessionApi, { method: 'GET', headers: {} }); assert.strictEqual(r.body.signedIn, false); assert.ok(r.body.clientId);
  r = await call(sessionApi, { method: 'GET', headers: cookieFor('e@gmail.com') }); assert.strictEqual(r.body.email, 'e@gmail.com');
  r = await call(sessionApi, { method: 'DELETE', headers: sameSite }); assert.match(r.headers['Set-Cookie'], /Max-Age=0/);
});
