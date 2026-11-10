'use strict';
/** The complete list of server functions the browser may call, and the single place that dispatches them. */
const crypto = require('crypto');
const { U, AppError } = require('./utils');
const C = require('./constants');
const Auth = require('./auth');
const Courses = require('./courses');
const Progress = require('./progress');
const Team = require('./team');
const Admin = require('./admin');
const Authoring = require('./authoring');

const id = (v, f) => U.requireId(v, f);
const ROUTES = {
  getSession: async (s, u) => ({
    appName: C.APP_NAME, fullName: u.full_name, email: u.email, department: u.department, role: u.role,
    canViewTeam: C.TEAM_VIEW_ROLES.indexOf(u.role) >= 0, isAdmin: Auth.isAdmin(u), isSuperAdmin: u.role === 'SUPER_ADMIN' // UI hints only
  }),
  listMyCourses: (s, u) => Courses.listForUser(s, u),
  getCourse: (s, u, courseId) => Courses.detail(s, u, id(courseId, 'course')),
  openLesson: (s, u, c, l) => Progress.openLesson(s, u, id(c, 'course'), id(l, 'lesson')),
  completeLesson: (s, u, c, l) => Progress.completeLesson(s, u, id(c, 'course'), id(l, 'lesson')),
  getTeamProgress: (s, u) => Team.progress(s, u),
  getAdminSummary: (s, u) => Admin.summary(s, u),
  getAdminOptions: (s, u) => Admin.options(s, u),
  assignCourse: (s, u, p) => Admin.assignCourse(s, u, p),
  listUsers: (s, u) => Admin.listUsers(s, u),
  saveUser: (s, u, p) => Admin.saveUser(s, u, p),
  importUsers: (s, u, p) => Admin.importUsers(s, u, p),
  adminListCourses: (s, u) => Authoring.listCourses(s, u),
  adminGetCourse: (s, u, c) => Authoring.getCourse(s, u, c),
  adminSaveCourse: (s, u, p) => Authoring.saveCourse(s, u, p),
  adminDeleteCourse: (s, u, c) => Authoring.deleteCourse(s, u, c),
  adminSaveLesson: (s, u, p) => Authoring.saveLesson(s, u, p),
  adminDeleteLesson: (s, u, c, l) => Authoring.deleteLesson(s, u, c, l),
  adminMoveLesson: (s, u, c, l, d) => Authoring.moveLesson(s, u, c, l, d),
  adminPreviewLesson: (s, u, c, l) => Authoring.previewLesson(s, u, c, l)
};
const ALLOWED_FNS = Object.keys(ROUTES);
const MAX_ARGS = 5;

const STORE_MAP = { DUPLICATE: ['DUPLICATE', 'This record already exists.'], FK: ['NOT_FOUND', 'A related record was not found.'], INVALID: ['INVALID_INPUT', 'One of the values is not allowed.'] };

/** Resolve the user from the (cookie-verified) email, authorise, run, and wrap the result in { ok, data | code, message }. */
async function dispatch(store, email, fn, args) {
  try {
    if (!Object.prototype.hasOwnProperty.call(ROUTES, fn)) throw new AppError('BAD_REQUEST', 'Bad request.');
    const user = await Auth.currentUser(store, email);
    return { ok: true, data: await ROUTES[fn].apply(null, [store, user].concat(Array.isArray(args) ? args : [])) };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, code: e.code, message: e.message };
    if (e && e.name === 'StoreError' && STORE_MAP[e.code]) return { ok: false, code: STORE_MAP[e.code][0], message: STORE_MAP[e.code][1] };
    const ref = crypto.randomUUID().substring(0, 8);
    console.error('[' + ref + ']', e && e.stack ? e.stack : e);
    return { ok: false, code: 'INTERNAL', message: 'Something went wrong on our side. Try again, and contact the LMS administrator if it keeps happening. Reference: ' + ref };
  }
}

module.exports = { dispatch, ROUTES, ALLOWED_FNS, MAX_ARGS };
