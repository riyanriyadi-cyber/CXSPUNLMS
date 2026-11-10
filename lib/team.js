'use strict';
/**
 * TEAM_LEAD: direct reports only (users.manager_key = the caller's canonical email).
 * LMS_ADMIN / SUPER_ADMIN: everyone. EMPLOYEE: forbidden.
 */
const { U } = require('./utils');
const C = require('./constants');
const Auth = require('./auth');
const Courses = require('./courses');

async function progress(store, user) {
  Auth.requireRole(user, C.TEAM_VIEW_ROLES);
  const admin = Auth.isAdmin(user);
  const all = await store.select('users', admin ? { eq: { is_active: true } } : { eq: { is_active: true, manager_key: U.canonEmail(user.email) } });
  const members = all.filter((m) => m.user_id !== user.user_id);
  const data = await Courses.load(store, members.map((m) => m.user_id));
  const today = U.today();
  return {
    scope: admin ? 'ALL' : 'DIRECT_REPORTS',
    members: members.map((m) => {
      const rows = Courses.rowsForUser(m.user_id, data, today);
      const total = rows.reduce((s, r) => s + r.percent, 0);
      return {
        userId: m.user_id, fullName: m.full_name || m.email, department: m.department, email: m.email,
        stats: {
          assigned: rows.length, completed: rows.filter((r) => r.status === 'COMPLETED').length,
          inProgress: rows.filter((r) => r.status === 'IN_PROGRESS').length, overdue: rows.filter((r) => r.overdue).length,
          averagePercent: rows.length ? Math.round(total / rows.length) : 0
        },
        courses: rows.map((r) => ({ courseId: r.courseId, title: r.title, status: r.status, percent: r.percent, dueDate: r.dueDate, overdue: r.overdue }))
      };
    })
  };
}

module.exports = { progress };
