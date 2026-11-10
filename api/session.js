'use strict';
const { json, sameOrigin, isJson } = require('../lib/http');
const session = require('../lib/cookie-session');
const google = require('../lib/google');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const user = session.currentUser(req);
      return json(res, 200, user
        ? { signedIn: true, email: user.email, name: user.name, clientId: process.env.GOOGLE_CLIENT_ID || '' }
        : { signedIn: false, clientId: process.env.GOOGLE_CLIENT_ID || '' });
    }
    if (req.method === 'DELETE') {
      if (!sameOrigin(req)) return json(res, 403, { ok: false, code: 'FORBIDDEN', message: 'Request rejected.' });
      session.clearSessionCookie(res);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST') {
      if (!sameOrigin(req)) return json(res, 403, { ok: false, code: 'FORBIDDEN', message: 'Request rejected.' });
      if (!isJson(req)) return json(res, 415, { ok: false, code: 'BAD_REQUEST', message: 'Expected JSON.' });
      const credential = req.body && req.body.credential;
      if (typeof credential !== 'string' || credential.length < 20 || credential.length > 4000) {
        return json(res, 400, { ok: false, code: 'BAD_REQUEST', message: 'Missing credential.' });
      }
      let user = null;
      try { user = await google.verifyIdToken(credential); }
      catch (e) { if (e && e.code === 'CONFIG') throw e; user = null; }
      if (!user) return json(res, 401, { ok: false, code: 'UNAUTHORIZED', message: 'Google could not verify this sign-in. Please try again.' });
      session.setSessionCookie(res, user);
      return json(res, 200, { ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { ok: false, code: 'METHOD', message: 'Method not allowed.' });
  } catch (e) {
    console.error('session endpoint failure:', e && e.message);
    return json(res, 500, { ok: false, code: 'CONFIG', message: 'The service is not configured correctly. Contact the LMS administrator.' });
  }
};
