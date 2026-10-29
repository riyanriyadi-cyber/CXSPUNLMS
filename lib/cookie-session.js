'use strict';
const crypto = require('crypto');
const { need } = require('./env');

const COOKIE = 'lms_session';
const TTL_SECONDS = 8 * 60 * 60;

const mac = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

function createToken(claims, secret, ttlSeconds) {
  const payload = Buffer.from(JSON.stringify(Object.assign({}, claims, { exp: Math.floor(Date.now() / 1000) + ttlSeconds }))).toString('base64url');
  return payload + '.' + mac(payload, secret);
}

function verifyToken(token, secret) {
  if (typeof token !== 'string') return null;
  const i = token.indexOf('.');
  if (i < 1) return null;
  const payload = token.slice(0, i);
  const a = Buffer.from(token.slice(i + 1));
  const b = Buffer.from(mac(payload, secret));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let c;
  try { c = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!c || typeof c.email !== 'string' || typeof c.exp !== 'number' || c.exp < Date.now() / 1000) return null;
  return c;
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

/** The signed-in user from the cookie, or null. The email inside was verified by Google at sign-in. */
function currentUser(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  return verifyToken(token, need('SESSION_SECRET', 32));
}

function setSessionCookie(res, user) {
  const token = createToken({ email: user.email, name: user.name || '' }, need('SESSION_SECRET', 32), TTL_SECONDS);
  res.setHeader('Set-Cookie', COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + TTL_SECONDS);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}

module.exports = { COOKIE, createToken, verifyToken, parseCookies, currentUser, setSessionCookie, clearSessionCookie };
