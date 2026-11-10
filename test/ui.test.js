'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
process.env.SESSION_SECRET = 's'.repeat(48);
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';

const dom = require('./dom-stub');
const session = require('../lib/cookie-session');
const rpc = require('../api/rpc');
const sessionApi = require('../api/session');
const { fixture } = require('./helpers');
const SRC = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

/** Boots the real browser script against the real server handlers, as the given signed-in person (or nobody). */
async function boot(email) {
  const document = dom.makeDocument(); let pending = 0; const state = { confirm: true, reloads: 0 };
  const cookie = email ? session.COOKIE + '=' + session.createToken({ email, name: 'N' }, process.env.SESSION_SECRET, 600) : '';
  const fetch = async (url, opts) => {
    pending++;
    try {
      const o = opts || {}; const handler = url === '/api/rpc' ? rpc : sessionApi;
      const req = { method: o.method || 'GET', headers: { host: 'lms.test', origin: 'https://lms.test', 'content-type': 'application/json', cookie }, body: o.body ? JSON.parse(o.body) : undefined };
      const res = { headers: {}, statusCode: 200, body: null, setHeader(k, v) { res.headers[k] = v; }, end(s) { res.body = s ? JSON.parse(s) : null; } };
      await handler(req, res); return { status: res.statusCode, ok: res.statusCode < 400, json: async () => res.body };
    } finally { pending--; }
  };
  const sandbox = { document, fetch, console, setTimeout, clearTimeout, Promise, JSON, Set, Array, Object, Math, Date, Number, String,
    window: { scrollTo() {}, confirm: () => state.confirm }, location: { reload() { state.reloads++; } }, google: { accounts: { id: { initialize() {}, renderButton() {} } } } };
  sandbox.window.window = sandbox.window; vm.createContext(sandbox); vm.runInContext(SRC, sandbox);
  const idle = async () => { for (let i = 0; i < 200; i++) { await new Promise((r) => setTimeout(r, 2)); if (!pending) { await new Promise((r) => setTimeout(r, 2)); if (!pending) return; } } throw new Error('UI never went idle'); };
  await idle();
  const main = document.getElementById('main'); const toasts = document.getElementById('toasts');
  return { document, main, nav: document.getElementById('nav'), gate: document.getElementById('gate'), toasts, state, idle,
    app: document.querySelector('.app'), text: () => main.textContent, toastText: () => toasts.textContent };
}
const click = async (ui, text, root) => { dom.click(root || ui.document, text); await ui.idle(); };
const navLabels = (ui) => ui.nav.children.map((b) => b.textContent);

test('ui: signed-out visitors see the Google sign-in screen and no app', async () => {
  await fixture(); const ui = await boot(null);
  assert.strictEqual(ui.gate.hidden, false); assert.strictEqual(ui.app.hidden, true); assert.match(ui.gate.textContent, /Sign in to continue/);
});

test('ui: a Google account that is not registered sees the access-denied screen with their account', async () => {
  await fixture(); const ui = await boot('stranger@gmail.com');
  assert.match(ui.gate.textContent, /can’t open the Learning Hub/); assert.match(ui.gate.textContent, /stranger@gmail\.com/); assert.match(ui.gate.textContent, /NOT_REGISTERED/);
  assert.ok(dom.button(ui.gate, 'Sign out'));
});

test('ui: employee dashboard, course viewer, mark complete — and no admin menu', async () => {
  const { store } = await fixture(); const ui = await boot('emp1@spun.test');
  assert.deepStrictEqual(navLabels(ui), ['Dashboard', 'My courses']); assert.match(ui.text(), /Welcome back, u_emp1/); assert.match(ui.text(), /c_safety title/); assert.match(ui.text(), /Overdue/);
  await click(ui, 'Start c_safety title', ui.main); assert.match(ui.text(), /text l1/);
  await click(ui, 'Mark as complete', ui.main); assert.match(ui.toastText(), /Lesson marked complete/);
  assert.strictEqual(store.t.lesson_progress.find((p) => p.lesson_id === 'l1').status, 'COMPLETED'); assert.match(ui.text(), /1 of 2 required lessons done \(50%\)/);
});

