'use strict';
/**
 * Identity → user. The email comes ONLY from the signed session cookie (verified by Google at sign-in).
 * Fails closed: unknown, inactive, duplicate or mis-configured accounts are refused with a plain message.
 */
const { U, AppError } = require('./utils');
const C = require('./constants');

async function currentUser(store, email) {
  email = U.normEmail(email);
  if (!email) throw new AppError('NO_IDENTITY', 'We could not verify your Google account. Sign in again.');
  const domains = (process.env.ALLOWED_DOMAINS || '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (domains.length && domains.indexOf(email.split('@')[1]) < 0) {
    throw new AppError('DOMAIN_DENIED', 'The account ' + email + ' does not belong to an authorized domain.');
  }
  const rows = await store.select('users', { eq: { email_key: U.canonEmail(email) } });
  if (rows.length === 0) throw new AppError('NOT_REGISTERED', 'The account ' + email + ' has not been registered in the Learning Hub. Ask your LMS administrator to add you.');
  if (rows.length > 1) throw new AppError('DUPLICATE_USER', 'Your account is registered more than once. Ask your LMS administrator to fix this.');
  const u = rows[0];
  if (!u.is_active) throw new AppError('INACTIVE', 'Your Learning Hub account is deactivated. Contact your LMS administrator.');
  const role = U.upper(u.role);
  if (C.ROLES.indexOf(role) < 0) throw new AppError('BAD_ROLE', 'Your account has an unrecognised role. Contact your LMS administrator.');
  return { user_id: u.user_id, email, full_name: u.full_name || email, department: u.department, role, manager_key: u.manager_key };
}

function requireRole(user, roles) {
  if (!user || roles.indexOf(user.role) < 0) throw new AppError('FORBIDDEN', 'You do not have permission to do this.');
}
const isAdmin = (user) => C.ADMIN_ROLES.indexOf(user.role) >= 0;

module.exports = { currentUser, requireRole, isAdmin };
