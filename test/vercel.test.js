'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

process.env.SESSION_SECRET = 's'.repeat(48);
process.env.SHARED_SECRET = 'k'.repeat(48);
process.env.BACKEND_URL = 'https://script.google.com/macros/s/TEST/exec';
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';

const session = require('../lib/cookie-session');
const google = require('../lib/google');
const rpc = require('../api/rpc');
const sessionApi = require('../api/session');

function mockRes() {
  const r = { headers: {}, statusCode: 200, body: null, setHeader(k, v) { r.headers[k] = v; }, end(s) { r.body = s ? JSON.parse(s) : null; } };
  return r;
}
const HOST = 'lms.example.com';
const sameSite = { host: HOST, origin: 'https://' + HOST, 'content-type': 'application/json' };
function cookieFor(email) { return { cookie: session.COOKIE + '=' + session.createToken({ email: email, name: 'N' }, process.env.SESSION_SECRET, 600) }; }
async function call(handler, req) { const res = mockRes(); await handler(req, res); return res; }

let sent = [];
function stubBackend(reply) {
  sent = [];
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    const expected = crypto.createHmac('sha256', process.env.SHARED_SECRET).update(body.p).digest('base64');
    sent.push({ url, p: JSON.parse(body.p), sigOk: expected === body.sig });
    return { ok: true, json: async () => reply };
  };
}

test('session token: valid, tampered, wrong secret, expired', () => {
  const t = session.createToken({ email: 'a@gmail.com' }, 'x'.repeat(40), 60);
  assert.strictEqual(session.verifyToken(t, 'x'.repeat(40)).email, 'a@gmail.com');
  const [p, s] = t.split('.');
  const evil = Buffer.from(JSON.stringify({ email: 'boss@gmail.com', exp: 9999999999 })).toString('base64url');
  assert.strictEqual(session.verifyToken(evil + '.' + s, 'x'.repeat(40)), null);
  assert.strictEqual(session.verifyToken(t, 'y'.repeat(40)), null);
  assert.strictEqual(session.verifyToken(session.createToken({ email: 'a@gmail.com' }, 'x'.repeat(40), -5), 'x'.repeat(40)), null);
  assert.strictEqual(session.verifyToken('garbage', 'x'.repeat(40)), null);
});

test('rpc: no cookie → 401; forged cookie → 401', async () => {
  stubBackend({ ok: true, data: 1 });
  let r = await call(rpc, { method: 'POST', headers: sameSite, body: { fn: 'getSession' } });
  assert.strictEqual(r.statusCode, 401);
  r = await call(rpc, { method: 'POST', headers: Object.assign({}, sameSite, { cookie: session.COOKIE + '=abc.def' }), body: { fn: 'getSession' } });
  assert.strictEqual(r.statusCode, 401);
  assert.strictEqual(sent.length, 0, 'backend never called');
});

test('rpc: cross-site, missing origin, non-JSON and wrong method are refused', async () => {
  stubBackend({ ok: true, data: 1 });
  const h = Object.assign({}, sameSite, cookieFor('e@gmail.com'));
  assert.strictEqual((await call(rpc, { method: 'POST', headers: Object.assign({}, h, { origin: 'https://evil.example' }), body: { fn: 'getSession' } })).statusCode, 403);
  const noOrigin = Object.assign({}, h); delete noOrigin.origin;
  assert.strictEqual((await call(rpc, { method: 'POST', headers: noOrigin, body: { fn: 'getSession' } })).statusCode, 403);
  assert.strictEqual((await call(rpc, { method: 'POST', headers: Object.assign({}, h, { 'content-type': 'text/plain' }), body: {} })).statusCode, 415);
  assert.strictEqual((await call(rpc, { method: 'GET', headers: h })).statusCode, 405);
  assert.strictEqual(sent.length, 0);
});

test('rpc: unknown function and too many args are refused before reaching the backend', async () => {
  stubBackend({ ok: true, data: 1 });
  const h = Object.assign({}, sameSite, cookieFor('e@gmail.com'));
  for (const body of [{ fn: 'deleteAll' }, { fn: 'constructor' }, { fn: 7 }, { fn: 'getCourse', args: [1, 2, 3, 4] }, { fn: 'getCourse', args: 'x' }]) {
    assert.strictEqual((await call(rpc, { method: 'POST', headers: h, body })).statusCode, 400, JSON.stringify(body));
  }
  assert.strictEqual(sent.length, 0);
});

