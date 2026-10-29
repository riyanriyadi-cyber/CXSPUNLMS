'use strict';
function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

/**
 * CSRF defence for cookie-authenticated POST/DELETE: the browser must say the request comes from our own origin.
 * Requests with neither Origin nor Sec-Fetch-Site are refused.
 */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
  }
  const site = req.headers['sec-fetch-site'];
  return site === 'same-origin';
}

function isJson(req) { return String(req.headers['content-type'] || '').toLowerCase().indexOf('application/json') === 0; }

module.exports = { json, sameOrigin, isJson };
