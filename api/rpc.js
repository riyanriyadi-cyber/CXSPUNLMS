'use strict';
const { json, sameOrigin, isJson } = require('../lib/http');
const session = require('../lib/cookie-session');
const backend = require('../lib/backend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok: false, code: 'METHOD', message: 'Method not allowed.' }); }
  if (!sameOrigin(req)) return json(res, 403, { ok: false, code: 'FORBIDDEN', message: 'Request rejected.' });
  if (!isJson(req)) return json(res, 415, { ok: false, code: 'BAD_REQUEST', message: 'Expected JSON.' });

  let user;
  try { user = session.currentUser(req); }
  catch (e) { console.error('rpc config failure:', e.message); return json(res, 500, { ok: false, code: 'CONFIG', message: 'The service is not configured correctly. Contact the LMS administrator.' }); }
  if (!user) return json(res, 401, { ok: false, code: 'SIGNED_OUT', message: 'Please sign in.' });

  const body = req.body || {};
  const args = body.args === undefined ? [] : body.args;
  if (typeof body.fn !== 'string' || backend.ALLOWED_FNS.indexOf(body.fn) < 0 || !Array.isArray(args) || args.length > backend.MAX_ARGS) {
    return json(res, 400, { ok: false, code: 'BAD_REQUEST', message: 'Bad request.' });
  }
  try {
    // The email comes from the signed session cookie. Any email/role/user fields in the body are ignored.
    const out = await backend.callBackend(body.fn, args, user.email);
    if (out.ok === false && (out.code === 'UNAUTHORIZED' || out.code === 'CONFIG')) {
      console.error('backend rejected our request (secret mismatch or backend not configured):', out.code);
      return json(res, 502, { ok: false, code: 'CONFIG', message: 'The Learning Hub service is not configured correctly. Contact the LMS administrator.' });
    }
    return json(res, 200, out);
  } catch (e) {
    console.error('backend call failed:', e && e.message);
    return json(res, 502, { ok: false, code: 'UPSTREAM', message: 'The Learning Hub service is temporarily unavailable. Please try again in a moment.' });
  }
};