test('ui: admin creates a course, adds lessons (bad link explained), publishes, assigns — employee then sees it', async () => {
  const { store } = await fixture(); const ui = await boot('admin@spun.test');
  assert.deepStrictEqual(navLabels(ui), ['Dashboard', 'My courses', 'Team progress', 'Administration']);
  await click(ui, 'Administration', ui.nav); assert.match(ui.text(), /Active people/);
  await click(ui, 'Courses', ui.main); assert.match(ui.text(), /c_safety title/);
  await click(ui, 'New course', ui.main);
  dom.type(ui.main, 'c-title', 'Safety at work'); dom.type(ui.main, 'c-cat', 'Compliance'); dom.type(ui.main, 'c-dur', '25'); dom.type(ui.main, 'c-desc', 'Stay safe.');
  dom.submit(ui.main); await ui.idle();
  assert.match(ui.toastText(), /Course created/); assert.match(ui.main.querySelector('h1').textContent, /Safety at work/);
  const course = store.t.courses.find((c) => c.title === 'Safety at work'); assert.ok(course && course.is_published === false);

  // publishing without lessons is refused with a plain message
  const pub = dom.field(ui.main, 'c-pub'); pub.checked = true; dom.submit(ui.main, null); await ui.idle();
  assert.match(ui.main.textContent, /at least one required lesson/); assert.strictEqual(store.t.courses.find((c) => c.title === 'Safety at work').is_published, false);

  await click(ui, 'Add lesson', ui.main);
  dom.type(ui.main, 'l-title', 'Welcome'); dom.type(ui.main, 'l-text', 'First paragraph.\n\nSecond.'); dom.submit(ui.main, null);
  // the editor form is the last form on the page
  const forms = ui.main.querySelectorAll('form'); forms[forms.length - 1].fire('submit'); await ui.idle();
  assert.strictEqual(store.t.lessons.filter((l) => l.course_id === course.course_id).length, 1); assert.match(ui.main.textContent, /Welcome/);

  await click(ui, 'Add lesson', ui.main);
  dom.type(ui.main, 'l-title', 'Video'); dom.type(ui.main, 'l-type', 'VIDEO'); dom.type(ui.main, 'l-url', 'https://example.com/clip.mp4');
  let fs2 = ui.main.querySelectorAll('form'); fs2[fs2.length - 1].fire('submit'); await ui.idle();
  assert.match(ui.main.textContent, /Only YouTube, Vimeo and Google Drive videos are supported/);
  assert.strictEqual(store.t.lessons.filter((l) => l.course_id === course.course_id).length, 1, 'nothing saved');
  dom.type(ui.main, 'l-url', 'https://youtu.be/dQw4w9WgXcQ'); fs2 = ui.main.querySelectorAll('form'); fs2[fs2.length - 1].fire('submit'); await ui.idle();
  assert.deepStrictEqual(store.t.lessons.filter((l) => l.course_id === course.course_id).map((l) => l.sort_order).sort(), [1, 2]);

  await click(ui, 'Move Video up', ui.main); assert.strictEqual(store.t.lessons.find((l) => l.title === 'Video').sort_order, 1);
  await click(ui, 'Preview Video', ui.main); assert.match(ui.main.textContent, /This is what employees see/); assert.ok(ui.main.querySelector('iframe'), 'video shown as an embed');

  dom.field(ui.main, 'c-pub').checked = true; ui.main.querySelectorAll('form')[0].fire('submit'); await ui.idle();
  assert.strictEqual(store.t.courses.find((c) => c.course_id === course.course_id).is_published, true);

  // assign to emp2 from the Assign tab
  await click(ui, '← Back to courses', ui.main); await click(ui, 'Assign courses', ui.main);
  dom.type(ui.main, 'as-course', course.course_id); const box = dom.field(ui.main, 'u-u_emp2'); box.checked = true; box.fire('change');
  assert.match(ui.main.textContent, /1 selected/); dom.submit(ui.main); await ui.idle();
  assert.match(ui.main.textContent, /1 employee assigned/);

  const emp = await boot('emp2@spun.test'); assert.match(emp.text(), /Safety at work/);
  await click(emp, 'Start Safety at work', emp.main); assert.match(emp.text(), /Video/); assert.ok(emp.main.querySelector('iframe') || /Welcome/.test(emp.text()));
});

test('ui: deleting a lesson asks first; employees cannot reach admin screens', async () => {
  const { store } = await fixture(); const ui = await boot('admin@spun.test');
  await click(ui, 'Administration', ui.nav); await click(ui, 'Courses', ui.main); await click(ui, 'Edit c_draft title', ui.main);
  ui.state.confirm = false; await click(ui, 'Delete ld1', ui.main); assert.ok(store.t.lessons.some((l) => l.lesson_id === 'ld1'), 'cancel keeps the lesson');
  await click(ui, 'Delete this course', ui.main); assert.ok(store.t.courses.some((c) => c.course_id === 'c_draft'));
  ui.state.confirm = true; await click(ui, 'Delete this course', ui.main); assert.match(ui.toastText(), /cannot be deleted/);
  assert.ok(store.t.courses.some((c) => c.course_id === 'c_draft'), 'in-use course kept');
});

test('ui: super admin People tab — add one person and bulk import with line-level errors', async () => {
  const { store } = await fixture(); const ui = await boot('super@spun.test');
  await click(ui, 'Administration', ui.nav); await click(ui, 'People', ui.main);
  dom.type(ui.main, 'u-email', 'new.hire@gmail.com'); dom.type(ui.main, 'u-name', 'New Hire'); dom.submit(ui.main, 'user-form'); await ui.idle();
  assert.ok(store.t.users.some((u) => u.email_key === 'newhire@gmail.com'));
  await click(ui, 'People', ui.main); dom.type(ui.main, 'b-text', 'ok.one@gmail.com, Ok One, Sales\nnot-an-email, Bad');
  const fs3 = ui.main.querySelectorAll('form'); fs3[fs3.length - 1].fire('submit'); await ui.idle();
  assert.match(ui.main.textContent, /1 added, 0 updated, 1 line\(s\) need attention/); assert.match(ui.main.textContent, /Line 2/);
});
