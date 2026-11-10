'use strict';
/** Admin overview, course assignment and user management. Every function re-checks the caller's role. */
const { U, AppError } = require('./utils');
const C = require('./constants');
const Auth = require('./auth');
const Courses = require('./courses');

/** Aggregates only: no per-employee data is exposed here. */
async function summary(store, user) {
  Auth.requireRole(user, C.ADMIN_ROLES);
  const users = await store.select('users', { eq: { is_active: true } });
  const active = {}; users.forEach((u) => { active[u.user_id] = true; });
  const data = await Courses.load(store, null);
  const today = U.today();
  const per = {};
  data.courses.forEach((c) => {
    per[c.course_id] = { courseId: c.course_id, title: c.title, category: c.category, published: c.is_published === true,
      lessonCount: (data.lessonsByCourse[c.course_id] || []).length, enrolled: 0, completed: 0, inProgress: 0, overdue: 0 };
  });
  const seen = {};
  data.enrollments.forEach((e) => {
    const row = per[e.course_id]; const key = e.user_id + '|' + e.course_id;
    if (!row || !active[e.user_id] || seen[key]) return;
    seen[key] = true;
    const s = Courses.summarize(e, data.courseById[e.course_id], data.lessonsByCourse[e.course_id] || [], data.progByKey[key] || [], today);
    row.enrolled++;
    if (s.status === 'COMPLETED') row.completed++; else if (s.status === 'IN_PROGRESS') row.inProgress++;
    if (s.overdue) row.overdue++;
  });
  const courses = Object.keys(per).map((k) => per[k]).sort((a, b) => (a.title < b.title ? -1 : 1));
  const sum = (f) => courses.reduce((s, c) => s + c[f], 0);
  return {
    totals: { courses: courses.length, publishedCourses: courses.filter((c) => c.published).length,
      lessons: courses.reduce((s, c) => s + c.lessonCount, 0), activeUsers: users.length,
      activeEnrollments: sum('enrolled'), completed: sum('completed'), inProgress: sum('inProgress'), overdue: sum('overdue') },
    courses
  };
}

async function options(store, user) {
  Auth.requireRole(user, C.ADMIN_ROLES);
  const users = (await store.select('users', { eq: { is_active: true } }))
    .map((u) => ({ userId: u.user_id, fullName: u.full_name, department: u.department }))
    .sort((a, b) => (a.fullName.toLowerCase() < b.fullName.toLowerCase() ? -1 : 1));
  const courses = (await store.select('courses', { eq: { is_published: true } }))
    .map((c) => ({ courseId: c.course_id, title: c.title })).sort((a, b) => (a.title < b.title ? -1 : 1));
  return { users, courses };
}

/** Assign one published course to many employees. Employees who already have it are skipped, not duplicated. */
async function assignCourse(store, user, p) {
  Auth.requireRole(user, C.ADMIN_ROLES);
  if (!p || typeof p !== 'object') throw new AppError('INVALID_INPUT', 'Missing assignment details.');
  const courseId = U.requireId(p.courseId, 'course');
  if (!Array.isArray(p.userIds) || p.userIds.length < 1) throw new AppError('INVALID_INPUT', 'Choose at least one employee.');
  if (p.userIds.length > 200) throw new AppError('INVALID_INPUT', 'Choose at most 200 employees at a time.');
  const userIds = Array.from(new Set(p.userIds.map((x) => U.requireId(x, 'employee'))));
  const due = p.dueDate ? String(p.dueDate).trim() : '';
  if (due && !U.isDate(due)) throw new AppError('INVALID_INPUT', 'Due date must be a valid date.');
  if (due && due < U.today()) throw new AppError('INVALID_INPUT', 'Due date cannot be in the past.');

  const course = (await store.select('courses', { eq: { course_id: courseId } }))[0];
  if (!course) throw new AppError('NOT_FOUND', 'That course was not found.');
  if (course.is_published !== true) throw new AppError('INVALID_INPUT', 'Publish the course before assigning it.');

  const users = await Courses.selectIn(store, 'users', 'user_id', userIds);
  const byId = {}; users.forEach((u) => { byId[u.user_id] = u; });
  const existing = (await store.select('enrollments', { eq: { course_id: courseId } })).filter((e) => U.upper(e.status) !== 'CANCELLED');
  const has = {}; existing.forEach((e) => { has[e.user_id] = true; });

  let assigned = 0; const skipped = [];
  for (const id of userIds) {
    const u = byId[id];
    if (!u || !u.is_active) { skipped.push({ userId: id, name: u ? u.full_name : '(unknown)', reason: 'not found or inactive' }); continue; }
    if (has[id]) { skipped.push({ userId: id, name: u.full_name, reason: 'already assigned' }); continue; }
    try {
      await store.insert('enrollments', [{ enrollment_id: U.newId(), user_id: id, course_id: courseId, assigned_at: U.nowIso(),
        due_date: due || null, assigned_by: user.user_id, status: 'ASSIGNED' }]);
      assigned++;
    } catch (e) {
      if (e.code !== 'DUPLICATE') throw e;
      skipped.push({ userId: id, name: u.full_name, reason: 'already assigned' });
    }
  }
  return { assigned, skipped };
}

