'use strict';
let client = null;

/** Verifies a Google Sign-In ID token (signature, audience, expiry). Returns { email, name } or null. */
async function verifyIdToken(idToken) {
  const { OAuth2Client } = require('google-auth-library');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw Object.assign(new Error('GOOGLE_CLIENT_ID is not set.'), { code: 'CONFIG' });
  client = client || new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: idToken, audience: clientId });
  const p = ticket.getPayload();
  if (!p || !p.email || p.email_verified !== true) return null;
  return { email: String(p.email).trim().toLowerCase(), name: p.name || '' };
}

module.exports = { verifyIdToken };
