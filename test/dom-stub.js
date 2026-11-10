'use strict';
/** A tiny DOM, just enough to run public/app.js in Node and drive it like a user (click, type, submit). */
class Text { constructor(d) { this.nodeType = 3; this.data = String(d); this.parent = null; } get textContent() { return this.data; } }
class El {
  constructor(tag) {
    this.nodeType = 1; this.tag = tag.toLowerCase(); this.children = []; this.attrs = {}; this.listeners = {}; this.parent = null;
    this.className = ''; this.hidden = false; this.value = ''; this.checked = false; this._dis = false; this.style = {};
    const self = this; this.classList = {
      toggle(c, on) { const s = new Set(self.className.split(/\s+/).filter(Boolean)); (on === undefined ? !s.has(c) : on) ? s.add(c) : s.delete(c); self.className = Array.from(s).join(' '); },
      contains: (c) => self.className.split(/\s+/).includes(c)
    };
  }
  get disabled() { return this._dis || 'disabled' in this.attrs; }
  set disabled(v) { this._dis = !!v; if (!v) delete this.attrs.disabled; }
  get textContent() { return this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; if (String(v) !== '') this.appendChild(new Text(v)); }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  appendChild(n) { if (n.parent) n.parent.children = n.parent.children.filter((c) => c !== n); n.parent = this; this.children.push(n); return n; }
  replaceChildren(...nodes) { this.children = []; nodes.forEach((n) => { if (n !== null && n !== undefined) this.appendChild(typeof n === 'object' ? n : new Text(n)); }); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); }
  focus() {} scrollIntoView() {}
  *walk() { for (const c of this.children) { if (c.nodeType === 1) { yield c; yield* c.walk(); } } }
  matches(sel) {
    if (sel[0] === '.') return this.className.split(/\s+/).includes(sel.slice(1));
    if (sel[0] === '#') return this.attrs.id === sel.slice(1);
    return this.tag === sel;
  }
  querySelector(sel) { for (const e of this.walk()) if (e.matches(sel)) return e; return null; }
  querySelectorAll(sel) { return Array.from(this.walk()).filter((e) => e.matches(sel)); }
  fire(type, extra) {
    const ev = Object.assign({ type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }, extra);
    (this.listeners[type] || []).forEach((fn) => fn(ev)); return ev;
  }
}

function makeDocument() {
  const doc = new El('document');
  const mk = (tag, id, cls, parent) => { const e = new El(tag); if (id) e.setAttribute('id', id); if (cls) e.className = cls; (parent || doc).appendChild(e); return e; };
  const app = mk('div', null, 'app'); mk('aside', 'sidebar', 'sidebar', app); mk('nav', 'nav', 'nav', app); mk('div', 'userBox', 'user-box', app); mk('div', 'scrim', 'scrim', app);
  mk('button', 'menuBtn', null, app); mk('p', 'pageTitle', null, app); mk('main', 'main', null, app);
  mk('div', 'toasts', 'toasts'); mk('div', 'gate', 'gate').hidden = true;
  doc.head = new El('head');
  doc.getElementById = (id) => { for (const e of doc.walk()) if (e.attrs.id === id) return e; return null; };
  doc.createElement = (t) => new El(t); doc.createTextNode = (t) => new Text(t);
  const dl = {}; doc.addEventListener = (t, fn) => { (dl[t] = dl[t] || []).push(fn); };
  return doc;
}

// ---- helpers to act like a user ----
const all = (root, pred) => Array.from(root.walk()).filter(pred);
const button = (root, text) => all(root, (e) => e.tag === 'button' && !e.hidden && (e.textContent === text || e.attrs['aria-label'] === text)).find(Boolean);
const field = (root, id) => root.walk && Array.from(root.walk()).find((e) => e.attrs.id === id);
function click(root, text) { const b = button(root, text); if (!b) throw new Error('No button "' + text + '" — buttons: ' + all(root, (e) => e.tag === 'button').map((e) => e.textContent).join(' | ')); if (!b.disabled) b.fire('click'); return b; }
const type = (root, id, value) => { const f = field(root, id); if (!f) throw new Error('No field #' + id); f.value = value; f.fire('input'); f.fire('change'); };
const submit = (root, formId) => { const f = formId ? field(root, formId) : root.querySelector('form'); const e = f.fire('submit'); return e; };
module.exports = { El, makeDocument, all, button, field, click, type, submit };
