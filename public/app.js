(function () {
  'use strict';

  // ---------- helpers ----------
  const main = document.getElementById('main');
  const STATUS = { NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', COMPLETED: 'Completed' };
  const state = { session: null, view: 'dashboard', arg: null };
  let renderToken = 0;

  const flat = (a) => Array.isArray(a) ? a.reduce((x, y) => x.concat(flat(y)), []) : [a];
  function add(el, kids) {
    flat(kids).forEach((k) => {
      if (k === null || k === undefined || k === false) return;
      el.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
    });
    return el;
  }
  // All dynamic text goes through textContent / text nodes: no innerHTML anywhere.
  function h(tag, props, kids) {
    const el = document.createElement(tag);
    Object.keys(props || {}).forEach((k) => {
      const v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    return kids === undefined ? el : add(el, kids);
  }

  async function call(fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    let res;
    try {
      res = await fetch('/api/rpc', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fn: fn.replace(/^api_/, ''), args: args })
      });
    } catch (e) { throw { code: 'NETWORK', message: 'Could not reach the server. Check your connection and try again.' }; }
    let body = null;
    try { body = await res.json(); } catch (e) { /* handled below */ }
    if (res.status === 401) { showSignIn(); throw { code: 'SIGNED_OUT', message: 'Your session has expired. Please sign in again.' }; }
    if (body && body.ok === true) return body.data;
    throw body && body.message ? body : { code: 'INTERNAL', message: 'Unexpected response from the server.' };
  }

  function toast(msg, kind) {
    const t = h('div', { class: 'toast' + (kind === 'error' ? ' error' : ''), text: msg });
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), kind === 'error' ? 7000 : 3500);
  }

  function fmtDate(s) {
    if (!s) return '';
    const p = s.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2])).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  const spinner = () => h('div', { class: 'spinner', role: 'status', 'aria-label': 'Loading' });
  const badge = (s) => h('span', { class: 'badge ' + s, text: STATUS[s] || s });

  function progressBar(pct, label) {
    pct = Math.max(0, Math.min(100, Number(pct) || 0));
    const fill = h('span');
    fill.style.width = pct + '%';
    return h('div', { class: 'progress' + (pct === 100 ? ' done' : ''), role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100',
      'aria-valuenow': String(pct), 'aria-label': 'Progress for ' + label }, [fill]);
  }

  function errorBox(e, retry) {
    const box = h('div', { class: 'notice error', role: 'alert' }, [h('p', { text: (e && e.message) || 'Something went wrong.' })]);
    if (retry) box.appendChild(h('button', { class: 'btn', type: 'button', text: 'Try again', onclick: retry }));
    return box;
  }
  const empty = (title, text) => h('div', { class: 'empty' }, [h('h3', { text: title }), h('p', { text: text })]);

  // ---------- shell / navigation ----------
  function navItems() {
    const s = state.session;
    const items = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'catalog', label: 'My courses' }];
    if (s.canViewTeam) items.push({ id: 'team', label: 'Team progress' });
    if (s.isAdmin) items.push({ id: 'admin', label: 'Administration' });
    return items;
  }
  function renderNav() {
    const nav = document.getElementById('nav');
    nav.replaceChildren();
    navItems().forEach((it) => {
      const active = state.view === it.id || (state.view === 'course' && it.id === 'catalog');
      nav.appendChild(h('button', { type: 'button', text: it.label, 'aria-current': active ? 'page' : null, onclick: () => go(it.id) }));
    });
  }
  function setMenu(open) {
    document.getElementById('sidebar').classList.toggle('open', open);
    document.getElementById('scrim').classList.toggle('open', open);
    document.getElementById('menuBtn').setAttribute('aria-expanded', String(open));
  }
  document.getElementById('menuBtn').addEventListener('click', () => setMenu(!document.getElementById('sidebar').classList.contains('open')));
  document.getElementById('scrim').addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  function go(view, arg) { state.view = view; state.arg = arg; setMenu(false); renderNav(); render(); }

  async function render() {
    const token = ++renderToken;
    main.setAttribute('aria-busy', 'true');
    main.replaceChildren(spinner());
    try {
      const node = await views[state.view](state.arg);
      if (token !== renderToken) return;
      main.replaceChildren(node);
    } catch (e) {
      if (token !== renderToken) return;
      main.replaceChildren(errorBox(e, render));
    } finally {
      if (token === renderToken) main.removeAttribute('aria-busy');
    }
    if (token === renderToken) {
      const hd = main.querySelector('h1');
      document.getElementById('pageTitle').textContent = hd ? hd.textContent : 'Learning Hub';
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
    }
  }

  // ---------- shared UI ----------
  function courseCard(c) {
    const action = c.status === 'COMPLETED' ? 'Review' : (c.status === 'IN_PROGRESS' ? 'Continue' : 'Start');
    const due = c.dueDate ? h('li', { text: 'Due ' + fmtDate(c.dueDate) }) : null;
    return h('article', { class: 'card course-card' }, [
      h('div', { class: 'card-top' }, [
        c.category ? h('span', { class: 'chip', text: c.category }) : h('span'),
        h('span', null, [badge(c.status), c.overdue ? [' ', h('span', { class: 'badge overdue', text: 'Overdue' })] : null])
      ]),
      h('h3', { text: c.title }),
      h('p', { class: 'muted clamp', text: c.description || 'No description yet.' }),
      h('ul', { class: 'meta' }, [h('li', { text: c.durationMinutes ? c.durationMinutes + ' min' : 'Duration not set' }), due]),
      progressBar(c.percent, c.title),
      h('p', { class: 'caption', text: c.requiredTotal ? c.requiredCompleted + ' of ' + c.requiredTotal + ' required lessons done' : 'No required lessons yet' }),
      h('button', { class: 'btn primary', type: 'button', 'aria-label': action + ' ' + c.title, text: action, onclick: () => go('course', c.courseId) })
    ]);
  }

  // ---------- views ----------
  const views = {};

  views.dashboard = async () => {
    const courses = await call('api_listMyCourses');
    const first = (state.session.fullName || '').split(' ')[0] || 'there';
    const count = (f) => courses.filter(f).length;
    const tile = (n, label, warn) => h('div', { class: 'tile' + (warn && n > 0 ? ' warn' : '') }, [h('div', { class: 'n', text: String(n) }), h('div', { class: 'muted', text: label })]);
    const next = courses.filter((c) => c.status !== 'COMPLETED')[0];
    const root = h('div', null, [
      h('div', { class: 'page-head' }, [
        h('h1', { text: 'Welcome back, ' + first }),
        h('p', { text: courses.length ? (next ? 'Pick up where you left off, or start something new.' : 'You have completed everything assigned to you.') : 'Courses assigned to you will show up here.' })
      ]),
      h('div', { class: 'tiles' }, [
        tile(courses.length, 'Assigned'), tile(count((c) => c.status === 'IN_PROGRESS'), 'In progress'),
        tile(count((c) => c.status === 'COMPLETED'), 'Completed'), tile(count((c) => c.overdue), 'Overdue', true)
      ])
    ]);
    if (!courses.length) { root.appendChild(empty('Nothing assigned yet', 'When your manager or the LMS team assigns a course, it will appear here.')); return root; }
    root.appendChild(h('h2', { text: 'Your courses' }));
    root.appendChild(h('div', { class: 'grid' }, courses.map(courseCard)));
    return root;
  };

  views.catalog = async () => {
    const courses = await call('api_listMyCourses');
    const cats = Array.from(new Set(courses.map((c) => c.category).filter(Boolean))).sort();
    const grid = h('div', { class: 'grid' });
    const search = h('input', { type: 'search', id: 'q', placeholder: 'Search by course title', autocomplete: 'off' });
    const sel = h('select', { id: 'cat' }, [h('option', { value: '', text: 'All categories' })].concat(cats.map((c) => h('option', { value: c, text: c }))));
    function paint() {
      const q = search.value.trim().toLowerCase();
      const list = courses.filter((c) => (!q || c.title.toLowerCase().indexOf(q) >= 0) && (!sel.value || c.category === sel.value));
      grid.replaceChildren();
      if (!list.length) grid.appendChild(empty(courses.length ? 'No courses match' : 'No courses yet', courses.length ? 'Try a different title or clear the category filter.' : 'Courses assigned to you will appear here.'));
      else list.forEach((c) => grid.appendChild(courseCard(c)));
    }
    search.addEventListener('input', paint); sel.addEventListener('change', paint);
    paint();
    return h('div', null, [
      h('div', { class: 'page-head' }, [h('h1', { text: 'My courses' }), h('p', { text: 'Published courses assigned to you.' })]),
      h('div', { class: 'filters' }, [
        h('div', { class: 'field' }, [h('label', { for: 'q', text: 'Search' }), search]),
        h('div', { class: 'field' }, [h('label', { for: 'cat', text: 'Category' }), sel])
      ]),
      grid
    ]);
  };

  views.course = async (courseId) => {
    const d = await call('api_getCourse', courseId);
    const course = d.course;
    const lessons = d.lessons.slice();
    let current = null;
    const nav = h('ol', { class: 'lesson-nav', 'aria-label': 'Lessons' });
    const pane = h('section', { class: 'lesson-pane', 'aria-label': 'Lesson content' });
    const progHolder = h('div');

    function paintProgress(p) {
      progHolder.replaceChildren(progressBar(p.percent, course.title),
        h('p', { class: 'caption', text: p.requiredTotal ? p.requiredCompleted + ' of ' + p.requiredTotal + ' required lessons done (' + p.percent + '%)' : 'This course has no required lessons yet.' }));
    }
    function paintNav() {
      nav.replaceChildren();
      lessons.forEach((l) => {
        nav.appendChild(h('li', null, [h('button', { type: 'button', 'aria-current': current && current.lesson.lessonId === l.lessonId ? 'step' : null, onclick: () => open(l.lessonId) }, [
          h('span', { class: 'mark ' + l.status, 'aria-hidden': 'true', text: l.status === 'COMPLETED' ? '\u2713' : '' }),
          h('span', null, [l.title, h('span', { class: 'caption', text: ' ' + (l.required ? '' : '(optional)') + ' \u2013 ' + (STATUS[l.status] || '').toLowerCase() })])
        ])]));
      });
    }
    function setStatus(id, status) { const l = lessons.find((x) => x.lessonId === id); if (l) l.status = status; }

    function contentNode(c, title) {
      const out = [];
      if (c.kind === 'text') out.push(h('div', { class: 'lesson-body', text: c.text }));
      else if (c.kind === 'image') out.push(h('img', { class: 'lesson-img', src: c.src, alt: title, referrerpolicy: 'no-referrer' }));
      else if (c.kind === 'embed') out.push(h('iframe', { class: 'lesson-media', src: c.src, title: title, allow: 'fullscreen; picture-in-picture', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy' }));
      else if (c.kind === 'link') out.push(h('p', null, [h('a', { href: c.openUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Open the Google Drive file in a new tab' })]));
      else out.push(h('div', { class: 'notice info' }, [h('p', { text: c.note || 'This content cannot be shown.' })]));
      if (c.kind !== 'text' && c.text) out.push(h('div', { class: 'lesson-body', text: c.text }));
      if (c.kind === 'embed' && c.openUrl) out.push(h('p', { class: 'caption' }, ['Can\u2019t see it? ', h('a', { href: c.openUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Open in a new tab' }), '. You need access to the file in Google Drive.']));
      return out;
    }

    function paintLesson() {
      const l = current.lesson;
      const idx = lessons.findIndex((x) => x.lessonId === l.lessonId);
      const done = l.status === 'COMPLETED';
      const completeBtn = h('button', { class: 'btn primary', type: 'button', text: done ? 'Completed' : 'Mark as complete', disabled: done ? true : null });
      completeBtn.addEventListener('click', async () => {
        completeBtn.disabled = true; completeBtn.textContent = 'Saving\u2026';
        try {
          const r = await call('api_completeLesson', course.courseId, l.lessonId);
          current.lesson.status = r.lesson.status; setStatus(l.lessonId, r.lesson.status);
          paintProgress(r.progress); paintNav(); paintLesson();
          toast(r.progress.status === 'COMPLETED' ? 'Course completed. Well done!' : 'Lesson marked complete');
        } catch (e) { toast(e.message, 'error'); completeBtn.disabled = false; completeBtn.textContent = 'Mark as complete'; }
      });
      const prev = idx > 0 ? h('button', { class: 'btn', type: 'button', text: 'Previous', onclick: () => open(lessons[idx - 1].lessonId) }) : null;
      const next = idx < lessons.length - 1 ? h('button', { class: 'btn', type: 'button', text: 'Next lesson', onclick: () => open(lessons[idx + 1].lessonId) }) : null;
      pane.replaceChildren.apply(pane, flat([
        h('h2', { text: l.title }),
        h('p', { class: 'caption' }, [badge(l.status), ' ', l.required ? 'Required' : 'Optional']),
        contentNode(current.lesson.content, l.title),
        h('div', { class: 'actions' }, [prev, h('span', { class: 'spacer' }), completeBtn, next])
      ]));
    }

    async function open(lessonId) {
      pane.replaceChildren(spinner());
      try {
        current = await call('api_openLesson', course.courseId, lessonId);
        setStatus(lessonId, current.lesson.status);
        paintProgress(current.progress); paintNav(); paintLesson();
      } catch (e) { pane.replaceChildren(errorBox(e, () => open(lessonId))); }
    }

    paintProgress({ percent: course.percent, requiredCompleted: course.requiredCompleted, requiredTotal: course.requiredTotal });
    paintNav();
    const root = h('div', null, [
      h('p', { class: 'crumbs' }, [h('button', { class: 'btn link', type: 'button', text: '\u2190 Back to my courses', onclick: () => go('catalog') })]),
      h('div', { class: 'page-head' }, [
        h('h1', { text: course.title }),
        h('p', { text: course.description }),
        h('p', { class: 'caption' }, [badge(course.status), course.overdue ? [' ', h('span', { class: 'badge overdue', text: 'Overdue' })] : null,
          course.dueDate ? ' Due ' + fmtDate(course.dueDate) : '', course.durationMinutes ? ' \u2022 ' + course.durationMinutes + ' min' : '']),
        course.overviewUrl ? h('p', null, [h('a', { href: course.overviewUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Open course materials in a new tab' })]) : null,
        progHolder
      ])
    ]);
    if (!lessons.length) { root.appendChild(empty('No lessons yet', 'This course has no lessons. Check back soon.')); return root; }
    root.appendChild(h('div', { class: 'viewer' }, [nav, pane]));
    open(d.resumeLessonId || lessons[0].lessonId);
    return root;
  };

  views.team = async () => {
    const d = await call('api_getTeamProgress');
    const root = h('div', null, [h('div', { class: 'page-head' }, [h('h1', { text: 'Team progress' }),
      h('p', { text: d.scope === 'ALL' ? 'Learning progress for all active employees.' : 'Learning progress for your direct reports.' })])]);
    if (!d.members.length) { root.appendChild(empty('No team members found', 'People whose manager email in the USERS sheet matches yours will appear here.')); return root; }
    d.members.forEach((m) => {
      const body = m.courses.length
        ? h('div', { class: 'table-wrap' }, [h('table', null, [
            h('thead', null, [h('tr', null, ['Course', 'Status', 'Progress', 'Due'].map((t) => h('th', { scope: 'col', text: t })))]),
            h('tbody', null, m.courses.map((c) => h('tr', null, [h('td', { text: c.title }),
              h('td', null, [badge(c.status), c.overdue ? [' ', h('span', { class: 'badge overdue', text: 'Overdue' })] : null]),
              h('td', { text: c.percent + '%' }), h('td', { text: c.dueDate ? fmtDate(c.dueDate) : '\u2013' })])))
          ])])
        : h('p', { class: 'muted', text: 'No courses assigned.' });
      root.appendChild(h('details', { class: 'member' }, [
        h('summary', null, [h('strong', { text: m.fullName }), h('span', { class: 'muted', text: m.department || '' }),
          h('span', { text: m.stats.completed + ' of ' + m.stats.assigned + ' completed' }),
          m.stats.overdue ? h('span', { class: 'badge overdue', text: m.stats.overdue + ' overdue' }) : null]),
        h('div', { class: 'inner' }, [body])
      ]));
    });
    return root;
  };

  function formField(label, id, control) { return h('div', { class: 'field' }, [h('label', { for: id, text: label }), control]); }
  const sel = (id, opts, placeholder) => h('select', { id: id, required: true }, [h('option', { value: '', text: placeholder })].concat(opts.map((o) => h('option', { value: o[0], text: o[1] }))));

  views.admin = async () => {
    const s = state.session;
    const [sum, opts] = await Promise.all([call('api_getAdminSummary'), call('api_getAdminOptions')]);
    const users = s.isSuperAdmin ? await call('api_listUsers') : null;
    const t = sum.totals;
    const tile = (n, label, warn) => h('div', { class: 'tile' + (warn && n > 0 ? ' warn' : '') }, [h('div', { class: 'n', text: String(n) }), h('div', { class: 'muted', text: label })]);
    const root = h('div', null, [
      h('div', { class: 'page-head' }, [h('h1', { text: 'Administration' }), h('p', { text: 'Course and enrollment overview. Add or edit courses and lessons directly in the Google Sheet for now.' })]),
      h('div', { class: 'tiles' }, [tile(t.publishedCourses + '/' + t.courses, 'Courses published'), tile(t.activeUsers, 'Active users'),
        tile(t.activeEnrollments, 'Active enrollments'), tile(t.completed, 'Completed'), tile(t.overdue, 'Overdue', true)])
    ]);

    root.appendChild(h('h2', { text: 'Courses' }));
    root.appendChild(sum.courses.length ? h('div', { class: 'table-wrap' }, [h('table', null, [
      h('thead', null, [h('tr', null, ['Course', 'Category', 'Status', 'Lessons', 'Enrolled', 'In progress', 'Completed', 'Overdue'].map((x) => h('th', { scope: 'col', text: x })))]),
      h('tbody', null, sum.courses.map((c) => h('tr', null, [h('td', { text: c.title }), h('td', { text: c.category || '\u2013' }), h('td', { text: c.published ? 'Published' : 'Draft' }),
        h('td', { text: String(c.lessonCount) }), h('td', { text: String(c.enrolled) }), h('td', { text: String(c.inProgress) }), h('td', { text: String(c.completed) }), h('td', { text: String(c.overdue) })])))
    ])]) : empty('No courses yet', 'Add rows to the COURSES and LESSONS sheets, then publish a course.'));

    // Assign form
    const uSel = sel('as-user', opts.users.map((u) => [u.userId, u.fullName + (u.department ? ' (' + u.department + ')' : '')]), 'Choose an employee');
    const cSel = sel('as-course', opts.courses.map((c) => [c.courseId, c.title]), 'Choose a published course');
    const due = h('input', { type: 'date', id: 'as-due' });
    const submit = h('button', { class: 'btn primary', type: 'submit', text: 'Assign course' });
    const form = h('form', { class: 'section', novalidate: true }, [h('h2', { text: 'Assign a course' }),
      h('div', { class: 'form-grid' }, [formField('Employee', 'as-user', uSel), formField('Course', 'as-course', cSel), formField('Due date (optional)', 'as-due', due), submit])]);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!uSel.value || !cSel.value) { toast('Choose an employee and a course.', 'error'); return; }
      submit.disabled = true; submit.textContent = 'Assigning\u2026';
      try { await call('api_assignCourse', { userId: uSel.value, courseId: cSel.value, dueDate: due.value }); toast('Course assigned'); render(); }
      catch (err) { toast(err.message, 'error'); submit.disabled = false; submit.textContent = 'Assign course'; }
    });
    root.appendChild(form);

    if (users) root.appendChild(userAdmin(users));
    return root;
  };

  function userAdmin(users) {
    const wrap = h('div', { class: 'section' }, [h('h2', { text: 'Users and roles' })]);
    wrap.appendChild(h('div', { class: 'table-wrap' }, [h('table', null, [
      h('thead', null, [h('tr', null, ['Name', 'Email', 'Department', 'Role', 'Manager', 'Active'].map((x) => h('th', { scope: 'col', text: x })))]),
      h('tbody', null, users.map((u) => h('tr', null, [h('td', { text: u.fullName }), h('td', { text: u.email }), h('td', { text: u.department || '\u2013' }),
        h('td', { text: u.role }), h('td', { text: u.managerEmail || '\u2013' }), h('td', { text: u.isActive ? 'Yes' : 'No' })])))
    ])]));
    const f = {
      email: h('input', { type: 'email', id: 'u-email', required: true, autocomplete: 'off' }), name: h('input', { type: 'text', id: 'u-name', required: true, maxlength: '120' }),
      dept: h('input', { type: 'text', id: 'u-dept', maxlength: '80' }), mgr: h('input', { type: 'email', id: 'u-mgr', autocomplete: 'off' }),
      role: sel('u-role', ['EMPLOYEE', 'TEAM_LEAD', 'LMS_ADMIN', 'SUPER_ADMIN'].map((r) => [r, r]), 'Choose a role'),
      active: sel('u-active', [['true', 'Active'], ['false', 'Inactive']], 'Choose status')
    };
    f.active.value = 'true';
    const submit = h('button', { class: 'btn primary', type: 'submit', text: 'Save user' });
    const form = h('form', { novalidate: true }, [h('h3', { text: 'Add or update a user' }), h('p', { class: 'caption', text: 'Saving an email that already exists updates that user.' }),
      h('div', { class: 'form-grid' }, [formField('Work email', 'u-email', f.email), formField('Full name', 'u-name', f.name), formField('Department', 'u-dept', f.dept),
        formField('Manager email', 'u-mgr', f.mgr), formField('Role', 'u-role', f.role), formField('Status', 'u-active', f.active), submit])]);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submit.disabled = true; submit.textContent = 'Saving\u2026';
      try {
        const r = await call('api_saveUser', { email: f.email.value, fullName: f.name.value, department: f.dept.value, managerEmail: f.mgr.value, role: f.role.value, isActive: f.active.value === 'true' });
        toast(r.created ? 'User added' : 'User updated'); render();
      } catch (err) { toast(err.message, 'error'); submit.disabled = false; submit.textContent = 'Save user'; }
    });
    wrap.appendChild(form);
    return wrap;
  }

  // ---------- sign-in / access denied / boot ----------
  const gate = document.getElementById('gate');
  function showGate(content) {
    document.querySelector('.app').hidden = true;
    gate.hidden = false;
    gate.replaceChildren(h('section', { class: 'gate-card' }, [
      h('div', { class: 'brand' }, [h('span', { class: 'brand-mark', 'aria-hidden': 'true', text: 'S' }), h('span', { text: 'SPUN Learning Hub' })]), content
    ]));
  }
  async function signOut() {
    try { await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' }); } catch (e) { /* reload anyway */ }
    location.reload();
  }
  async function onCredential(resp) {
    const msg = document.getElementById('gsiMsg');
    msg.textContent = 'Signing in\u2026';
    try {
      const r = await fetch('/api/session', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: resp.credential }) });
      if (r.ok) { location.reload(); return; }
      const b = await r.json().catch(() => ({}));
      msg.textContent = b.message || 'Sign-in failed. Please try again.';
    } catch (e) { msg.textContent = 'Could not reach the server. Please try again.'; }
  }
  async function showSignIn() {
    showGate(h('div', null, [
      h('h1', { text: 'Sign in to continue' }),
      h('p', { class: 'muted', text: 'Use your Google account. Only people registered by the LMS administrator can enter.' }),
      h('div', { id: 'gsiBtn' }), h('p', { id: 'gsiMsg', class: 'caption', role: 'alert' })
    ]));
    let info = {};
    try { info = await (await fetch('/api/session', { credentials: 'same-origin' })).json(); } catch (e) { /* shown below */ }
    if (!info.clientId) { document.getElementById('gsiMsg').textContent = 'Sign-in is not configured. Contact the LMS administrator.'; return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      google.accounts.id.initialize({ client_id: info.clientId, callback: onCredential, auto_select: false });
      google.accounts.id.renderButton(document.getElementById('gsiBtn'), { theme: 'outline', size: 'large', text: 'signin_with', width: 280 });
    };
    document.head.appendChild(s);
  }
  const DENIED = { NOT_REGISTERED: 1, INACTIVE: 1, DUPLICATE_USER: 1, BAD_ROLE: 1, DOMAIN_DENIED: 1, NO_IDENTITY: 1 };
  function showDenied(email, err) {
    showGate(h('div', null, [
      h('h1', { text: 'You can\u2019t open the Learning Hub' }), h('p', { text: err.message }),
      email ? [h('p', { class: 'label', text: 'Signed in as' }), h('p', { class: 'acct', text: email })] : null,
      h('p', { class: 'muted', text: 'Not the right account? Sign out and use another Google account.' }),
      h('button', { class: 'btn primary', type: 'button', text: 'Sign out', onclick: signOut }), h('p', { class: 'caption', text: 'Reference: ' + err.code })
    ]));
  }

  (async function boot() {
    main.replaceChildren(spinner());
    let info = {};
    try { info = await (await fetch('/api/session', { credentials: 'same-origin' })).json(); }
    catch (e) { main.replaceChildren(errorBox({ message: 'Could not reach the server. Check your connection and try again.' }, () => location.reload())); return; }
    if (!info.signedIn) { showSignIn(); return; }
    try {
      state.session = await call('api_getSession');
      document.getElementById('userBox').replaceChildren(h('strong', { text: state.session.fullName }), h('span', { text: state.session.email }),
        h('button', { class: 'btn', type: 'button', text: 'Sign out', onclick: signOut }));
      go('dashboard');
    } catch (e) {
      if (e.code === 'SIGNED_OUT') return;
      if (DENIED[e.code]) showDenied(info.email, e); else main.replaceChildren(errorBox(e, () => location.reload()));
    }
  })();
})();

