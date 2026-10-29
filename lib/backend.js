'use strict';
const crypto = require('crypto');
const { need } = require('./env');

/** Only these backend functions can ever be requested. Mirrors Gateway.routes_() in Apps Script. */
const ALLOWED_FNS = ['getSession', 'listMyCourses', 'getCourse', 'openLesson', 'completeLesson', 'getTeamProgress',
  'getAdminSummary', 'getAdminOptions', 'assignCourse', 'listUsers', 'saveUser'];
const MAX_ARGS = 3;

/**
 * Calls the Apps Script backend with an HMAC-signed request.
 * `email` MUST come from the verified session cookie, never from the request body.
 */
async function callBackend(fn, args, email) {
  const url = need('BACKEND_URL', 20);
  const secret = need('SHARED_SECRET', 32);
  const p = JSON.stringify({ ts: Date.now(), nonce: crypto.randomBytes(16).toString('hex'), email: email, fn: fn, args: args });
  const sig = crypto.createHmac('sha256', secret).update(p).digest('base64');
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ p: p, sig: sig }),
    redirect: 'follow', signal: AbortSignal.timeout(25000)
  });
  if (!res.ok) throw new Error('Backend HTTP ' + res.status);
  let out;
  try { out = await res.json(); } catch (e) { throw new Error('Backend returned non-JSON (is the deployment access set to "Anyone"?)'); }
  if (!out || typeof out.ok !== 'boolean') throw new Error('Backend returned an unexpected shape');
  return out;
}

module.exports = { callBackend, ALLOWED_FNS, MAX_ARGS };
