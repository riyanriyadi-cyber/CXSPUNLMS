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
      const active = state.view === it.id || (state.view === 'course' && it.id === 'catalog') || (state.view === 'courseEdit' && it.id === 'admin');
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

  // ---------- shared form helpers ----------
  function formField(label, id, control, hint) {
    return h('div', { class: 'field' }, [h('label', { for: id, text: label }), control, hint ? h('p', { class: 'hint', text: hint }) : null]);
  }
  function input(id, type, value, extra) { const el = h('input', Object.assign({ id: id, type: type, autocomplete: 'off' }, extra || {})); el.value = value == null ? '' : value; return el; }
  function textarea(id, value, rows, extra) { const el = h('textarea', Object.assign({ id: id, rows: rows || 4 }, extra || {})); el.value = value || ''; return el; }
  function select(id, options, value) { const el = h('select', { id: id }, options.map((o) => h('option', { value: o[0], text: o[1] }))); el.value = value; return el; }
  function checkbox(id, label, checked) {
    const cb = h('input', { type: 'checkbox', id: id }); cb.checked = !!checked;
    return { cb: cb, node: h('div', { class: 'check' }, [cb, h('label', { for: id, text: label })]) };
  }
  const formError = () => h('p', { class: 'form-error', role: 'alert' });
  async function withBusy(btn, busyText, fn) {
    const orig = btn.textContent; btn.disabled = true; btn.textContent = busyText;
    try { return await fn(); } finally { btn.disabled = false; btn.textContent = orig; }
  }
  const smallBtn = (text, label, onclick, disabled) => h('button', { class: 'btn sm', type: 'button', text: text, 'aria-label': label, title: label, disabled: disabled ? true : null, onclick: onclick });
  const TYPE_LABEL = { TEXT: 'Text', IMAGE: 'Image', VIDEO: 'Video', DRIVE: 'Google Drive / Docs file' };
  const TYPE_HINT = {
    IMAGE: 'Paste a link to an image (it must start with https://) or to an image in Google Drive.',
    VIDEO: 'Paste a YouTube, Vimeo or Google Drive video link.',
    DRIVE: 'Paste a link to a file in Google Drive, or to a Google Doc, Slides or Sheet. Employees must have access to the file.'
  };

  // ---------- Administration ----------
  const adminTabs = {};

  views.admin = async () => {
    const s = state.session;
    const tabs = [['overview', 'Overview'], ['courses', 'Courses'], ['assign', 'Assign courses']].concat(s.isSuperAdmin ? [['users', 'People']] : []);
    if (!state.adminTab || !tabs.some((t) => t[0] === state.adminTab)) state.adminTab = 'overview';
    const body = h('div', { role: 'tabpanel' });
    const bar = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Administration sections' });
    function paintBar() {
      bar.replaceChildren.apply(bar, tabs.map((t) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(state.adminTab === t[0]), text: t[1], onclick: () => show(t[0]) })));
    }
    async function show(tab) {
      state.adminTab = tab; paintBar(); body.replaceChildren(spinner());
      try { body.replaceChildren(await adminTabs[tab](show)); } catch (e) { body.replaceChildren(errorBox(e, () => show(tab))); }
    }
    const root = h('div', null, [h('div', { class: 'page-head' }, [h('h1', { text: 'Administration' }),
      h('p', { text: 'Create courses and lessons, assign them to employees, and see overall progress.' })]), bar, body]);
    show(state.adminTab);
    return root;
  };

  const tile = (n, label, warn) => h('div', { class: 'tile' + (warn && n > 0 ? ' warn' : '') }, [h('div', { class: 'n', text: String(n) }), h('div', { class: 'muted', text: label })]);

  adminTabs.overview = async () => {
    const sum = await call('api_getAdminSummary'); const t = sum.totals;
    return h('div', null, [
      h('div', { class: 'tiles' }, [tile(t.publishedCourses + '/' + t.courses, 'Courses published'), tile(t.activeUsers, 'Active people'), tile(t.activeEnrollments, 'Active assignments'), tile(t.completed, 'Completed'), tile(t.overdue, 'Overdue', true)]),
      sum.courses.length ? h('div', { class: 'table-wrap' }, [h('table', null, [
        h('thead', null, [h('tr', null, ['Course', 'Category', 'Status', 'Lessons', 'Assigned', 'In progress', 'Completed', 'Overdue'].map((x) => h('th', { scope: 'col', text: x })))]),
        h('tbody', null, sum.courses.map((c) => h('tr', null, [h('td', { text: c.title }), h('td', { text: c.category || '\u2013' }), h('td', { text: c.published ? 'Published' : 'Draft' }),
          h('td', { text: String(c.lessonCount) }), h('td', { text: String(c.enrolled) }), h('td', { text: String(c.inProgress) }), h('td', { text: String(c.completed) }), h('td', { text: String(c.overdue) })])))
      ])]) : empty('No courses yet', 'Open the Courses tab and click \u201CNew course\u201D.')
    ]);
  };

  adminTabs.courses = async () => {
    const list = await call('api_adminListCourses');
    return h('div', null, [
      h('p', null, [h('button', { class: 'btn primary', type: 'button', text: 'New course', onclick: () => go('courseEdit', null) })]),
      list.length ? h('div', { class: 'table-wrap' }, [h('table', null, [
        h('thead', null, [h('tr', null, ['Course', 'Category', 'Status', 'Lessons', 'Assigned', ''].map((x) => h('th', { scope: 'col', text: x })))]),
        h('tbody', null, list.map((c) => h('tr', null, [h('td', null, [h('strong', { text: c.title })]), h('td', { text: c.category || '\u2013' }),
          h('td', null, [h('span', { class: 'badge ' + (c.published ? 'COMPLETED' : 'NOT_STARTED'), text: c.published ? 'Published' : 'Draft' })]),
          h('td', { text: String(c.lessonCount) }), h('td', { text: String(c.assignedCount) }),
          h('td', null, [h('button', { class: 'btn sm', type: 'button', text: 'Edit', 'aria-label': 'Edit ' + c.title, onclick: () => go('courseEdit', c.courseId) })])])))
      ])]) : empty('No courses yet', 'Click \u201CNew course\u201D to create your first one.')
    ]);
  };

  views.courseEdit = async (courseId) => {
    const isNew = !courseId;
    let data;
    if (isNew) {
      const all = await call('api_adminListCourses');
      data = { course: { title: '', description: '', category: '', durationMinutes: 0, overviewUrl: '', isPublished: false }, lessons: [], assignedCount: 0,
        categories: Array.from(new Set(all.map((c) => c.category).filter(Boolean))).sort() };
    } else data = await call('api_adminGetCourse', courseId);
    const c = data.course;
    const back = () => { state.adminTab = 'courses'; go('admin'); };

    // ----- course details form -----
    const f = { title: input('c-title', 'text', c.title, { maxlength: '150', required: true }), desc: textarea('c-desc', c.description, 4, { maxlength: '2000' }),
      cat: input('c-cat', 'text', c.category, { list: 'cat-list', maxlength: '60' }), dur: input('c-dur', 'number', c.durationMinutes, { min: '0', max: '10000' }),
      url: input('c-url', 'url', c.overviewUrl, { placeholder: 'https://\u2026' }) };
    const pub = checkbox('c-pub', 'Published', c.isPublished);
    const cerr = formError();
    const save = h('button', { class: 'btn primary', type: 'submit', text: isNew ? 'Create course' : 'Save course' });
    const form = h('form', { class: 'panel', novalidate: true }, [h('h2', { text: 'Course details' }),
      h('div', { class: 'form-grid' }, [formField('Title', 'c-title', f.title), formField('Category', 'c-cat', f.cat, 'Used for filtering. Pick an existing one or type a new one.'),
        formField('Estimated duration (minutes)', 'c-dur', f.dur)]),
      h('datalist', { id: 'cat-list' }, data.categories.map((x) => h('option', { value: x }))),
      formField('Description', 'c-desc', f.desc, 'A short summary employees see on the course card.'),
      formField('Extra materials link (optional)', 'c-url', f.url, 'A link starting with https:// shown as \u201COpen course materials\u201D.'),
      isNew ? h('p', { class: 'hint', text: 'New courses start as drafts. Add lessons after creating the course, then publish it.' }) : [pub.node,
        h('p', { class: 'hint', text: 'Employees only see a published course, and only if you assign it to them (Assign courses tab).' })],
      cerr, h('div', { class: 'actions-row' }, [save])]);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); cerr.textContent = '';
      await withBusy(save, 'Saving\u2026', async () => {
        try {
          const r = await call('api_adminSaveCourse', { courseId: isNew ? undefined : courseId, title: f.title.value, description: f.desc.value, category: f.cat.value,
            durationMinutes: f.dur.value, overviewUrl: f.url.value, isPublished: pub.cb.checked });
          if (isNew) { toast('Course created. Now add its lessons.'); go('courseEdit', r.courseId); } else { toast('Course saved'); await reload(); }
        } catch (err) { cerr.textContent = err.message; }
      });
    });

    const root = h('div', null, [
      h('p', { class: 'crumbs' }, [h('button', { class: 'btn link', type: 'button', text: '\u2190 Back to courses', onclick: back })]),
      h('div', { class: 'page-head' }, [h('h1', { text: isNew ? 'New course' : c.title })]), form]);
    if (isNew) return root;

    // ----- lessons -----
    const listEl = h('ol', { class: 'lesson-admin' });
    const editorHolder = h('div'); const previewHolder = h('div');
    const assignedNote = h('div');
    function paintNote() {
      assignedNote.replaceChildren(data.assignedCount ? h('div', { class: 'notice info' }, [h('p', { text: data.assignedCount + ' employee' + (data.assignedCount === 1 ? ' is' : 's are') + ' assigned to this course. Changes to lessons are visible to them straight away.' })]) : null);
    }
    async function reload() { data = await call('api_adminGetCourse', courseId); paintLessons(); paintNote(); }
    async function act(fn, okMsg) { try { await fn(); if (okMsg) toast(okMsg); await reload(); } catch (e) { toast(e.message, 'error'); } }

    function paintLessons() {
      listEl.replaceChildren();
      if (!data.lessons.length) listEl.appendChild(h('li', { class: 'empty-row', text: 'No lessons yet. Click \u201CAdd lesson\u201D below.' }));
      data.lessons.forEach((l, i) => {
        listEl.appendChild(h('li', { class: 'lesson-row' }, [
          h('span', { class: 'num', 'aria-hidden': 'true', text: String(i + 1) }),
          h('div', { class: 'grow' }, [h('strong', { text: l.title }), h('div', { class: 'caption', text: TYPE_LABEL[l.type] + ' \u00B7 ' + (l.required ? 'Required' : 'Optional') })]),
          h('div', { class: 'row-actions' }, [
            smallBtn('\u2191', 'Move ' + l.title + ' up', () => act(() => call('api_adminMoveLesson', courseId, l.lessonId, 'up')), i === 0),
            smallBtn('\u2193', 'Move ' + l.title + ' down', () => act(() => call('api_adminMoveLesson', courseId, l.lessonId, 'down')), i === data.lessons.length - 1),
            smallBtn('Preview', 'Preview ' + l.title, () => preview(l)), smallBtn('Edit', 'Edit ' + l.title, () => openEditor(l)),
            smallBtn('Delete', 'Delete ' + l.title, () => {
              if (window.confirm('Delete the lesson \u201C' + l.title + '\u201D?\n\nEmployees\u2019 progress on this lesson will be removed too.')) act(() => call('api_adminDeleteLesson', courseId, l.lessonId), 'Lesson deleted');
            })])
        ]));
      });
    }

    async function preview(l) {
      previewHolder.replaceChildren(spinner());
      try {
        const r = await call('api_adminPreviewLesson', courseId, l.lessonId);
        previewHolder.replaceChildren(h('div', { class: 'panel' }, [h('h3', { text: 'Preview: ' + r.lesson.title }),
          h('p', { class: 'caption', text: 'This is what employees see. Nothing is recorded.' })].concat(contentNode(r.lesson.content, r.lesson.title),
          [h('button', { class: 'btn', type: 'button', text: 'Close preview', onclick: () => previewHolder.replaceChildren() })])));
        previewHolder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) { previewHolder.replaceChildren(errorBox(e)); }
    }

    function openEditor(l) {
      const edit = !!l;
      const type = select('l-type', Object.keys(TYPE_LABEL).map((k) => [k, TYPE_LABEL[k]]), l ? l.type : 'TEXT');
      const title = input('l-title', 'text', l ? l.title : '', { maxlength: '150', required: true });
      const text = textarea('l-text', l ? l.contentText : '', 8, { maxlength: '20000' });
      const url = input('l-url', 'url', l ? l.contentUrl : '', { placeholder: 'https://\u2026' });
      const req = checkbox('l-req', 'Required (counts towards course progress)', l ? l.required : true);
      const textField = formField('Lesson text', 'l-text', text, 'Leave a blank line between paragraphs. Plain text only.');
      const urlField = formField('Link', 'l-url', url, TYPE_HINT.IMAGE);
      const err = formError();
      const saveBtn = h('button', { class: 'btn primary', type: 'submit', text: edit ? 'Save lesson' : 'Add lesson' });
      function sync() {
        const t = type.value;
        urlField.hidden = t === 'TEXT';
        urlField.querySelector('.hint').textContent = TYPE_HINT[t] || '';
        textField.querySelector('label').textContent = t === 'TEXT' ? 'Lesson text' : 'Caption (optional)';
        textField.querySelector('.hint').textContent = t === 'TEXT' ? 'Leave a blank line between paragraphs. Plain text only.' : 'A short note shown under the content.';
      }
      type.addEventListener('change', sync); sync();
      const form = h('form', { class: 'panel', novalidate: true }, [h('h3', { text: edit ? 'Edit lesson' : 'New lesson' }),
        formField('Lesson title', 'l-title', title), formField('Type', 'l-type', type), urlField, textField, req.node, err,
        h('div', { class: 'actions-row' }, [saveBtn, h('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => editorHolder.replaceChildren() })])]);
      form.addEventListener('submit', async (e) => {
        e.preventDefault(); err.textContent = '';
        await withBusy(saveBtn, 'Saving\u2026', async () => {
          try {
            await call('api_adminSaveLesson', { courseId: courseId, lessonId: edit ? l.lessonId : undefined, title: title.value, lessonType: type.value,
              contentText: text.value, contentUrl: type.value === 'TEXT' ? '' : url.value, isRequired: req.cb.checked });
            toast(edit ? 'Lesson saved' : 'Lesson added'); editorHolder.replaceChildren(); await reload();
          } catch (e2) { err.textContent = e2.message; }
        });
      });
      editorHolder.replaceChildren(form); title.focus(); form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const delBtn = h('button', { class: 'btn danger', type: 'button', text: 'Delete this course', onclick: async () => {
      if (!window.confirm('Delete \u201C' + c.title + '\u201D and all of its lessons? This cannot be undone.')) return;
      try { await call('api_adminDeleteCourse', courseId); toast('Course deleted'); back(); } catch (e) { toast(e.message, 'error'); }
    } });
    paintLessons(); paintNote();
    root.appendChild(assignedNote);
    root.appendChild(h('section', { class: 'section', 'aria-labelledby': 'lessons-h' }, [
      h('h2', { id: 'lessons-h', text: 'Lessons' }), h('p', { class: 'muted', text: 'Employees go through lessons in this order. Progress is calculated from the required lessons.' }),
      listEl, h('p', null, [h('button', { class: 'btn primary', type: 'button', text: 'Add lesson', onclick: () => openEditor(null) })]), editorHolder, previewHolder]));
    root.appendChild(h('section', { class: 'section danger-zone' }, [h('h2', { text: 'Delete course' }),
      h('p', { class: 'muted', text: 'A course that employees have been assigned cannot be deleted. Unpublish it instead and their records stay safe.' }), delBtn]));
    return root;
  };

  adminTabs.assign = async () => {
    const opts = await call('api_getAdminOptions');
    if (!opts.courses.length) return empty('No published courses yet', 'Create a course, add at least one required lesson, and publish it. Then you can assign it here.');
    const cSel = select('as-course', [['', 'Choose a published course']].concat(opts.courses.map((c) => [c.courseId, c.title])), '');
    const due = input('as-due', 'date', '');
    const q = input('as-q', 'search', '', { placeholder: 'Search by name or department' });
    const chosen = new Set();
    const list = h('div', { class: 'checklist', role: 'group', 'aria-label': 'Employees' });
    const count = h('p', { class: 'caption', 'aria-live': 'polite' });
    const result = h('div', { 'aria-live': 'polite' });
    const submit = h('button', { class: 'btn primary', type: 'submit', text: 'Assign course' });
    let shown = [];
    function paint() {
      const term = q.value.trim().toLowerCase();
      shown = opts.users.filter((u) => !term || (u.fullName + ' ' + (u.department || '')).toLowerCase().indexOf(term) >= 0);
      list.replaceChildren();
      if (!shown.length) list.appendChild(h('p', { class: 'muted', text: 'No people match.' }));
      shown.forEach((u) => {
        const cb = h('input', { type: 'checkbox', id: 'u-' + u.userId }); cb.checked = chosen.has(u.userId);
        cb.addEventListener('change', () => { if (cb.checked) chosen.add(u.userId); else chosen.delete(u.userId); paintCount(); });
        list.appendChild(h('div', { class: 'check' }, [cb, h('label', { for: 'u-' + u.userId, text: u.fullName + (u.department ? ' (' + u.department + ')' : '') })]));
      });
      paintCount();
    }
    const paintCount = () => { count.textContent = chosen.size + ' selected'; };
    q.addEventListener('input', paint); paint();
    const form = h('form', { class: 'panel', novalidate: true }, [h('h2', { text: 'Assign a course' }),
      h('div', { class: 'form-grid' }, [formField('Course', 'as-course', cSel), formField('Due date (optional)', 'as-due', due)]),
      h('div', { class: 'field' }, [h('span', { class: 'label', text: 'Employees' }), q,
        h('div', { class: 'actions-row' }, [smallBtn('Select all shown', 'Select all shown employees', () => { shown.forEach((u) => chosen.add(u.userId)); paint(); }),
          smallBtn('Clear', 'Clear selection', () => { chosen.clear(); paint(); }), count]), list]),
      submit, result]);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); result.replaceChildren();
      if (!cSel.value) { toast('Choose a course first.', 'error'); return; }
      if (!chosen.size) { toast('Choose at least one employee.', 'error'); return; }
      await withBusy(submit, 'Assigning\u2026', async () => {
        try {
          const r = await call('api_assignCourse', { courseId: cSel.value, userIds: Array.from(chosen), dueDate: due.value });
          toast(r.assigned + ' assigned'); chosen.clear(); paint();
          result.replaceChildren(h('div', { class: 'notice info' }, [h('p', { text: r.assigned + ' employee' + (r.assigned === 1 ? '' : 's') + ' assigned.' }),
            r.skipped.length ? h('p', { text: 'Skipped: ' + r.skipped.map((s) => s.name + ' (' + s.reason + ')').join(', ') + '.' }) : null]));
        } catch (err) { toast(err.message, 'error'); }
      });
    });
    return form;
  };

  adminTabs.users = async () => {
    const users = await call('api_listUsers');
    const q = input('p-q', 'search', '', { placeholder: 'Search people' });
    const tbody = h('tbody');
    const fe = { email: input('u-email', 'email', '', { required: true }), name: input('u-name', 'text', '', { maxlength: '120', required: true }), dept: input('u-dept', 'text', '', { maxlength: '80' }),
      mgr: input('u-mgr', 'email', ''), role: select('u-role', ['EMPLOYEE', 'TEAM_LEAD', 'LMS_ADMIN', 'SUPER_ADMIN'].map((r) => [r, r]), 'EMPLOYEE'), active: select('u-active', [['true', 'Active'], ['false', 'Inactive']], 'true') };
    const uerr = formError(); const usave = h('button', { class: 'btn primary', type: 'submit', text: 'Save person' });
    const form = h('form', { class: 'panel', id: 'user-form', novalidate: true }, [h('h3', { text: 'Add or edit a person' }),
      h('p', { class: 'hint', text: 'Use the Google account (Gmail or work email) the person signs in with. Saving an email that already exists updates that person.' }),
      h('div', { class: 'form-grid' }, [formField('Email', 'u-email', fe.email), formField('Full name', 'u-name', fe.name), formField('Department', 'u-dept', fe.dept),
        formField('Manager\u2019s email', 'u-mgr', fe.mgr, 'Lets this manager (a Team Lead) see this person\u2019s progress.'), formField('Role', 'u-role', fe.role), formField('Status', 'u-active', fe.active)]), uerr, usave]);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); uerr.textContent = '';
      await withBusy(usave, 'Saving\u2026', async () => {
        try { const r = await call('api_saveUser', { email: fe.email.value, fullName: fe.name.value, department: fe.dept.value, managerEmail: fe.mgr.value, role: fe.role.value, isActive: fe.active.value === 'true' }); toast(r.created ? 'Person added' : 'Person updated'); go('admin'); }
        catch (err) { uerr.textContent = err.message; }
      });
    });
    function paint() {
      const term = q.value.trim().toLowerCase();
      tbody.replaceChildren.apply(tbody, users.filter((u) => !term || (u.fullName + ' ' + u.email + ' ' + (u.department || '')).toLowerCase().indexOf(term) >= 0).map((u) => h('tr', null, [
        h('td', { text: u.fullName }), h('td', { text: u.email }), h('td', { text: u.department || '\u2013' }), h('td', { text: u.role }), h('td', { text: u.managerEmail || '\u2013' }), h('td', { text: u.isActive ? 'Active' : 'Inactive' }),
        h('td', null, [smallBtn('Edit', 'Edit ' + u.fullName, () => { fe.email.value = u.email; fe.name.value = u.fullName; fe.dept.value = u.department || ''; fe.mgr.value = u.managerEmail || ''; fe.role.value = u.role; fe.active.value = String(u.isActive); form.scrollIntoView({ behavior: 'smooth' }); fe.name.focus(); })])])));
    }
    q.addEventListener('input', paint); paint();

    const bulk = textarea('b-text', '', 6, { placeholder: 'ani@gmail.com, Ani Wijaya, Sales, manager@gmail.com\nbudi@gmail.com, Budi Santoso, Finance' });
    const berr = formError(); const bres = h('div', { 'aria-live': 'polite' }); const bsave = h('button', { class: 'btn primary', type: 'submit', text: 'Add these people' });
    const bform = h('form', { class: 'panel', novalidate: true }, [h('h3', { text: 'Add many people at once' }),
      h('p', { class: 'hint', text: 'One person per line: email, full name, department, manager\u2019s email (department and manager are optional). New people are added as Employees. People who already exist keep their role and status; their name, department and manager are updated.' }),
      formField('People', 'b-text', bulk), berr, bsave, bres]);
    bform.addEventListener('submit', async (e) => {
      e.preventDefault(); berr.textContent = ''; bres.replaceChildren();
      await withBusy(bsave, 'Adding\u2026', async () => {
        try {
          const r = await call('api_importUsers', { text: bulk.value });
          bres.replaceChildren(h('div', { class: 'notice ' + (r.errors.length ? 'error' : 'info') }, [h('p', { text: r.added + ' added, ' + r.updated + ' updated' + (r.errors.length ? ', ' + r.errors.length + ' line(s) need attention:' : '.') }),
            r.errors.length ? h('ul', null, r.errors.map((x) => h('li', { text: 'Line ' + x.line + ': ' + x.message }))) : null]));
          if (!r.errors.length) { toast('People added'); bulk.value = ''; }
        } catch (err) { berr.textContent = err.message; }
      });
    });
    return h('div', null, [h('div', { class: 'filters' }, [h('div', { class: 'field' }, [h('label', { for: 'p-q', text: 'Search' }), q])]),
      h('div', { class: 'table-wrap' }, [h('table', null, [h('thead', null, [h('tr', null, ['Name', 'Email', 'Department', 'Role', 'Manager', 'Status', ''].map((x) => h('th', { scope: 'col', text: x })))]), tbody])]),
      h('div', { class: 'section' }, [form]), h('div', { class: 'section' }, [bform])]);
  };

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