test('rpc: identity sent to the backend is the session email, never a body field; request is correctly signed', async () => {
  stubBackend({ ok: true, data: { role: 'EMPLOYEE' } });
  const h = Object.assign({}, sameSite, cookieFor('Real.User@gmail.com'));
  const r = await call(rpc, { method: 'POST', headers: h, body: { fn: 'getCourse', args: ['c1'], email: 'boss@gmail.com', role: 'SUPER_ADMIN', userId: 'u_boss' } });
  assert.strictEqual(r.statusCode, 200);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].p.email, 'Real.User@gmail.com');
  assert.deepStrictEqual(sent[0].p.args, ['c1']);
  assert.ok(sent[0].sigOk, 'HMAC valid');
  assert.ok(/^[0-9a-f]{32}$/.test(sent[0].p.nonce));
  assert.ok(Math.abs(Date.now() - sent[0].p.ts) < 5000);
});

test('rpc: backend errors are passed through; secret mismatch and outages become generic messages', async () => {
  const h = Object.assign({}, sameSite, cookieFor('e@gmail.com'));
  stubBackend({ ok: false, code: 'NOT_REGISTERED', message: 'not registered' });
  let r = await call(rpc, { method: 'POST', headers: h, body: { fn: 'getSession' } });
  assert.strictEqual(r.body.code, 'NOT_REGISTERED');
  stubBackend({ ok: false, code: 'UNAUTHORIZED', message: 'Request rejected.' });
  r = await call(rpc, { method: 'POST', headers: h, body: { fn: 'getSession' } });
  assert.strictEqual(r.statusCode, 502); assert.strictEqual(r.body.code, 'CONFIG');
  global.fetch = async () => { throw new Error('boom'); };
  r = await call(rpc, { method: 'POST', headers: h, body: { fn: 'getSession' } });
  assert.strictEqual(r.statusCode, 502); assert.strictEqual(r.body.code, 'UPSTREAM');
});

test('session: sign-in sets an HttpOnly Secure cookie only for a verified Google identity', async () => {
  google.verifyIdToken = async () => ({ email: 'riyan@gmail.com', name: 'Riyan' });
  let r = await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'c'.repeat(30) } });
  assert.strictEqual(r.statusCode, 200);
  assert.match(r.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Lax/);
  const token = r.headers['Set-Cookie'].split(';')[0].split('=').slice(1).join('=');
  assert.strictEqual(session.verifyToken(token, process.env.SESSION_SECRET).email, 'riyan@gmail.com');

  google.verifyIdToken = async () => null; // e.g. email not verified
  r = await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'c'.repeat(30) } });
  assert.strictEqual(r.statusCode, 401); assert.strictEqual(r.headers['Set-Cookie'], undefined);

  google.verifyIdToken = async () => { throw new Error('bad signature'); };
  r = await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'c'.repeat(30) } });
  assert.strictEqual(r.statusCode, 401);

  r = await call(sessionApi, { method: 'POST', headers: Object.assign({}, sameSite, { origin: 'https://evil.example' }), body: { credential: 'c'.repeat(30) } });
  assert.strictEqual(r.statusCode, 403);
  r = await call(sessionApi, { method: 'POST', headers: sameSite, body: { credential: 'short' } });
  assert.strictEqual(r.statusCode, 400);
});

test('session: GET reports state; DELETE clears the cookie', async () => {
  let r = await call(sessionApi, { method: 'GET', headers: {} });
  assert.strictEqual(r.body.signedIn, false); assert.ok(r.body.clientId);
  r = await call(sessionApi, { method: 'GET', headers: cookieFor('e@gmail.com') });
  assert.strictEqual(r.body.signedIn, true); assert.strictEqual(r.body.email, 'e@gmail.com');
  r = await call(sessionApi, { method: 'DELETE', headers: sameSite });
  assert.match(r.headers['Set-Cookie'], /Max-Age=0/);
});