// ---------- users (Super Admin) ----------
function validateUserFields(p, ownEmail, isSelfCheck) {
  const email = U.normEmail(p.email);
  if (!U.isEmail(email)) throw new AppError('INVALID_INPUT', 'Enter a valid email address.');
  const domains = (process.env.ALLOWED_DOMAINS || '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (domains.length && domains.indexOf(email.split('@')[1]) < 0) throw new AppError('INVALID_INPUT', 'Email must belong to: ' + domains.join(', ') + '.');
  const manager = U.normEmail(p.managerEmail);
  if (manager && !U.isEmail(manager)) throw new AppError('INVALID_INPUT', 'Manager email is not valid.');
  return {
    email, manager,
    fullName: U.cleanText(p.fullName, 'Full name', C.LIMITS.NAME, true),
    department: U.cleanText(p.department, 'Department', C.LIMITS.DEPARTMENT, false)
  };
}

async function listUsers(store, user) {
  Auth.requireRole(user, ['SUPER_ADMIN']);
  return (await store.select('users')).map((u) => ({
    userId: u.user_id, email: u.email, fullName: u.full_name, department: u.department, role: u.role,
    managerEmail: u.manager_email, isActive: u.is_active
  })).sort((a, b) => (a.fullName.toLowerCase() < b.fullName.toLowerCase() ? -1 : 1));
}

async function saveUser(store, user, p) {
  Auth.requireRole(user, ['SUPER_ADMIN']);
  if (!p || typeof p !== 'object') throw new AppError('INVALID_INPUT', 'Missing user details.');
  const f = validateUserFields(p);
  const role = U.upper(p.role);
  if (C.ROLES.indexOf(role) < 0) throw new AppError('INVALID_INPUT', 'Choose a valid role.');
  const isActive = U.asBool(p.isActive);
  const key = U.canonEmail(f.email);
  if (key === U.canonEmail(user.email) && (role !== 'SUPER_ADMIN' || !isActive)) {
    throw new AppError('INVALID_INPUT', 'You cannot remove your own Super Admin access.');
  }
  const fields = { full_name: f.fullName, department: f.department, role, manager_email: f.manager, manager_key: U.canonEmail(f.manager), is_active: isActive };
  const existing = (await store.select('users', { eq: { email_key: key } }))[0];
  if (existing) {
    await store.update('users', fields, { eq: { user_id: existing.user_id } });
    return { userId: existing.user_id, created: false };
  }
  const rec = Object.assign({ user_id: U.newId(), email: f.email, email_key: key, created_at: U.nowIso() }, fields);
  try { await store.insert('users', [rec]); }
  catch (e) { if (e.code === 'DUPLICATE') throw new AppError('DUPLICATE', 'This person is already registered.'); throw e; }
  return { userId: rec.user_id, created: true };
}

/**
 * Bulk add employees from pasted text, one per line: email, full name, department, manager email.
 * New people become EMPLOYEE. Existing people keep their role and active status; name/department/manager are updated.
 */
async function importUsers(store, user, p) {
  Auth.requireRole(user, ['SUPER_ADMIN']);
  const text = p && typeof p.text === 'string' ? p.text : '';
  const lines = text.split(/\r?\n/).map((l, i) => ({ n: i + 1, raw: l })).filter((l) => l.raw.trim());
  if (!lines.length) throw new AppError('INVALID_INPUT', 'Paste at least one line.');
  if (lines.length > 300) throw new AppError('INVALID_INPUT', 'Please import at most 300 people at a time.');
  const out = { added: 0, updated: 0, errors: [] };
  for (const l of lines) {
    const parts = l.raw.split(/[\t,;]/).map((x) => x.trim());
    if (l === lines[0] && U.normEmail(parts[0]) === 'email') continue; // optional header row
    try {
      const f = validateUserFields({ email: parts[0], fullName: parts[1], department: parts[2], managerEmail: parts[3] });
      const key = U.canonEmail(f.email);
      const existing = (await store.select('users', { eq: { email_key: key } }))[0];
      const fields = { full_name: f.fullName, department: f.department, manager_email: f.manager, manager_key: U.canonEmail(f.manager) };
      if (existing) { await store.update('users', fields, { eq: { user_id: existing.user_id } }); out.updated++; }
      else {
        await store.insert('users', [Object.assign({ user_id: U.newId(), email: f.email, email_key: key, role: 'EMPLOYEE', is_active: true, created_at: U.nowIso() }, fields)]);
        out.added++;
      }
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      out.errors.push({ line: l.n, message: e.message });
    }
  }
  return out;
}

module.exports = { summary, options, assignCourse, listUsers, saveUser, importUsers };
