'use strict';
const { json, sameOrigin, isJson } = require('../lib/http');
const session = require('../lib/cookie-session');
const { getStore } = require('../lib/store');
const { dispatch, ALLOWED_FNS, MAX_ARGS } = require('../lib/routes');

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
  if (typeof body.fn !== 'string' || ALLOWED_FNS.indexOf(body.fn) < 0 || !Array.isArray(args) || args.length > MAX_ARGS) {
    return json(res, 400, { ok: false, code: 'BAD_REQUEST', message: 'Bad request.' });
  }
  let store;
  try { store = getStore(); }
  catch (e) { console.error('store config failure:', e.message); return json(res, 500, { ok: false, code: 'CONFIG', message: 'The service is not configured correctly. Contact the LMS administrator.' }); }
  // The email comes from the signed session cookie. Any email/role/user fields in the body are ignored.
  return json(res, 200, await dispatch(store, user.email, body.fn, args));
};
