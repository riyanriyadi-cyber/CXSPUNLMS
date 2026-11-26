// Panel admin SPUN Learning Hub: kelola materi (draft → publish), peserta, dan laporan.
// Semua data dari API admin; semua teks ditampilkan lewat esc() karena isinya ditulis pengguna.
(async () => {
  'use strict';
  const boot = await window.hubReady;
  const me = boot.profile;
  const $ = (q, r = document) => r.querySelector(q);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const main = $('#main'), modal = $('#modal');
  $('#admin-name').textContent = me.name; $('#admin-email').textContent = me.email;

  if (me.role !== 'admin') {
    main.innerHTML = `<div class="admin-denied"><h1>Halaman khusus admin</h1><p>Akun ${esc(me.email)} belum memiliki akses admin. Minta admin lain menjadikanmu admin di menu Peserta.</p><a class="btn btn-orange" href="/">Kembali ke Learning Hub</a></div>`;
    return;
  }

  const api = {get: p => window.hubRequest(p), post: (p, d = {}) => window.hubRequest(p, {method: 'POST', body: JSON.stringify(d)})};
  const KIND = {
    course: {label: 'Course', unit: 'modul', icon: '📘', blank: {title: '', category: '', description: '', level: 'Fundamental', color: 'peach', art: 'conversation', lessons: []}},
    quiz: {label: 'Quiz', unit: 'pertanyaan', icon: '📝', blank: {title: '', category: '', description: '', minutes: 5, color: 'peach', course: '', questions: []}},
    article: {label: 'Artikel', unit: 'bagian', icon: '📄', blank: {title: '', category: '', description: '', minutes: 5, color: 'peach', art: 'conversation', featured: false, sections: []}},
    sop: {label: 'SOP', unit: 'item', icon: '📋', blank: {title: '', category: '', description: '', color: 'peach', active: true, teams: [], docs: [{title: '', url: ''}], sections: []}}
  };
  const COLORS = [['peach', 'Peach'], ['sage', 'Hijau sage'], ['lavender', 'Lavender'], ['blue', 'Biru'], ['sand', 'Pasir'], ['pink', 'Pink']];
  const ARTS = [['conversation', 'Percakapan'], ['listening', 'Mendengarkan'], ['quality', 'Kualitas'], ['journey', 'Perjalanan'], ['documents', 'Dokumen'], ['ownership', 'Ownership'], ['growth', 'Pertumbuhan']];
  const LEVELS = [['Fundamental', 'Fundamental'], ['Intermediate', 'Intermediate'], ['Advanced', 'Advanced']];
  const STATUS = {draft: ['Draft', 'st-draft'], published: ['Tayang', 'st-live'], changed: ['Tayang · ada perubahan', 'st-changed']};
  const USTATUS = {active: ['Aktif', 'st-live'], invited: ['Menunggu aktivasi', 'st-changed'], disabled: ['Nonaktif', 'st-off']};
  const NAV = [['content/course', 'Course'], ['content/quiz', 'Quiz'], ['content/article', 'Artikel'], ['content/sop', 'SOP'], ['scores', 'Nilai Quiz'], ['grading', 'Penilaian'], ['people', 'Kelola peserta']];
  // Halaman di bawah menu "Kelola peserta" (tampil sebagai tab di atas halaman).
  const PEOPLE = [['users', 'Peserta'], ['teams', 'Tim'], ['onboarding', 'Onboarding'], ['report', 'Laporan']];
  let pendingCount = 0;

  let items = [];          // ringkasan konten
  let editor = null;       // {kind,id,draft,revision,status,dirty,error,publishedAt}
  let users = [];
  const openKeys = new Set();
  let lastHash = location.hash;

  // ---------- util ----------
  const fmtDate = iso => iso ? new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'}).format(new Date(iso)) : '—';
  const badge = ([text, cls]) => `<span class="st ${cls}">${esc(text)}</span>`;
  const getPath = (o, p) => p.split('.').reduce((v, k) => v?.[k], o);
  const setPath = (o, p, val) => {const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((v, k) => v[k] ??= {}, o); if (val === undefined) delete t[last]; else t[last] = val;};
  const newId = () => 'm' + Math.random().toString(36).slice(2, 10);
  const plainToHtml = t => String(t || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean).map(x => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('');
  const sectionHtml = s => s.html ?? plainToHtml(s.body);
  let rtes = [];
  const destroyRtes = () => {rtes.forEach(r => {try {r.destroy();} catch {}}); rtes = [];};
  function askText(label, value = '') {
    return new Promise(resolve => {
      showModal('Masukkan nilai', `<form id="ask-form" class="admin-form"><label>${esc(label)}<input name="v" value="${esc(value)}" autocomplete="off" /></label><div class="confirm-actions"><button type="button" class="btn btn-outline" data-ask="cancel">Batal</button><button class="btn btn-orange" type="submit">Simpan</button></div></form>`);
      const form = $('#ask-form'), input = form.querySelector('input'); input.focus(); input.select();
      let done = false; const finish = v => {if (done) return; done = true; modal.removeEventListener('close', onClose); closeModal(); resolve(v);};
      const onClose = () => finish(null);
      modal.addEventListener('close', onClose);
      form.addEventListener('submit', e => {e.preventDefault(); finish(input.value);});
      form.querySelector('[data-ask=cancel]').addEventListener('click', () => finish(null));
    });
  }
  async function uploadFile(file) {
    const {uploadUrl, publicUrl} = await api.post('/api/admin/media/upload-url', {contentType: file.type, size: file.size});
    const form = new FormData(); form.append('cacheControl', '31536000'); form.append('', file);
    const res = await fetch(uploadUrl, {method: 'PUT', body: form, headers: {'x-upsert': 'false'}});
    if (!res.ok) throw new Error('Unggahan ditolak Supabase Storage (' + res.status + ').');
    return publicUrl;
  }
  function mountRtes() {
    if (!window.HubEditor) {toast('Editor teks gagal dimuat. Muat ulang halaman.', true); return;}
    main.querySelectorAll('[data-rte]').forEach(el => {
      const p = el.dataset.rte, s = getPath(editor.draft, p);
      if (s.html === undefined) {s.html = plainToHtml(s.body); delete s.body;}
      rtes.push(window.HubEditor.create(el, {
        html: s.html,
        onChange: h => {const t = getPath(editor.draft, p); if (t) {t.html = h; delete t.body;} markDirty();},
        upload: uploadFile,
        isOwnImage: src => /\/storage\/v1\/object\/public\/lms-media\//.test(src),
        notify: (m, bad) => toast(m, bad),
        ask: askText
      }));
    });
  }
  const ytId = s => {
    s = String(s || '').trim(); if (!s) return ''; if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    try {const u = new URL(s), h = u.hostname.replace(/^www\.|^m\./, ''); let id = h === 'youtu.be' ? u.pathname.slice(1).split('/')[0] : u.pathname === '/watch' ? u.searchParams.get('v') : (u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/) || [])[1];
      return ['youtu.be', 'youtube.com', 'youtube-nocookie.com'].includes(h) && /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;} catch {return null;}
  };
  let toastTimer;
  function toast(text, bad = false) {const t = $('#toast'); t.textContent = text; t.classList.toggle('toast-bad', bad); t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4200);}
  function showModal(title, html, wide = false) {
    $('#modal-content').innerHTML = `<header class="modal-header"><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" data-act="close-modal" aria-label="Tutup">✕</button></header><div class="modal-body">${html}</div>`;
    modal.classList.toggle('modal-wide', wide === true);
    modal.classList.toggle('modal-full', wide === 'full');
    if (!modal.open) modal.showModal();
  }
  const closeModal = () => {if (modal.open) modal.close();};
  function confirmBox(message, ok = 'Lanjutkan', danger = false) {
    return new Promise(resolve => {
      showModal('Konfirmasi', `<p class="confirm-text">${esc(message)}</p><div class="confirm-actions"><button class="btn btn-outline" data-confirm="0">Batal</button><button class="btn ${danger ? 'btn-danger' : 'btn-orange'}" data-confirm="1">${esc(ok)}</button></div>`);
      const done = v => {modal.removeEventListener('click', onClick); modal.removeEventListener('close', onClose); closeModal(); resolve(v);};
      const onClick = e => {const b = e.target.closest('[data-confirm]'); if (b) done(b.dataset.confirm === '1');};
      const onClose = () => done(false);
      modal.addEventListener('click', onClick); modal.addEventListener('close', onClose);
    });
  }
  const heading = (kicker, title, sub, right = '') => `<div class="admin-head"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1>${sub ? `<p class="subtitle">${sub}</p>` : ''}</div><div class="admin-head-actions">${right}</div></div>`;

  // ---------- routing ----------
  function nav(active) {
    const sub = PEOPLE.find(p => p[0] === active) || (active === 'raport' ? PEOPLE[0] : null), group = sub ? 'people' : active;
    let tabs = $('#people-tabs');
    if (!tabs) {tabs = document.createElement('nav'); tabs.id = 'people-tabs'; tabs.setAttribute('aria-label', 'Kelola peserta'); main.before(tabs);}
    tabs.innerHTML = sub ? `<div class="people-tabs">${PEOPLE.map(([h, label]) => `<a class="people-tab ${sub[0] === h ? 'active' : ''}" href="#${h}" ${sub[0] === h ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</div>` : '';
    $('#admin-nav').innerHTML = NAV.map(([h, label]) => `<a class="nav-item ${group === h ? 'active' : ''}" href="#${h === 'people' ? 'users' : h}">${label}${h === 'grading' && pendingCount ? `<span class="nav-badge" aria-label="${pendingCount} menunggu penilaian">${pendingCount}</span>` : ''}</a>`).join('');
    navActive = active;
    $('#breadcrumb').textContent = 'Admin · ' + (sub ? `Kelola peserta · ${active === 'raport' ? 'Raport' : sub[1]}` : NAV.find(n => n[0] === active)?.[1] || 'Editor');
  }
  let navActive = '';
  async function refreshPending() {try {const {pending} = await api.get('/api/admin/grading/count'); if (pending !== pendingCount) {pendingCount = pending; const t = $('#breadcrumb').textContent; nav(navActive); $('#breadcrumb').textContent = t;}} catch {}}
  async function route() {
    await ensureTeams().catch(() => {});
    const [page, a, b] = location.hash.slice(1).split('/');
    destroyRtes();
    $('#sidebar').classList.remove('open'); $('#mobile-scrim').classList.remove('visible');
    try {
      if (page === 'people') {location.replace('#users'); return;}
      if (page === 'edit' && KIND[a] && b) {nav('content/' + a); await openEditor(a, b);}
      else if (page === 'users') {editor = null; nav('users'); await renderUsers();}
      else if (page === 'raport' && a) {editor = null; nav('raport'); await renderAdminRaport(a);}
      else if (page === 'scores') {editor = null; nav('scores'); await (a ? renderQuizScores(decodeURIComponent(a)) : renderScores());}
      else if (page === 'teams') {editor = null; nav('teams'); await renderTeams();}
      else if (page === 'onboarding') {editor = null; nav('onboarding'); await renderOnboarding();}
      else if (page === 'grading') {editor = null; nav('grading'); await (a && b ? renderGradeForm(a, b) : renderGrading(a === 'graded' ? 'graded' : 'pending'));}
      else if (page === 'report') {editor = null; nav('report'); await renderReport();}
      else {editor = null; const k = KIND[a] ? a : 'course'; nav('content/' + k); await renderList(k);}
    } catch (e) {main.innerHTML = `<div class="admin-denied"><h1>Belum dapat memuat.</h1><p>${esc(e.message)}</p><button class="btn btn-orange" data-act="reload">Coba lagi</button></div>`;}
    lastHash = location.hash; main.focus({preventScroll: true});
    refreshPending();
  }
  window.addEventListener('hashchange', async () => {
    if (editor?.dirty && location.hash !== lastHash) {
      const target = location.hash; history.replaceState(null, '', lastHash || '#');
      if (!await confirmBox('Ada perubahan yang belum disimpan. Tinggalkan editor tanpa menyimpan?', 'Tinggalkan', true)) return;
      editor.dirty = false; history.pushState(null, '', target);
    }
    route();
  });
  window.addEventListener('beforeunload', e => {if (editor?.dirty) {e.preventDefault(); e.returnValue = '';}});

  // ---------- daftar materi ----------
  async function renderList(kind) {
    items = (await api.get('/api/admin/content')).items;
    const list = items.filter(i => i.kind === kind), K = KIND[kind];
    const tabs = Object.entries(KIND).map(([k, v]) => `<a class="tab ${k === kind ? 'active' : ''}" href="#content/${k}">${v.label}<span>${items.filter(i => i.kind === k).length}</span></a>`).join('');
    main.innerHTML = `<div class="content-fade">${heading('Kelola materi', `${K.label}`, 'Perubahan disimpan sebagai draft. Peserta hanya melihat versi yang sudah di-publish.', `${kind === 'quiz' ? '<button class="btn btn-outline" data-act="quiz-template">Unduh template</button><button class="btn btn-outline" data-act="quiz-export">Ekspor semua quiz</button><button class="btn btn-outline" data-act="quiz-import">Impor Excel/CSV</button>' : ''}<button class="btn btn-orange" data-act="new" data-kind="${kind}">+ ${K.label} baru</button>`)}
      <div class="catalog-toolbar"><div class="tabs">${tabs}</div></div>
      ${list.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th class="col-order">Urutan</th><th>Judul</th><th>Isi</th><th>Status</th><th>Terakhir diubah</th><th class="col-actions">Aksi</th></tr></thead><tbody>
      ${list.map((it, i) => `<tr>
        <td class="col-order"><button class="mini" data-act="move-item" data-id="${esc(it.id)}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">↑</button><button class="mini" data-act="move-item" data-id="${esc(it.id)}" data-dir="1" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Turunkan">↓</button></td>
        <td><a class="row-title" href="#edit/${kind}/${esc(it.id)}">${esc(it.title)}</a><small>${esc(it.category || 'Tanpa kategori')}</small><div class="team-chips">${kind === 'quiz' && it.course ? teamChips(items.find(c => c.kind === 'course' && c.id === it.course)?.teams || [], '') : teamChips(it.teams, '')}</div></td>
        <td>${it.count} ${K.unit}</td>
        <td>${badge(STATUS[it.status])}${it.kind === 'sop' && it.active === false ? ' ' + badge(['Tidak berlaku', 'st-late']) : ''}</td>
        <td><span class="when">${fmtDate(it.updatedAt)}</span>${it.updatedBy ? `<small>oleh ${esc(it.updatedBy)}</small>` : ''}</td>
        <td class="col-actions"><a class="btn btn-outline" href="#edit/${kind}/${esc(it.id)}">Edit</a>
          ${it.status !== 'published' ? `<button class="btn btn-subtle" data-act="publish-item" data-kind="${kind}" data-id="${esc(it.id)}">Publish</button>` : ''}
          ${it.status !== 'draft' ? `<button class="btn btn-outline" data-act="unpublish-item" data-kind="${kind}" data-id="${esc(it.id)}">Sembunyikan</button>` : `<button class="btn btn-outline btn-danger-text" data-act="delete-item" data-kind="${kind}" data-id="${esc(it.id)}">Hapus</button>`}</td>
      </tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><h3>Belum ada ${K.label.toLowerCase()}.</h3><p>Buat ${K.label.toLowerCase()} pertama, simpan sebagai draft, lalu publish saat siap.</p></div>`}
    </div>`;
  }
  function newItemDialog(kind) {
    const K = KIND[kind], cats = [...new Set(items.map(i => i.category).filter(Boolean))];
    showModal(`${K.label} baru`, `<form id="new-form" class="admin-form">
      <label>Judul<input name="title" required maxlength="140" placeholder="Judul ${K.label.toLowerCase()}" /></label>
      <label>Kategori<input name="category" maxlength="60" list="cat-list" placeholder="Mis. Customer Experience" /></label>
      <datalist id="cat-list">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      <div class="form-error" role="alert"></div>
      <div class="confirm-actions"><button type="button" class="btn btn-outline" data-act="close-modal">Batal</button><button class="btn btn-orange" type="submit">Buat & mulai mengedit</button></div></form>`);
    $('#new-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), btn = e.target.querySelector('[type=submit]'); btn.disabled = true;
      try {
        const draft = {...structuredClone(K.blank), title: f.title.trim(), category: f.category.trim()};
        if (kind === 'course') {const id = newId(); draft.lessons = [{id, title: '', duration: 5, intro: '', sections: [{heading: '', html: ''}]}]; openKeys.add('L:' + id);}
        if (kind === 'quiz') {draft.questions = [{q: '', options: ['', '', '', ''], answer: null, why: ''}]; openKeys.add('Q:0');}
        if (kind === 'article') draft.sections = [{heading: '', html: ''}];
        const {item} = await api.post(`/api/admin/content/${kind}`, {draft});
        closeModal(); location.hash = `#edit/${kind}/${item.id}`;
      } catch (err) {e.target.querySelector('.form-error').textContent = err.message; btn.disabled = false;}
    });
  }

  // ---------- editor ----------
  async function openEditor(kind, id) {
    if (!editor || editor.kind !== kind || editor.id !== id) {
      const [{item}] = await Promise.all([api.get(`/api/admin/content/${kind}/${id}`), kind === 'quiz' || !items.length ? api.get('/api/admin/content').then(r => {items = r.items;}) : null]);
      editor = {kind, id, draft: item.draft, revision: item.revision, status: item.status, publishedAt: item.publishedAt, dirty: false, error: ''};
    }
    renderEditor();
  }
  const val = p => getPath(editor.draft, p);
  const fInput = (label, p, o = {}) => `<label class="${o.cls || ''}">${label}<input data-f="${p}" ${o.num ? 'data-num type="number" min="1" max="600"' : 'type="text"'} value="${esc(val(p) ?? '')}" ${o.max ? `maxlength="${o.max}"` : ''} ${o.list ? `list="${o.list}"` : ''} placeholder="${esc(o.ph || '')}" />${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
  const fText = (label, p, o = {}) => `<label class="${o.cls || ''}">${label}<textarea data-f="${p}" rows="${o.rows || 3}" ${o.max ? `maxlength="${o.max}"` : ''} placeholder="${esc(o.ph || '')}">${esc(val(p) ?? '')}</textarea>${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
  const fSelect = (label, p, opts, o = {}) => `<label class="${o.cls || ''}">${label}<select data-f="${p}" ${o.rerender ? 'data-rerender' : ''}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val(p) ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const tools = (arr, i, n, what) => `<span class="ed-tools"><button type="button" class="mini" data-act="move" data-arr="${arr}" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan ${what}">↑</button><button type="button" class="mini" data-act="move" data-arr="${arr}" data-i="${i}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Turunkan ${what}">↓</button><button type="button" class="mini mini-danger" data-act="remove" data-arr="${arr}" data-i="${i}" aria-label="Hapus ${what}">✕</button></span>`;
  const catList = () => `<datalist id="cat-list">${[...new Set(items.map(i => i.category).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;

  const DOC_LABEL = {doc: 'Google Docs', sheet: 'Google Sheets', slides: 'Google Slides', form: 'Google Forms', drive: 'File Google Drive', folder: 'Folder Google Drive', pdf: 'PDF', link: 'Tautan'};
  function docKind(url) {
    let u; try {u = new URL(url);} catch {return null;}
    if (u.protocol !== 'https:') return null;
    const h = u.hostname, p = u.pathname;
    if (h === 'docs.google.com') return /^\/document\//.test(p) ? 'doc' : /^\/spreadsheets\//.test(p) ? 'sheet' : /^\/presentation\//.test(p) ? 'slides' : /^\/forms\//.test(p) ? 'form' : 'link';
    if (h === 'drive.google.com') return /\/folders\//.test(p) ? 'folder' : 'drive';
    return /\.pdf$/i.test(p) ? 'pdf' : 'link';
  }
  const docHint = url => {if (!url) return 'Tempel link Google Docs, Sheets, Slides, file/folder Drive, atau PDF.'; const k = docKind(url); return k ? `Terdeteksi: ${DOC_LABEL[k]}${['doc', 'sheet', 'slides', 'form', 'drive', 'folder'].includes(k) ? ' ✓ bisa dipratinjau' : ' · dibuka di tab baru'}` : 'Link harus diawali https://';};
  function docsEditor(base, opt = {}) {
    const list = val(base) || [];
    const opts = [['', 'Pilih artikel atau course…'], ...items.filter(i => i.kind === 'article').map(i => ['article:' + i.id, 'Artikel · ' + i.title]), ...items.filter(i => i.kind === 'course' && !(editor.kind === 'course' && i.id === editor.id)).map(i => ['course:' + i.id, 'Course · ' + i.title])];
    return `<div class="ed-docs"><h4 class="ed-subhead">${opt.title || 'Dokumen terkait <small>opsional · tampil sebagai kartu di bawah isi</small>'}</h4>
      ${list.map((x, j) => {const p = `${base}.${j}`, internal = x.ref !== undefined;
        return `<div class="ed-doc">${internal ? fSelect('Artikel / course LMS', `${p}.ref`, opts, {cls: 'span-2'}) : `<label class="span-2">Link<input type="url" data-f="${p}.url" data-doc-url value="${esc(x.url || '')}" maxlength="1000" placeholder="https://docs.google.com/…" /><small class="doc-detect">${esc(docHint(x.url))}</small></label>`}
        ${fInput('Judul (opsional)', `${p}.title`, {max: 160, ph: internal ? 'Pakai judul artikel/course' : 'Contoh: SOP Verifikasi Dokumen'})}
        <span class="ed-tools">${tools(base, j, list.length, 'dokumen').replace(/^<span class="ed-tools">|<\/span>$/g, '')}</span></div>`;}).join('')}
      <div class="ed-doc-add"><button type="button" class="btn btn-subtle" data-act="add-doc" data-arr="${base}">+ Link dokumen</button> <button type="button" class="btn btn-subtle" data-act="add-doc" data-arr="${base}" data-internal="1">+ Artikel/course LMS</button></div>
      <p class="ed-doc-note">File Google Drive: atur <b>Bagikan → Akses umum → "Siapa saja yang memiliki link" (Viewer)</b> agar bisa dibuka peserta, termasuk freelancer di luar akun SPUN. Jangan menautkan file berisi data pelanggan.</p></div>`;
  }
  function sectionsEditor(base) {
    const list = val(base) || [];
    return `<div class="ed-sections">${list.map((s, j) => {
      const p = `${base}.${j}`, video = s.video ? (s.video.url ?? (s.video.youtubeId ? `https://youtu.be/${s.video.youtubeId}` : '')) : '';
      const vid = ytId(video);
      return `<div class="ed-section"><div class="ed-section-head"><strong>Bagian ${j + 1}</strong>${tools(base, j, list.length, 'bagian')}</div>
        ${fInput('Subjudul', `${p}.heading`, {max: 160, ph: 'Opsional'})}
        <div class="ed-media">
          <div class="ed-media-col"><label>Video YouTube<input data-f="${p}.video" data-video type="url" value="${esc(video)}" placeholder="https://www.youtube.com/watch?v=…" /><small class="${vid === null ? 'hint-bad' : vid ? 'hint-ok' : ''}" data-video-hint>${vid === null ? 'Link YouTube tidak dikenali.' : vid ? 'Video terdeteksi ✓' : 'Opsional. Tampil di atas gambar & isi. Untuk video di tengah teks, pakai tombol ▶ di toolbar Isi.'}</small></label></div>
          <div class="ed-media-col"><span class="ed-label">Gambar utama bagian (opsional)</span>${s.image?.url ? `<div class="ed-image"><img src="${esc(s.image.url)}" alt="" /><div>${fInput('Teks alternatif (deskripsi gambar)', `${p}.image.alt`, {max: 200})}${fInput('Keterangan (opsional)', `${p}.image.caption`, {max: 200})}<button type="button" class="btn btn-outline btn-danger-text" data-act="remove-image" data-path="${p}">Hapus gambar</button></div></div>` : `<button type="button" class="btn btn-outline" data-act="upload-image" data-path="${p}">Unggah gambar</button><small>PNG, JPG, WEBP, atau GIF · maks. 5 MB</small>`}</div>
        </div>
        <div class="ed-rte"><span class="ed-label">Isi</span><div class="rte-host" data-rte="${p}"></div><small class="ed-hint">Paste (Ctrl/Cmd+V) atau drag gambar langsung ke kolom isi. Tab / Shift+Tab mengatur indent di dalam list.</small></div>
</div>`;
    }).join('')}<button type="button" class="btn btn-subtle" data-act="add-section" data-arr="${base}">+ Tambah bagian</button></div>`;
  }
  function lessonCard(l, i, n) {
    const key = 'L:' + l.id;
    return `<details class="ed-item" data-key="${esc(key)}" ${openKeys.has(key) ? 'open' : ''}>
      <summary><span class="ed-num">${i + 1}</span><span class="ed-title">${esc(l.title || 'Modul tanpa judul')}</span><span class="ed-meta">${Number(l.duration) || 0} menit · ${(l.sections || []).length} bagian</span>${tools('lessons', i, n, 'modul')}</summary>
      <div class="ed-body"><div class="form-grid">${fInput('Judul modul', `lessons.${i}.title`, {max: 160, cls: 'span-2'})}${fInput('Durasi (menit)', `lessons.${i}.duration`, {num: true})}</div>
      ${fText('Pengantar', `lessons.${i}.intro`, {rows: 2, max: 2000, hint: 'Ditampilkan sebagai kotak ringkasan di awal modul.'})}
      <h4 class="ed-subhead">Isi modul</h4>${sectionsEditor(`lessons.${i}.sections`)}${docsEditor(`lessons.${i}.docs`)}
      <div class="ed-item-foot"><button type="button" class="btn btn-outline" data-act="preview-lesson" data-i="${i}">Pratinjau modul</button></div></div></details>`;
  }
  function questionCard(q, i, n) {
    const key = 'Q:' + i, opts = q.options || [], essay = q.type === 'essay';
    const meta = essay ? `Essay · ${Number(q.points) || 5} poin` : q.answer === null || q.answer === undefined ? '<em class="hint-bad">jawaban belum dipilih</em>' : `Jawaban: ${String.fromCharCode(65 + Number(q.answer))} · ${Number(q.points) || 1} poin`;
    return `<details class="ed-item" data-key="${key}" ${openKeys.has(key) ? 'open' : ''}>
      <summary><span class="ed-num">${i + 1}</span><span class="ed-title">${essay ? '<span class="q-kind">Essay</span>' : ''}${esc(q.q || 'Pertanyaan baru')}</span><span class="ed-meta">${meta}</span>${tools('questions', i, n, 'pertanyaan')}</summary>
      <div class="ed-body"><div class="ed-row">${fSelect('Tipe soal', `questions.${i}.type`, [['mc', 'Pilihan ganda'], ['essay', 'Essay (dinilai admin)']], {rerender: true})}<label>Poin<input data-f="questions.${i}.points" data-num type="number" min="1" max="100" step="1" value="${esc(q.points ?? (essay ? 5 : 1))}" /><small>${essay ? 'Nilai maksimal soal ini.' : 'Bobot soal ini dalam skor.'}</small></label></div>
      ${fText('Pertanyaan', `questions.${i}.q`, {rows: essay ? 3 : 2, max: essay ? 2000 : 600})}
      ${essay ? fText('Rubrik / contoh jawaban', `questions.${i}.rubric`, {rows: 4, max: 4000, hint: 'Hanya terlihat oleh penilai. Setelah dinilai, ditampilkan ke peserta sebagai pembahasan.'}) : `<span class="ed-label">Pilihan jawaban <small>(pilih bulatan pada jawaban yang benar)</small></span>
      <div class="ed-options">${opts.map((o, j) => `<div class="ed-option"><input type="radio" name="ans-${i}" data-f="questions.${i}.answer" data-num value="${j}" ${Number(q.answer) === j && q.answer !== null ? 'checked' : ''} aria-label="Tandai pilihan ${String.fromCharCode(65 + j)} sebagai jawaban benar" /><span class="answer-letter">${String.fromCharCode(65 + j)}</span><input type="text" data-f="questions.${i}.options.${j}" value="${esc(o)}" maxlength="400" placeholder="Pilihan ${String.fromCharCode(65 + j)}" />${opts.length > 2 ? `<button type="button" class="mini mini-danger" data-act="remove-option" data-q="${i}" data-i="${j}" aria-label="Hapus pilihan">✕</button>` : ''}</div>`).join('')}
      ${opts.length < 6 ? `<button type="button" class="btn btn-subtle" data-act="add-option" data-q="${i}">+ Tambah pilihan</button>` : ''}</div>
      ${fText('Pembahasan', `questions.${i}.why`, {rows: 2, max: 2000, hint: 'Ditampilkan ke peserta setelah quiz dikumpulkan.'})}`}</div></details>`;
  }
  function audienceField(kind, d) {
    if (kind === 'quiz' && d.course) {const c = items.find(i => i.kind === 'course' && i.id === d.course); return `<div class="aud-field"><span class="ed-label">Untuk tim</span><p class="hint">Mengikuti course terkait${c ? ` "<b>${esc(c.title)}</b>"` : ''}: ${teamChips(c?.teams || [])}. Ubah audiens di course tersebut.</p></div>`;}
    const sel = d.teams || [];
    return `<div class="aud-field"><span class="ed-label">Untuk tim</span><div class="aud-choice"><label class="team-check"><input type="radio" name="aud-mode" value="all" data-aud-mode ${sel.length ? '' : 'checked'} /> Semua tim</label><label class="team-check"><input type="radio" name="aud-mode" value="some" data-aud-mode ${sel.length ? 'checked' : ''} ${teamList?.length ? '' : 'disabled'} /> Tim tertentu</label></div>
      ${sel.length || editor.audSome ? teamChecks('aud-team', sel, {attr: 'data-aud-team'}) : ''}${teamList?.length ? '' : '<p class="hint">Belum ada tim. Buat dulu di menu <a href="#teams">Tim</a>.</p>'}
      <small class="hint">${kind === 'course' ? 'Quiz yang ditautkan ke course ini ikut mengikuti audiensnya.' : 'Peserta di luar tim yang dipilih tidak melihat materi ini.'}</small></div>`;
  }
  function renderEditor() {
    destroyRtes();
    const {kind, draft: d, status} = editor, K = KIND[kind];
    let body = '';
    if (kind === 'course') {
      body = `<section class="ed-card"><h2>Informasi course</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori', 'category', {max: 60, list: 'cat-list'})}${fSelect('Level', 'level', LEVELS)}${fSelect('Warna kartu', 'color', COLORS)}${fSelect('Ilustrasi', 'art', ARTS)}</div>${fText('Deskripsi', 'description', {rows: 2, max: 500})}${audienceField(kind, d)}${catList()}</section>
        <section class="ed-card"><div class="ed-card-head"><h2>Modul <span class="count">${d.lessons.length}</span></h2><small>Durasi course dihitung otomatis: ${d.lessons.reduce((n, l) => n + (Number(l.duration) || 0), 0)} menit</small></div>
        ${d.lessons.map((l, i) => lessonCard(l, i, d.lessons.length)).join('')}<button type="button" class="btn btn-subtle" data-act="add-lesson">+ Tambah modul</button></section>`;
    } else if (kind === 'quiz') {
      const courses = items.filter(i => i.kind === 'course');
      body = `<section class="ed-card"><h2>Informasi quiz</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori', 'category', {max: 60, list: 'cat-list'})}${fInput('Estimasi (menit)', 'minutes', {num: true})}${fSelect('Warna kartu', 'color', COLORS)}${fSelect('Course terkait', 'course', [['', '— Tidak ada —'], ...courses.map(c => [c.id, c.title + (c.status === 'draft' ? ' (belum tayang)' : '')])], {rerender: true})}</div>${fText('Deskripsi', 'description', {rows: 2, max: 500})}${audienceField(kind, d)}${catList()}<p class="ed-note">Nilai lulus latihan: 80. Peserta bisa mengulang tanpa batas.</p></section>
        <section class="ed-card"><div class="ed-card-head"><h2>Pertanyaan <span class="count">${d.questions.length}</span></h2></div>${d.questions.map((q, i) => questionCard(q, i, d.questions.length)).join('')}<button type="button" class="btn btn-subtle" data-act="add-question">+ Pilihan ganda</button> <button type="button" class="btn btn-subtle" data-act="add-question" data-type="essay">+ Essay</button></section>`;
    } else if (kind === 'sop') {
      body = `<section class="ed-card"><h2>Informasi SOP</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori', 'category', {max: 60, list: 'cat-list', ph: 'mis. Pengajuan, Dokumen, Komplain, Refund'})}</div>${fText('Ringkasan (opsional)', 'description', {rows: 2, max: 500})}
        <label class="check"><input type="checkbox" data-f="active" data-bool ${d.active !== false ? 'checked' : ''} /> SOP ini masih berlaku <small class="hint">(hapus centang untuk menandai <b>Tidak berlaku</b>; SOP tetap bisa dibuka sebagai arsip dengan peringatan)</small></label>${audienceField(kind, d)}${catList()}</section>
        <section class="ed-card"><div class="ed-card-head"><h2>Slide & dokumen SOP</h2><small>Dokumen pertama tampil besar di halaman SOP; sisanya jadi kartu di bawahnya.</small></div>${docsEditor('docs', {title: 'Tempel link Google Slides / Docs / Drive / PDF'})}</section>
        <section class="ed-card"><div class="ed-card-head"><h2>Tulisan SOP <small class="hint">opsional</small></h2><small>Tulis langkah-langkah langsung di LMS bila tidak memakai slide, atau sebagai ringkasan di bawah slide.</small></div>${sectionsEditor('sections')}</section>`;
    } else {
      body = `<section class="ed-card"><h2>Informasi artikel</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori / topik', 'category', {max: 60, list: 'cat-list'})}${fInput('Estimasi baca (menit)', 'minutes', {num: true})}${fSelect('Warna kartu', 'color', COLORS)}${fSelect('Ilustrasi', 'art', ARTS)}</div>${fText('Ringkasan pembuka', 'description', {rows: 2, max: 500})}
        <label class="check"><input type="checkbox" data-f="featured" data-bool ${d.featured ? 'checked' : ''} /> Jadikan Editor's Pick di Knowledge Center</label>${audienceField(kind, d)}${catList()}</section>
        <section class="ed-card"><div class="ed-card-head"><h2>Isi artikel</h2></div>${sectionsEditor('sections')}${docsEditor('docs')}<div class="ed-item-foot"><button type="button" class="btn btn-outline" data-act="preview-article">Pratinjau artikel</button></div></section>`;
    }
    main.innerHTML = `<div class="editor content-fade">
      <div class="admin-head"><div><a class="text-link back-link" href="#content/${kind}">← Semua ${K.label.toLowerCase()}</a><h1>${esc(d.title || K.label + ' tanpa judul')}</h1><p class="subtitle">${badge(STATUS[status])}${editor.publishedAt ? ` <span class="when">Terakhir publish ${fmtDate(editor.publishedAt)}</span>` : ''}</p></div></div>
      ${editor.error ? `<div class="ed-error" role="alert">${esc(editor.error)}${editor.conflict ? ' <button class="btn btn-outline" data-act="reload-editor">Muat versi terbaru</button>' : ''}</div>` : ''}
      <form class="admin-form" onsubmit="return false">${body}</form>
      <div class="ed-bar"><span id="ed-state"></span><div class="ed-bar-actions">
        ${status !== 'draft' ? `<button class="btn btn-outline" data-act="unpublish">Sembunyikan dari peserta</button>` : ''}
        <button class="btn btn-outline" data-act="save" id="btn-save">Simpan draft</button>
        <button class="btn btn-orange" data-act="publish" id="btn-publish">${status === 'draft' ? 'Publish' : 'Publish perubahan'}</button></div></div>
    </div>`;
    mountRtes();
    updateBar();
  }
  function updateBar() {
    if (!editor) return;
    const st = $('#ed-state'); if (!st) return;
    st.textContent = editor.dirty ? '● Ada perubahan yang belum disimpan' : editor.status === 'changed' ? 'Draft tersimpan · belum di-publish' : editor.status === 'draft' ? 'Draft tersimpan · belum tayang' : 'Tersimpan · versi ini sedang tayang';
    st.className = editor.dirty ? 'dirty' : '';
    $('#btn-save').disabled = !editor.dirty;
    $('#btn-publish').disabled = !editor.dirty && editor.status === 'published';
  }
  function markDirty() {editor.dirty = true; updateBar();}
  function onField(el) {
    if (!editor || !el.dataset.f) return;
    const p = el.dataset.f;
    let v = el.value;
    if (el.dataset.bool !== undefined) v = el.checked;
    else if (el.dataset.num !== undefined) v = el.value === '' ? null : Number(el.value);
    if (el.dataset.video !== undefined) {
      const id = ytId(v), hint = el.parentElement.querySelector('[data-video-hint]');
      hint.textContent = id === null ? 'Link YouTube tidak dikenali.' : id ? 'Video terdeteksi ✓' : 'Opsional. Tampil di atas gambar & isi. Untuk video di tengah teks, pakai tombol ▶ di toolbar Isi.';
      hint.className = id === null ? 'hint-bad' : id ? 'hint-ok' : '';
      setPath(editor.draft, p, v.trim() ? {url: v.trim()} : undefined);
    } else setPath(editor.draft, p, v);
    markDirty();
    if (el.dataset.rerender !== undefined) {
      const m = p.match(/^questions\.(\d+)\.type$/);
      if (m) {const q = editor.draft.questions[m[1]]; if (v === 'essay') {q.points = q.points > 1 ? q.points : 5; if (!q.rubric && q.why) q.rubric = q.why;} else {q.points = q.points && q.points !== 5 ? q.points : 1; if (!q.options?.length) q.options = ['', '', '', '']; q.answer ??= null;} openKeys.add('Q:' + m[1]);}
      renderEditor();
    }
  }
  main.addEventListener('input', e => {if (e.target.dataset.f && e.target.type !== 'radio' && e.target.type !== 'checkbox') onField(e.target);});
  main.addEventListener('change', e => {if (e.target.dataset.f && (e.target.type === 'radio' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) onField(e.target);});
  main.addEventListener('toggle', e => {const k = e.target.dataset?.key; if (k) e.target.open ? openKeys.add(k) : openKeys.delete(k);}, true);

  function applyItem(item) {
    editor = {kind: editor.kind, id: editor.id, draft: item.draft, revision: item.revision, status: item.status, publishedAt: item.publishedAt, dirty: false, error: ''};
  }
  async function save() {
    try {
      const {item} = await api.post(`/api/admin/content/${editor.kind}/${editor.id}`, {draft: editor.draft, baseRevision: editor.revision});
      applyItem(item); renderEditor(); toast('Draft tersimpan.'); return true;
    } catch (e) {editor.error = e.message; editor.conflict = e.status === 409; renderEditor(); window.scrollTo({top: 0, behavior: 'smooth'}); return false;}
  }
  async function publish() {
    if (editor.dirty && !await save()) return;
    try {
      const {item} = await api.post(`/api/admin/content/${editor.kind}/${editor.id}/publish`, {});
      applyItem(item); renderEditor(); toast('Tayang! Peserta sudah bisa melihat versi terbaru.');
    } catch (e) {editor.error = e.message; editor.conflict = false; renderEditor(); window.scrollTo({top: 0, behavior: 'smooth'});}
  }
  function previewDocs(list) {
    const rows = (list || []).filter(x => x.url || x.ref).map(x => {
      if (x.ref) {const [k, id] = x.ref.split(':'), it = items.find(i => i.kind === k && i.id === id); return it ? `<li class="doc-card"><span class="doc-icon" style="--doc:#d16527">${k === 'article' ? 'A' : 'C'}</span><div class="doc-main"><span class="doc-title">${esc(x.title || it.title)}</span><small>${k === 'article' ? 'Artikel Knowledge Center' : 'Course'}</small></div></li>` : '';}
      const k = docKind(x.url) || 'link';
      return `<li class="doc-card"><span class="doc-icon" style="--doc:#4c6b5a">↗</span><div class="doc-main"><a class="doc-title" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title || DOC_LABEL[k])}</a><small>${DOC_LABEL[k]}</small></div></li>`;
    }).join('');
    return rows ? `<section class="docs-block"><h3>Dokumen terkait</h3><ul class="doc-list">${rows}</ul></section>` : '';
  }
  function previewSections(sections) {
    return (sections || []).map(s => {
      const paras = `<div class="rich">${sectionHtml(s)}</div>`; // HTML dari editor (sudah disaring server saat disimpan)
      const v = s.video ? ytId(s.video.url ?? s.video.youtubeId) : '';
      return `<section class="content-section">${s.heading ? `<h4>${esc(s.heading)}</h4>` : ''}${v ? `<div class="content-video"><iframe src="https://www.youtube-nocookie.com/embed/${v}" title="Video" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : ''}${s.image?.url ? `<figure class="content-media"><img src="${esc(s.image.url)}" alt="${esc(s.image.alt)}" />${s.image.caption ? `<figcaption>${esc(s.image.caption)}</figcaption>` : ''}</figure>` : ''}${paras}</section>`;
    }).join('');
  }
  async function uploadImage(path, button) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.onchange = async () => {
      const file = input.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) return toast('Ukuran gambar maksimal 5 MB.', true);
      button.disabled = true; button.textContent = 'Mengunggah…';
      try {
        const publicUrl = await uploadFile(file);
        setPath(editor.draft, path + '.image', {url: publicUrl, alt: '', caption: ''});
        markDirty(); renderEditor(); toast('Gambar terunggah. Isi teks alternatif, lalu simpan.');
      } catch (e) {toast(e.message || 'Gambar gagal diunggah.', true); button.disabled = false; button.textContent = 'Unggah gambar';}
    };
    input.click();
  }

  // ---------- peserta ----------
  let userQuery = '';
  // ---------- tim ----------
  let teamList = null;
  async function ensureTeams(force = false) {if (!teamList || force) teamList = (await api.get('/api/admin/teams')).teams; return teamList;}
  const teamName = id => teamList?.find(t => t.id === id)?.name || id;
  const teamChips = (ids, empty = 'Semua tim') => ids?.length ? ids.map(id => `<span class="team-chip">${esc(teamName(id))}</span>`).join('') : empty ? `<span class="team-chip all">${empty}</span>` : '';
  function teamChecks(name, selected = [], {empty = 'Belum ada tim. Buat dulu di menu <a href="#teams">Tim</a>.', attr = ''} = {}) {
    if (!teamList?.length) return `<p class="hint">${empty}</p>`;
    return `<div class="team-checks">${teamList.map(t => `<label class="team-check"><input type="checkbox" name="${name}" value="${esc(t.id)}" ${attr} ${selected.includes(t.id) ? 'checked' : ''} /> ${esc(t.name)}</label>`).join('')}</div>`;
  }
  const teamOptions = (sel, all = 'Semua tim', withNone = false) => `<option value="">${all}</option>${withNone ? `<option value="__none" ${sel === '__none' ? 'selected' : ''}>Belum punya tim</option>` : ''}${(teamList || []).map(t => `<option value="${esc(t.id)}" ${sel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}`;
  async function renderTeams() {
    const list = await ensureTeams(true);
    main.innerHTML = `<div class="content-fade">${heading('Kelompok peserta', 'Tim', 'Peserta hanya melihat materi untuk "Semua tim" dan materi untuk timnya sendiri. Satu peserta boleh masuk lebih dari satu tim. Admin selalu melihat semua materi.')}
      <form id="team-form" class="team-add"><input name="name" maxlength="60" required placeholder="Nama tim baru, mis. Customer Experience" aria-label="Nama tim baru" /><button class="btn btn-orange" type="submit">+ Tambah tim</button></form>
      ${list.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Tim</th><th>Anggota</th><th>Materi khusus tim</th><th class="col-actions">Aksi</th></tr></thead><tbody>${list.map(t => `<tr><td><span class="row-title">${esc(t.name)}</span></td><td><a href="#users" data-act="team-members" data-id="${esc(t.id)}">${t.members} peserta</a></td><td>${t.content} materi</td><td class="col-actions"><button class="btn btn-outline" data-act="team-rename" data-id="${esc(t.id)}">Ubah nama</button><button class="btn btn-outline btn-danger-text" data-act="team-delete" data-id="${esc(t.id)}">Hapus</button></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="raport-empty">Belum ada tim. Tambahkan tim pertama, lalu atur tim peserta di menu Peserta dan audiens materi di editor course/artikel/quiz.</div>'}
      ${users.length ? (n => n ? `<p class="hint">${n} peserta belum punya tim dan hanya melihat materi "Semua tim". <a href="#users" data-act="team-members" data-id="__none">Lihat daftarnya</a>.</p>` : '')(users.filter(u => u.role !== 'admin' && !u.teams.length).length) : ''}</div>`;
    if (!users.length) {try {users = (await api.get('/api/admin/users')).users; const n = users.filter(u => u.role !== 'admin' && !u.teams.length).length; if (n && location.hash === '#teams') main.querySelector('.content-fade').insertAdjacentHTML('beforeend', `<p class="hint">${n} peserta belum punya tim dan hanya melihat materi "Semua tim". <a href="#users" data-act="team-members" data-id="__none">Lihat daftarnya</a>.</p>`);} catch {}}
  }
  main.addEventListener('submit', async e => {
    if (e.target.id !== 'team-form') return; e.preventDefault();
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true;
    try {teamList = (await api.post('/api/admin/teams', {name: e.target.elements.name.value})).teams; toast('Tim ditambahkan.'); await renderTeams();} catch (err) {toast(err.message, true); btn.disabled = false;}
  });
  function userTeamsDialog(id) {
    const u = users.find(x => x.id === id); if (!u) return;
    showModal(`Tim · ${esc(u.name)}`, `<form id="user-teams-form" class="admin-form"><p class="hint">Peserta melihat materi "Semua tim" dan materi untuk tim yang dicentang.</p>${teamChecks('team', u.teams)}
      <div class="confirm-actions"><button type="button" class="btn btn-outline" data-act="close-modal">Batal</button>${teamList?.length ? '<button class="btn btn-orange" type="submit">Simpan</button>' : ''}</div></form>`);
    $('#user-teams-form').addEventListener('submit', async e => {
      e.preventDefault(); const teams = [...e.target.querySelectorAll('[name=team]:checked')].map(x => x.value);
      try {users = (await api.post(`/api/admin/users/${id}/teams`, {teams})).users; teamList = null; await ensureTeams(); closeModal(); renderUserRows(); toast('Tim peserta disimpan.');} catch (err) {toast(err.message, true);}
    });
  }
  let userTeam = '';
  async function renderUsers() {
    users = (await api.get('/api/admin/users')).users;
    main.innerHTML = `<div class="content-fade">${heading('Kelola akses', 'Peserta', 'Undang karyawan maupun freelancer memakai email apa pun. Peserta menerima email untuk membuat password.', '<button class="btn btn-orange" data-act="invite">+ Undang peserta</button>')}
      <div class="filters"><label class="filter-search"><input id="user-search" placeholder="Cari nama atau email…" value="${esc(userQuery)}" aria-label="Cari peserta" /></label><select id="user-team" aria-label="Filter tim">${teamOptions(userTeam, 'Semua tim', true)}</select>
      <span class="results-count" id="user-count"></span></div>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>Peserta</th><th>Tim</th><th>Role</th><th>Status</th><th>Progres</th><th>Terakhir aktif</th><th class="col-actions">Aksi</th></tr></thead><tbody id="user-rows"></tbody></table></div></div>`;
    renderUserRows();
  }
  function renderUserRows() {
    const q = userQuery.toLowerCase(), list = users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(q) && (!userTeam || (userTeam === '__none' ? !u.teams.length && u.role !== 'admin' : u.teams.includes(userTeam))));
    $('#user-count').textContent = `${users.length} akun · ${users.filter(u => u.role === 'admin').length} admin`;
    $('#user-rows').innerHTML = list.map(u => {
      const self = u.id === me.id;
      return `<tr><td><button class="row-title linkish" data-act="user-detail" data-id="${u.id}">${esc(u.name)}${self ? ' <small class="you">(kamu)</small>' : ''}</button><small>${esc(u.email)}</small></td>
        <td>${u.role === 'admin' ? '<span class="team-chip all">Semua materi</span>' : teamChips(u.teams, 'Belum ada tim')}<button class="mini-link" data-act="user-teams" data-id="${u.id}">Atur tim</button></td>
        <td>${u.role === 'admin' ? badge(['Admin', 'st-admin']) : 'Peserta'}</td><td>${badge(USTATUS[u.status])}${u.onboarding && u.onboarding !== 'completed' ? `<a class="onb-mini" href="#onboarding">Onboarding · ${OSTATUS[u.onboarding][0]}</a>` : ''}</td>
        <td>${u.lessonsCompleted} modul · ${u.quizzesPassed} quiz lulus</td><td><span class="when">${fmtDate(u.lastActivity || u.lastSignInAt)}</span></td>
        <td class="col-actions"><div class="row-actions"><a class="btn btn-outline" href="#raport/${u.id}">Raport</a>${self ? '' : `<details class="more-menu"><summary class="btn btn-outline" aria-label="Aksi lain untuk ${esc(u.name)}">⋯</summary><div class="more-list" role="menu">
          ${u.status === 'invited' ? `<button role="menuitem" data-act="resend" data-id="${u.id}">Kirim ulang undangan</button>` : ''}
          <button role="menuitem" data-act="set-role" data-id="${u.id}" data-role="${u.role === 'admin' ? 'learner' : 'admin'}">${u.role === 'admin' ? 'Jadikan peserta' : 'Jadikan admin'}</button>
          <button role="menuitem" class="${u.status === 'disabled' ? '' : 'danger'}" data-act="set-status" data-id="${u.id}" data-status="${u.status === 'disabled' ? 'active' : 'disabled'}">${u.status === 'disabled' ? 'Aktifkan akun' : 'Nonaktifkan akun'}</button></div></details>`}</div></td></tr>`;
    }).join('') || '<tr><td colspan="7" class="empty-row">Tidak ada peserta yang cocok.</td></tr>';
  }
  // Menu aksi memakai posisi fixed agar tidak terpotong oleh tabel yang bisa digeser.
  document.addEventListener('toggle', e => {
    const d = e.target; if (!d.classList?.contains('more-menu') || !d.open) return;
    const r = d.querySelector('summary').getBoundingClientRect(), m = d.querySelector('.more-list');
    m.style.position = 'fixed'; m.style.right = Math.max(8, innerWidth - r.right) + 'px';
    const h = m.offsetHeight; m.style.top = (r.bottom + 6 + h > innerHeight ? Math.max(8, r.top - 6 - h) : r.bottom + 6) + 'px';
  }, true);
  window.addEventListener('scroll', () => document.querySelectorAll('details.more-menu[open]').forEach(d => {d.open = false;}), true);
  document.addEventListener('click', e => {document.querySelectorAll('details.more-menu[open]').forEach(d => {if (!d.contains(e.target) || e.target.closest('.more-list button')) d.open = false;});});
  main.addEventListener('input', e => {if (e.target.id === 'user-search') {userQuery = e.target.value; renderUserRows();}});
  main.addEventListener('change', e => {if (e.target.id === 'user-team') {userTeam = e.target.value; renderUserRows();} else if (e.target.id === 'report-team') {reportTeam = e.target.value; renderReport().catch(err => toast(err.message, true));} else if (e.target.id === 'grading-team') {gradingTeam = e.target.value; renderGrading(gradingTab);}});
  main.addEventListener('change', e => {
    if (!editor) return;
    if (e.target.dataset.audMode !== undefined) {
      if (e.target.value === 'all') {editor.draft.teams = []; editor.audSome = false;} else editor.audSome = true;
      markDirty(); renderEditor();
    } else if (e.target.dataset.audTeam !== undefined) {
      editor.draft.teams = [...main.querySelectorAll('[data-aud-team]:checked')].map(x => x.value); editor.audSome = true; markDirty();
    }
  });
  function inviteDialog() {
    showModal('Undang peserta', `<form id="invite-form" class="admin-form">
      <label>Nama lengkap<input name="name" required minlength="2" maxlength="80" autocomplete="off" /></label>
      <label>Email<input name="email" type="email" required maxlength="254" autocomplete="off" placeholder="nama@contoh.com" /><small>Boleh email pribadi untuk freelancer atau staf kontrak.</small></label>
      <label>Role<select name="role" id="invite-role"><option value="learner">Peserta</option><option value="admin">Admin (bisa kelola materi & peserta)</option></select></label>
      <fieldset class="team-field"><legend>Tim <small>(opsional, boleh lebih dari satu)</small></legend>${teamChecks('team', userTeam && userTeam !== '__none' ? [userTeam] : [])}</fieldset>
      <label class="check-row" id="invite-onb"><input type="checkbox" name="onboarding" checked /><span><b>Wajib onboarding</b><small>Untuk karyawan baru: materi lain terkunci sampai course onboarding selesai.</small></span></label>
      <div class="form-error" role="alert"></div>
      <div class="confirm-actions"><button type="button" class="btn btn-outline" data-act="close-modal">Batal</button><button class="btn btn-orange" type="submit">Kirim undangan</button></div></form>`);
    $('#invite-role').addEventListener('change', e => {$('#invite-onb').hidden = e.target.value === 'admin';});
    $('#invite-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), btn = e.target.querySelector('[type=submit]'); f.onboarding = f.role !== 'admin' && f.onboarding === 'on'; f.teams = new FormData(e.target).getAll('team'); delete f.team; btn.disabled = true; btn.textContent = 'Mengirim…';
      try {const r = await api.post('/api/admin/users/invite', f); users = r.users; closeModal(); renderUserRows(); toast(`Undangan terkirim ke ${f.email}.`);}
      catch (err) {e.target.querySelector('.form-error').textContent = err.message; btn.disabled = false; btn.textContent = 'Kirim undangan';}
    });
  }
  async function userDetail(id) {
    const d = await api.get(`/api/admin/users/${id}`);
    showModal(d.user.name, `<p class="subtitle">${esc(d.user.email)} · ${d.articlesRead} artikel dibaca</p>
      <h3 class="ed-subhead">Progres course</h3><div class="progress-list">${d.courses.map(c => {const p = c.total ? Math.round(c.done / c.total * 100) : 0; return `<div class="progress-row"><span>${esc(c.title)}</span><div class="progress-track"><span style="width:${p}%"></span></div><b>${c.done}/${c.total}</b></div>`;}).join('') || '<p>Belum ada course tayang.</p>'}</div>
      <h3 class="ed-subhead">Quiz</h3><table class="admin-table compact"><thead><tr><th>Quiz</th><th>Skor terbaik</th><th>Percobaan</th><th>Terakhir</th></tr></thead><tbody>${d.quizzes.map(q => `<tr><td>${esc(q.title)}</td><td>${q.best === null ? '—' : `<b class="${q.best >= 80 ? 'pass' : 'fail'}">${q.best}</b>`}</td><td>${q.attempts}</td><td>${fmtDate(q.last)}</td></tr>`).join('')}</tbody></table>`, true);
  }

  // ---------- raport peserta ----------
  let raportState = {preset: 'all', custom: {}}, raportUser = null, raportSeq = 0, raportBound = false;
  async function renderAdminRaport(id) {
    const R = window.HubRaport;
    if (!raportBound) {raportBound = true; R.bindTooltips(main);}
    if (raportUser !== id) {raportUser = id;}
    main.innerHTML = `<div class="content-fade raport-page"><a class="back-link" href="#users">← Semua peserta</a>${R.controls(raportState)}<div id="raport-body"><div class="raport-empty">Menyiapkan raport…</div></div></div>`;
    $('#breadcrumb').textContent = 'Admin · Raport peserta';
    const seq = ++raportSeq, r = R.range(raportState.preset, raportState.custom);
    if (raportState.preset === 'custom' && (!r.from || !r.to)) {$('#raport-body').innerHTML = '<div class="raport-empty">Pilih tanggal awal dan akhir.</div>'; return;}
    try {const data = await api.get(`/api/admin/users/${id}/raport${R.query(r)}`); if (seq === raportSeq) $('#raport-body').innerHTML = R.html(data);}
    catch (e) {if (seq === raportSeq) $('#raport-body').innerHTML = `<div class="raport-empty">${esc(e.message)}</div>`;}
  }
  main.addEventListener('change', e => {
    const k = e.target.dataset?.raport; if (!k || !location.hash.startsWith('#raport/')) return;
    if (k === 'preset') raportState.preset = e.target.value; else raportState.custom[k] = e.target.value;
    renderAdminRaport(location.hash.split('/')[1]);
  });
  main.addEventListener('click', e => {if (e.target.closest('[data-raport="print"]')) window.print();});

  // ---------- nilai quiz ----------
  let scores = null, scoresKey = null;
  const sf = {preset: 'all', custom: {}, category: '', team: '', status: 'not-disabled', q: '', admins: false, sort: {key: 'name', dir: 1}, qsort: {key: 'best', dir: -1}};
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>';
  async function loadScores(force = false) {
    const R = window.HubRaport, r = R.range(sf.preset, sf.custom);
    if (sf.preset === 'custom' && (!r.from || !r.to)) return null;
    const key = R.query(r);
    if (force || key !== scoresKey || !scores) {scores = await api.get('/api/admin/scores' + key); scoresKey = key;}
    return scores;
  }
  const visibleUsers = d => d.users.filter(u => (sf.admins || u.role !== 'admin')
    && (sf.status === 'all' || (sf.status === 'disabled' ? u.status === 'disabled' : u.status !== 'disabled'))
    && (!sf.team || (sf.team === '__none' ? !(u.teams || []).length : (u.teams || []).includes(sf.team)))
    && `${u.name} ${u.email}`.toLowerCase().includes(sf.q.trim().toLowerCase()));
  const visibleQuizzes = d => d.quizzes.filter(q => (!sf.category || q.category === sf.category) && (!sf.team || !(q.teams || []).length || (sf.team !== '__none' && q.teams.includes(sf.team))));
  const cellOf = (d, uid, qid) => d.cells[uid]?.[qid] || null;
  const userStats = (d, u, qs) => {const v = qs.map(q => cellOf(d, u.id, q.id)).filter(c => c && c.best !== null); return {done: v.length, passed: v.filter(c => c.best >= 80).length, avg: v.length ? Math.round(v.reduce((s, c) => s + c.best, 0) / v.length) : null};};
  const quizStats = (d, q, us) => {const all = us.map(u => cellOf(d, u.id, q.id)).filter(Boolean), v = all.filter(c => c.best !== null); return {done: all.length, pending: all.filter(c => c.pending).length, passed: v.filter(c => c.best >= 80).length, avg: v.length ? Math.round(v.reduce((s, c) => s + c.best, 0) / v.length) : null, attempts: all.reduce((s, c) => s + c.attempts, 0)};};
  const cmp = (a, b, dir) => (a === null || a === undefined) ? 1 : (b === null || b === undefined) ? -1 : (typeof a === 'string' ? a.localeCompare(b, 'id') : a - b) * dir;
  const sortHead = (label, key, state, cls = '') => {const on = state.key === key; return `<th class="${cls}" aria-sort="${on ? (state.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sort-btn" data-act="score-sort" data-key="${esc(key)}">${label}<span aria-hidden="true">${on ? (state.dir > 0 ? '▲' : '▼') : '↕'}</span></button></th>`;};
  function scoreFilters(withCategory) {
    const R = window.HubRaport, cats = [...new Set((scores?.quizzes || []).map(q => q.category).filter(Boolean))];
    return `<div class="score-filters">
      <label>Periode<select data-sf="preset">${R.PRESETS.map(([v, l]) => `<option value="${v}" ${sf.preset === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <span class="raport-custom" ${sf.preset === 'custom' ? '' : 'hidden'}><label>Dari<input type="date" data-sf="from" value="${esc(sf.custom.from || '')}" /></label><label>Sampai<input type="date" data-sf="to" value="${esc(sf.custom.to || '')}" /></label></span>
      ${withCategory ? `<label>Kategori quiz<select data-sf="category"><option value="">Semua kategori</option>${cats.map(c => `<option value="${esc(c)}" ${sf.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>` : ''}
      <label>Tim<select data-sf="team">${teamOptions(sf.team, 'Semua tim', true)}</select></label>
      <label>Status akun<select data-sf="status"><option value="not-disabled" ${sf.status === 'not-disabled' ? 'selected' : ''}>Aktif & menunggu aktivasi</option><option value="all" ${sf.status === 'all' ? 'selected' : ''}>Semua</option><option value="disabled" ${sf.status === 'disabled' ? 'selected' : ''}>Nonaktif saja</option></select></label>
      <label class="grow">Cari peserta<input type="search" data-sf="q" value="${esc(sf.q)}" placeholder="Nama atau email…" /></label>
      <label class="inline-check"><input type="checkbox" data-sf="admins" ${sf.admins ? 'checked' : ''} /> Tampilkan admin</label>
    </div>`;
  }
  async function renderScores() {
    main.innerHTML = `<div class="content-fade">${heading('Pantau hasil quiz', 'Nilai Quiz', 'Skor terbaik setiap peserta di setiap quiz. Klik judul quiz untuk detail, klik skor untuk membuka raport peserta.', '<button class="btn btn-outline" data-act="scores-csv">Unduh CSV</button>')}<div id="score-filters"></div><div id="score-body"><div class="raport-empty">Memuat nilai…</div></div></div>`;
    const d = await loadScores(true);
    $('#score-filters').innerHTML = scoreFilters(true);
    renderScoreBody();
    if (!d) $('#score-body').innerHTML = '<div class="raport-empty">Pilih tanggal awal dan akhir.</div>';
  }
  function matrixUsers(d, qs) {
    const us = visibleUsers(d), k = sf.sort.key;
    const val = u => k === 'name' ? u.name : k === 'passed' ? userStats(d, u, qs).passed : k === 'avg' ? userStats(d, u, qs).avg : cellOf(d, u.id, k.slice(2))?.best ?? null;
    return us.sort((a, b) => cmp(val(a), val(b), sf.sort.dir) || a.name.localeCompare(b.name, 'id'));
  }
  function renderScoreBody() {
    const body = $('#score-body'); if (!body || !scores) return;
    if (location.hash.startsWith('#scores/')) return renderQuizScoreBody();
    const d = scores, qs = visibleQuizzes(d), us = matrixUsers(d, qs);
    if (!qs.length) {body.innerHTML = '<div class="raport-empty">Belum ada quiz yang tayang di kategori ini.</div>'; return;}
    const cellHtml = (u, q) => {
      const c = cellOf(d, u.id, q.id);
      if (!c) return '<td class="sc-cell"><span class="sc sc-none" title="Belum mengerjakan">—</span></td>';
      if (c.best === null) return `<td class="sc-cell"><a class="sc sc-wait" href="#grading" title="${esc(u.name)} · ${esc(q.title)}: essay menunggu penilaian">⏳</a></td>`;
      const pass = c.best >= 80, tip = `${u.name} · ${q.title}: terbaik ${c.best}, terakhir ${c.last}, ${c.attempts} percobaan, ${fmtDate(c.lastAt)}${pass ? ' · Lulus' : ' · Belum lulus'}${c.pending ? ` · ${c.pending} menunggu penilaian` : ''}`;
      return `<td class="sc-cell"><a class="sc ${pass ? 'sc-pass' : 'sc-fail'}" href="#raport/${u.id}" title="${esc(tip)}" aria-label="${esc(tip)}">${c.best}${pass ? CHECK : ''}</a>${c.attempts > 1 ? `<small class="sc-tries">${c.attempts}×</small>` : ''}${c.pending ? '<small class="sc-tries" title="Menunggu penilaian">⏳</small>' : ''}</td>`;
    };
    body.innerHTML = `<p class="score-meta">${us.length} peserta · ${qs.length} quiz · skor terbaik, lulus ≥ 80 (✓) · angka kecil = jumlah percobaan · ⏳ = essay menunggu penilaian</p>
      ${us.length ? `<div class="score-wrap"><table class="score-matrix"><thead><tr>${sortHead('Peserta', 'name', sf.sort, 'sm-user')}
        ${qs.map(q => {const on = sf.sort.key === 'q:' + q.id; return `<th class="sm-q" aria-sort="${on ? (sf.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"><a href="#scores/${esc(q.id)}" title="Detail: ${esc(q.title)}">${esc(q.title)}</a><button type="button" class="sort-btn mini-sort" data-act="score-sort" data-key="q:${esc(q.id)}" aria-label="Urutkan menurut ${esc(q.title)}">${on ? (sf.sort.dir > 0 ? '▲' : '▼') : '↕'}</button></th>`;}).join('')}
        ${sortHead('Lulus', 'passed', sf.sort, 'sm-num')}${sortHead('Rata-rata', 'avg', sf.sort, 'sm-num')}</tr></thead>
        <tbody>${us.map(u => {const st = userStats(d, u, qs); return `<tr><th scope="row" class="sm-user"><a href="#raport/${u.id}">${esc(u.name)}</a><small>${esc(u.email)}${u.role === 'admin' ? ' · Admin' : ''}${u.status === 'disabled' ? ' · Nonaktif' : u.status === 'invited' ? ' · Belum aktivasi' : ''}</small></th>${qs.map(q => cellHtml(u, q)).join('')}<td class="sm-num"><b>${st.passed}</b>/${qs.length}</td><td class="sm-num">${st.avg ?? '—'}</td></tr>`;}).join('')}</tbody>
        <tfoot><tr><th scope="row" class="sm-user">Ringkasan quiz</th>${qs.map(q => {const s = quizStats(d, q, us); return `<td class="sm-foot"><b>${s.done}</b>/${us.length} mengerjakan<br>${s.passed} lulus · rata-rata ${s.avg ?? '—'}</td>`;}).join('')}<td></td><td></td></tr></tfoot></table></div>` : '<div class="raport-empty">Tidak ada peserta yang cocok dengan filter.</div>'}`;
  }
  async function renderQuizScores(qid) {
    main.innerHTML = `<div class="content-fade"><a class="back-link" href="#scores">← Nilai Quiz</a><div id="qs-head"></div><div id="score-filters"></div><div id="score-body"><div class="raport-empty">Memuat nilai…</div></div></div>`;
    const d = await loadScores(true);
    $('#score-filters').innerHTML = scoreFilters(false);
    if (!d) {$('#score-body').innerHTML = '<div class="raport-empty">Pilih tanggal awal dan akhir.</div>'; return;}
    renderQuizScoreBody();
  }
  function quizRows(d, q) {
    const us = visibleUsers(d), k = sf.qsort.key;
    const val = u => {const c = cellOf(d, u.id, q.id); return k === 'name' ? u.name : !c ? null : k === 'status' ? (c.best >= 80 ? 1 : 0) : k === 'lastAt' ? new Date(c.lastAt).getTime() : c[k];};
    return us.sort((a, b) => cmp(val(a), val(b), sf.qsort.dir) || a.name.localeCompare(b.name, 'id'));
  }
  function renderQuizScoreBody() {
    const d = scores, qid = decodeURIComponent(location.hash.split('/')[1] || ''), q = d.quizzes.find(x => x.id === qid);
    if (!q) {$('#score-body').innerHTML = '<div class="raport-empty">Quiz tidak ditemukan atau sudah tidak tayang.</div>'; $('#qs-head').innerHTML = ''; return;}
    const us = visibleUsers(d), st = quizStats(d, q, us), rows = quizRows(d, q);
    $('#breadcrumb').textContent = 'Admin · Nilai Quiz';
    $('#qs-head').innerHTML = heading(esc(q.category || 'Quiz'), esc(q.title), `${q.questions} pertanyaan · lulus ≥ 80`, '<button class="btn btn-outline" data-act="scores-csv">Unduh CSV</button>');
    const chip = c => !c ? '<span class="st st-draft">Belum mengerjakan</span>' : c.best === null ? '<span class="st st-changed">Menunggu penilaian</span>' : c.best >= 80 ? `<span class="st st-live sc-status">${CHECK}Lulus</span>` : '<span class="st st-changed">Belum lulus</span>';
    $('#score-body').innerHTML = `<section class="stats-grid score-stats">${[['Sudah mengerjakan', `${st.done}<em>/${us.length}</em>`], ['Lulus', st.passed], ['Rata-rata skor terbaik', st.avg ?? '—'], ['Total percobaan', st.attempts + (st.pending ? ` <em>· ${st.pending} menunggu</em>` : '')]].map(([l, v]) => `<div class="stat-card"><div><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div></div>`).join('')}</section>
      ${rows.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${sortHead('Peserta', 'name', sf.qsort)}${sortHead('Skor terbaik', 'best', sf.qsort)}${sortHead('Skor terakhir', 'last', sf.qsort)}${sortHead('Percobaan', 'attempts', sf.qsort)}${sortHead('Status', 'status', sf.qsort)}${sortHead('Terakhir dikerjakan', 'lastAt', sf.qsort)}<th class="col-actions">Raport</th></tr></thead><tbody>
      ${rows.map(u => {const c = cellOf(d, u.id, q.id); return `<tr><td><span class="row-title">${esc(u.name)}</span><small>${esc(u.email)}${u.role === 'admin' ? ' · Admin' : ''}${u.status === 'disabled' ? ' · Nonaktif' : ''}</small></td><td><b>${c?.best ?? '—'}</b></td><td>${c?.last ?? '—'}</td><td>${c ? c.attempts : 0}</td><td>${chip(c)}</td><td><span class="when">${c ? fmtDate(c.lastAt) : '—'}</span></td><td class="col-actions"><a class="btn btn-outline" href="#raport/${u.id}">Raport</a></td></tr>`;}).join('')}</tbody></table></div>` : '<div class="raport-empty">Tidak ada peserta yang cocok dengan filter.</div>'}`;
  }
  async function onScoreFilter(el) {
    const k = el.dataset.sf;
    if (k === 'preset') {sf.preset = el.value; $('#score-filters .raport-custom').hidden = sf.preset !== 'custom';}
    else if (k === 'from' || k === 'to') sf.custom[k] = el.value;
    else if (k === 'admins') sf.admins = el.checked;
    else sf[k] = el.value;
    if (['preset', 'from', 'to'].includes(k)) {
      $('#score-body').innerHTML = '<div class="raport-empty">Memuat nilai…</div>';
      try {const d = await loadScores(); if (!d) {$('#score-body').innerHTML = '<div class="raport-empty">Pilih tanggal awal dan akhir.</div>'; return;}}
      catch (e) {$('#score-body').innerHTML = `<div class="raport-empty">${esc(e.message)}</div>`; return;}
    }
    renderScoreBody();
  }
  main.addEventListener('input', e => {if (e.target.dataset?.sf === 'q') onScoreFilter(e.target);});
  main.addEventListener('change', e => {const k = e.target.dataset?.sf; if (k && k !== 'q') onScoreFilter(e.target);});
  function saveCsv(rows, name) {
    const cell = v => {const s = String(v ?? ''); return /[",\n;]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""')}"` : s;};
    const blob = new Blob(['\ufeff' + rows.map(r => r.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function scoresCsv() {
    const d = scores; if (!d) return;
    const day = new Date().toISOString().slice(0, 10), status = u => USTATUS[u.status][0];
    if (location.hash.startsWith('#scores/')) {
      const q = d.quizzes.find(x => x.id === decodeURIComponent(location.hash.split('/')[1])); if (!q) return;
      saveCsv([['Nama', 'Email', 'Tim', 'Status akun', 'Skor terbaik', 'Skor terakhir', 'Percobaan', 'Status quiz', 'Terakhir dikerjakan'],
        ...quizRows(d, q).map(u => {const c = cellOf(d, u.id, q.id); return [u.name, u.email, (u.teams || []).map(teamName).join('; '), status(u), c?.best ?? '', c?.last ?? '', c?.attempts ?? 0, !c ? 'Belum mengerjakan' : c.best === null ? 'Menunggu penilaian' : c.best >= 80 ? 'Lulus' : 'Belum lulus', c ? fmtDate(c.lastAt) : ''];})], `nilai-${q.id}-${day}.csv`);
    } else {
      const qs = visibleQuizzes(d);
      saveCsv([['Nama', 'Email', 'Tim', 'Status akun', ...qs.map(q => q.title), 'Quiz lulus', 'Rata-rata skor terbaik'],
        ...matrixUsers(d, qs).map(u => {const st = userStats(d, u, qs); return [u.name, u.email, (u.teams || []).map(teamName).join('; '), status(u), ...qs.map(q => cellOf(d, u.id, q.id)?.best ?? ''), `${st.passed}/${qs.length}`, st.avg ?? ''];})], `nilai-quiz-${day}.csv`);
    }
  }

  // ---------- laporan ----------
  let report = null, reportTeam = '';
  async function renderReport() {
    report = await api.get('/api/admin/report' + (reportTeam ? '?team=' + encodeURIComponent(reportTeam) : ''));
    const active30 = report.users.filter(u => u.lastActivity && Date.now() - new Date(u.lastActivity) < 30 * 864e5).length;
    const learners = report.users.filter(u => u.status !== 'disabled').length;
    const avg = report.courses.length ? Math.round(report.courses.reduce((s, c) => s + c.avgProgress, 0) / report.courses.length) : 0;
    const passed = report.quizzes.reduce((s, q) => s + q.passed, 0);
    main.innerHTML = `<div class="content-fade">${heading('Pantau perkembangan', 'Laporan', `Data per ${fmtDate(report.generatedAt)}. Hanya materi yang sedang tayang yang dihitung.`, `<select id="report-team" aria-label="Filter tim">${teamOptions(reportTeam)}</select><button class="btn btn-outline" data-act="csv">Unduh CSV peserta</button>`)}
      <section class="stats-grid">${[['Akun aktif', learners, 'termasuk yang belum aktivasi'], ['Aktif 30 hari terakhir', active30, 'menyelesaikan modul atau quiz'], ['Rata-rata progres course', avg + '%', 'dari peserta yang mengikuti'], ['Quiz lulus', passed, 'kombinasi peserta × quiz, skor ≥ 80']].map(([l, v, n]) => `<div class="stat-card"><div><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-trend">${n}</div></div></div>`).join('')}</section>
      <h2 class="report-h">Course</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Course</th><th>Modul</th><th>Diikuti</th><th>Selesai</th><th>Rata-rata progres</th></tr></thead><tbody>
      ${report.courses.map(c => `<tr><td>${esc(c.title)}</td><td>${c.lessons}</td><td>${c.enrolled}</td><td>${c.completed}</td><td><div class="progress-row inline"><div class="progress-track"><span style="width:${c.avgProgress}%"></span></div><b>${c.avgProgress}%</b></div></td></tr>`).join('') || '<tr><td colspan="5" class="empty-row">Belum ada course tayang.</td></tr>'}</tbody></table></div>
      <h2 class="report-h">Quiz</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Quiz</th><th>Peserta</th><th>Lulus</th><th>Rata-rata skor terbaik</th><th>Total percobaan</th></tr></thead><tbody>
      ${report.quizzes.map(q => `<tr><td>${esc(q.title)}</td><td>${q.takers}</td><td>${q.passed}</td><td>${q.avgBest ?? '—'}</td><td>${q.attempts}</td></tr>`).join('') || '<tr><td colspan="5" class="empty-row">Belum ada quiz tayang.</td></tr>'}</tbody></table></div></div>`;
  }
  function downloadCsv() {
    const cell = v => {const s = String(v ?? ''); return /[",\n;]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""')}"` : s;};
    const rows = [['Nama', 'Email', 'Tim', 'Role', 'Status', 'Course diikuti', 'Modul selesai', 'Quiz lulus', 'Terakhir aktif', 'Terakhir login'],
      ...report.users.map(u => [u.name, u.email, (u.teams || []).map(teamName).join('; '), u.role === 'admin' ? 'Admin' : 'Peserta', USTATUS[u.status][0], u.coursesEnrolled, u.lessonsCompleted, u.quizzesPassed, u.lastActivity ? fmtDate(u.lastActivity) : '', u.lastSignInAt ? fmtDate(u.lastSignInAt) : ''])];
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `learning-hub-peserta${reportTeam ? '-' + reportTeam : ''}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- onboarding ----------
  const OSTATUS = {not_started: ['Belum login', 'st-draft'], active: ['Berjalan', 'st-changed'], overdue: ['Terlambat', 'st-late'], completed: ['Selesai', 'st-live'], none: ['Program kosong', 'st-draft']};
  let onbData = null, onbFilter = 'open', onbScope = '', onbDraft = null;
  main.addEventListener('change', e => {
    if (e.target.dataset?.onbCourse === undefined || !onbDraft) return;
    const ids = [...main.querySelectorAll('[data-onb-course]:checked:not(:disabled)')].map(x => x.value);
    if (onbScope) onbDraft.byTeam[onbScope] = ids; else onbDraft.courses = ids;
    const days = main.querySelector('#onb-settings-form [name=days]')?.value; renderOnboarding(onbData).then(() => {if (days) main.querySelector('#onb-settings-form [name=days]').value = days;});
  });
  const dayLabel = n => n === 1 ? '1 hari' : `${n} hari`;
  async function renderOnboarding(data) {
    onbData = data || await api.get('/api/admin/onboarding');
    if (!users.length) try {users = (await api.get('/api/admin/users')).users;} catch {}
    const {settings, courses: cs, people} = onbData;
    if (!data || !onbDraft) onbDraft = {courses: [...settings.courses], byTeam: structuredClone(settings.byTeam || {})};
    if (onbScope && !teamList?.some(t => t.id === onbScope)) onbScope = '';
    const chosen = onbScope ? onbDraft.byTeam[onbScope] || [] : onbDraft.courses;
    const visible = c => !onbScope || !c.teams.length || c.teams.includes(onbScope);
    const counts = {open: people.filter(p => p.status !== 'completed').length, overdue: people.filter(p => p.status === 'overdue').length, completed: people.filter(p => p.status === 'completed').length};
    const list = people.filter(p => onbFilter === 'all' || (onbFilter === 'open' ? p.status !== 'completed' : p.status === onbFilter));
    const assignable = users.filter(u => u.role !== 'admin' && !people.some(p => p.id === u.id));
    const ordered = [...chosen.map(id => cs.find(c => c.id === id)).filter(Boolean), ...cs.filter(c => !chosen.includes(c.id))];
    const scopeTabs = teamList?.length ? `<div class="seg-tabs onb-scope" role="tablist">${[['', 'Semua tim'], ...teamList.map(t => [t.id, t.name])].map(([k, l]) => {const n = k ? (onbDraft.byTeam[k] || []).length : onbDraft.courses.length; return `<button type="button" role="tab" class="seg-tab ${onbScope === k ? 'active' : ''}" aria-selected="${onbScope === k}" data-act="onb-scope" data-f="${esc(k)}">${esc(l)}${n ? ` <span class="nav-badge quiet">${n}</span>` : ''}</button>`;}).join('')}</div>
      <p class="hint">${onbScope ? `Course tambahan khusus anggota <b>${esc(teamName(onbScope))}</b>, selain course di tab "Semua tim".` : 'Course wajib untuk semua peserta onboarding. Pilih tab tim untuk menambah course khusus tim.'}</p>` : '';
    main.innerHTML = `<div class="content-fade">${heading('Karyawan baru', 'Onboarding', `Peserta yang di-assign hanya bisa membuka course onboarding sampai semua modul selesai dan quiz-nya lulus (≥ 80). Tenggat ${dayLabel(settings.days)} dihitung sejak login pertama. Lewat tenggat tidak memblokir akses, hanya ditandai Terlambat.`)}
      <section class="onb-settings"><h2>Course wajib</h2>${scopeTabs}
        ${onbData.programTotal ? '' : '<p class="onb-warn">Belum ada course onboarding yang tayang, jadi peserta yang di-assign belum dikunci. Pilih minimal satu course yang sudah di-publish.</p>'}
        <form id="onb-settings-form"><ol class="onb-course-pick">${ordered.map(c => {const inAll = onbScope && onbDraft.courses.includes(c.id), ok = visible(c); return `<li><label class="${ok && !inAll ? '' : 'disabled'}"><input type="checkbox" name="course" data-onb-course value="${esc(c.id)}" ${chosen.includes(c.id) || inAll ? 'checked' : ''} ${ok && !inAll ? '' : 'disabled'} /><span><b>${esc(c.title)}</b><small>${c.lessons} modul · ${c.quizzes.length ? `quiz wajib lulus: ${c.quizzes.map(q => esc(q.title)).join(', ')}` : 'tanpa quiz'}${inAll ? ' · sudah wajib untuk semua tim' : ok ? '' : ' · tidak terlihat oleh tim ini (atur audiens course)'}</small><span class="team-chips">${teamChips(c.teams)}</span></span></label></li>`;}).join('') || '<li class="empty-row">Belum ada course yang tayang.</li>'}</ol>
        <div class="onb-settings-row"><label>Tenggat<span class="grade-num"><input type="number" name="days" min="1" max="90" value="${settings.days}" required /> hari sejak login pertama</span></label><button class="btn btn-orange" type="submit">Simpan pengaturan</button></div>
        <p class="hint">Urutan mengikuti daftar course. Course yang belum tayang tidak dihitung. Perubahan berlaku langsung untuk peserta yang sedang onboarding.</p></form></section>
      <section class="onb-people"><div class="onb-people-head"><div class="seg-tabs" role="tablist">${[['open', 'Belum selesai'], ['overdue', 'Terlambat'], ['completed', 'Selesai'], ['all', 'Semua']].map(([k, l]) => `<button type="button" role="tab" class="seg-tab ${onbFilter === k ? 'active' : ''}" aria-selected="${onbFilter === k}" data-act="onb-filter" data-f="${k}">${l}${k !== 'all' && counts[k] ? ` <span class="nav-badge ${k === 'completed' ? 'quiet' : ''}">${counts[k]}</span>` : ''}</button>`).join('')}</div>
        ${assignable.length ? `<form id="onb-assign-form" class="onb-assign"><select name="user" aria-label="Pilih peserta" required><option value="">Assign peserta yang sudah ada…</option>${assignable.map(u => `<option value="${u.id}">${esc(u.name)} · ${esc(u.email)}</option>`).join('')}</select><button class="btn btn-outline" type="submit">Assign</button></form>` : ''}</div>
      ${list.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Peserta</th><th>Status</th><th>Progres</th><th>Tenggat</th><th class="col-actions">Aksi</th></tr></thead><tbody>${list.map(onbRow).join('')}</tbody></table></div>`
        : `<div class="raport-empty">${people.length ? 'Tidak ada peserta di kategori ini.' : 'Belum ada peserta onboarding. Peserta baru otomatis masuk ke sini saat diundang dengan opsi "Wajib onboarding".'}</div>`}</section></div>`;
  }
  function onbRow(p) {
    const pct = p.total ? Math.round(p.done / p.total * 100) : 0;
    const detail = p.courses.map(c => `<li class="${c.done ? 'ok' : ''}">${c.done ? '✓' : '○'} ${esc(c.title)} <small>· modul ${c.lessonsDone}/${c.lessonsTotal}${c.quizzes.map(q => ` · quiz ${q.passed ? `lulus (${q.best})` : q.pending ? 'menunggu penilaian' : q.best !== null ? `${q.best}` : 'belum'}`).join('')}</small></li>`).join('');
    const due = p.status === 'completed' ? `<span class="when">Selesai ${fmtDate(p.completedAt)}${p.manual ? ` · dibuka manual${p.completedBy ? ' oleh ' + esc(p.completedBy) : ''}` : ''}</span>`
      : p.dueAt ? `<span class="when">${fmtDate(p.dueAt)}</span><small class="${p.status === 'overdue' ? 'hint-bad' : ''}">${p.status === 'overdue' ? `lewat ${dayLabel(Math.abs(p.daysLeft))}` : p.daysLeft <= 0 ? 'hari ini' : `sisa ${dayLabel(p.daysLeft)}`}</small>` : '<small>Mulai dihitung saat login pertama</small>';
    const open = p.status !== 'completed';
    return `<tr><td><a class="row-title" href="#raport/${p.id}">${esc(p.name)}</a><small>${esc(p.email)}</small><div class="team-chips">${teamChips(p.teams, '')}</div></td><td>${badge(OSTATUS[p.status] || OSTATUS.none)}</td>
      <td><div class="onb-progress"><b>${p.done}/${p.total}</b> course<div class="mini-track"><span style="width:${pct}%"></span></div></div><details class="onb-detail"><summary>Rincian</summary><ul>${detail}</ul></details></td>
      <td>${due}</td><td class="col-actions">${open && p.dueAt ? `<button class="btn btn-outline" data-act="onb-extend" data-id="${p.id}">Perpanjang</button>` : ''}${open ? `<button class="btn btn-outline" data-act="onb-unlock" data-id="${p.id}" data-name="${esc(p.name)}">Buka akses</button>` : ''}<button class="btn btn-outline btn-danger-text" data-act="onb-cancel" data-id="${p.id}" data-name="${esc(p.name)}">${open ? 'Batalkan' : 'Hapus dari daftar'}</button></td></tr>`;
  }
  async function onbAction(id, body, msg) {
    try {const r = await api.post(`/api/admin/users/${id}/onboarding`, body); closeModal(); toast(msg); await renderOnboarding(r); users = [];} catch (err) {toast(err.message, true);}
  }
  main.addEventListener('submit', async e => {
    if (e.target.id === 'onb-settings-form') {
      e.preventDefault(); const f = e.target, btn = f.querySelector('[type=submit]');
      const body = {courses: onbDraft.courses, byTeam: onbDraft.byTeam, days: Number(f.elements.days.value)};
      btn.disabled = true;
      try {const r = await api.post('/api/admin/onboarding/settings', body); onbDraft = null; toast('Pengaturan onboarding disimpan.'); await renderOnboarding(r);} catch (err) {toast(err.message, true); btn.disabled = false;}
    } else if (e.target.id === 'onb-assign-form') {
      e.preventDefault(); const id = e.target.elements.user.value; if (!id) return;
      await onbAction(id, {action: 'assign'}, 'Peserta di-assign ke onboarding. Materi lain terkunci sampai onboarding selesai.');
    }
  });
  function onbExtendDialog(id) {
    const p = onbData.people.find(x => x.id === id);
    showModal('Perpanjang tenggat', `<form id="onb-extend-form" class="admin-form"><p>${esc(p.name)} · tenggat sekarang ${fmtDate(p.dueAt)}.</p><label>Tambah<span class="grade-num"><input type="number" name="days" min="1" max="60" value="7" required /> hari</span><small>Jika sudah lewat tenggat, dihitung dari hari ini.</small></label>
      <div class="confirm-actions"><button type="button" class="btn btn-outline" data-act="close-modal">Batal</button><button class="btn btn-orange" type="submit">Perpanjang</button></div></form>`);
    $('#onb-extend-form').addEventListener('submit', e => {e.preventDefault(); onbAction(id, {action: 'extend', days: Number(e.target.elements.days.value)}, 'Tenggat diperpanjang.');});
  }

  // ---------- penilaian essay ----------
  const pts = n => n === null || n === undefined ? '—' : String(Math.round(Number(n) * 100) / 100).replace('.', ',');
  let gradingTeam = '', gradingTab = 'pending';
  async function renderGrading(tab) {
    gradingTab = tab;
    const {items: all} = await api.get('/api/admin/grading?status=' + tab);
    const list = all.filter(a => !gradingTeam || (gradingTeam === '__none' ? !a.teams.length : a.teams.includes(gradingTeam)));
    const tabs = `<div class="seg-tabs" role="tablist">${[['pending', 'Menunggu penilaian'], ['graded', 'Sudah dinilai']].map(([k, l]) => `<a role="tab" class="seg-tab ${tab === k ? 'active' : ''}" aria-selected="${tab === k}" href="#grading${k === 'graded' ? '/graded' : ''}">${l}${k === 'pending' && pendingCount ? ` <span class="nav-badge">${pendingCount}</span>` : ''}</a>`).join('')}</div>`;
    main.innerHTML = `<div class="content-fade">${heading('Quiz essay', 'Penilaian', 'Jawaban essay peserta dinilai di sini. Skor akhir baru muncul di quiz, raport, dan Nilai Quiz setelah disimpan.', `<select id="grading-team" aria-label="Filter tim">${teamOptions(gradingTeam, 'Semua tim', true)}</select>`)}${tabs}
      ${list.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Peserta</th><th>Quiz</th><th>Dikirim</th>${tab === 'graded' ? '<th>Skor</th><th>Dinilai</th>' : ''}<th class="col-actions">Aksi</th></tr></thead><tbody>
      ${list.map(a => `<tr><td><span class="row-title">${esc(a.name)}</span><small>${esc(a.email)}</small><div class="team-chips">${teamChips(a.teams, '')}</div></td><td>${esc(a.quizTitle || a.quizId)}</td><td><span class="when">${fmtDate(a.createdAt)}</span></td>${tab === 'graded' ? `<td><b>${a.score}</b>${a.score >= 80 ? ` <span class="st st-live">Lulus</span>` : ''}</td><td><span class="when">${fmtDate(a.gradedAt)}${a.grader ? ' · ' + esc(a.grader) : ''}</span></td>` : ''}<td class="col-actions"><a class="btn ${tab === 'pending' ? 'btn-orange' : 'btn-outline'}" href="#grading/${a.userId}/${a.attemptId}">${tab === 'pending' ? 'Nilai' : 'Lihat / ubah'}</a></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="raport-empty">${tab === 'pending' ? 'Tidak ada jawaban essay yang menunggu penilaian. 🎉' : 'Belum ada essay yang dinilai.'}</div>`}</div>`;
  }
  let grading = null;
  async function renderGradeForm(uid, aid) {
    const {attempt: a} = await api.get(`/api/admin/grading/${uid}/${aid}`);
    grading = a;
    const nl = t => esc(t).replace(/\n/g, '<br>');
    main.innerHTML = `<div class="content-fade"><a class="back-link" href="#grading${a.status === 'graded' ? '/graded' : ''}">← Penilaian</a>
      ${heading(esc(a.quizTitle || a.quizId), esc(a.name), `${esc(a.email)} · dikirim ${fmtDate(a.createdAt)}${a.status === 'graded' ? ` · dinilai ${fmtDate(a.gradedAt)}${a.grader ? ' oleh ' + esc(a.grader) : ''}` : ''}`)}
      <form id="grade-form" class="grade-form">${a.review.map((r, i) => r.type === 'essay' ? `<section class="grade-item"><div class="grade-q"><span class="ed-num">${i + 1}</span><div><span class="q-kind">Essay · ${r.points} poin</span><p>${nl(r.q)}</p></div></div>
        ${r.rubric ? `<details class="grade-rubric" open><summary>Rubrik / contoh jawaban</summary><div>${nl(r.rubric)}</div></details>` : '<p class="grade-hint">Belum ada rubrik untuk soal ini.</p>'}
        <span class="ed-label">Jawaban peserta</span><div class="grade-answer">${nl(r.answerText)}</div>
        <div class="grade-inputs"><label>Nilai<span class="grade-num"><input type="number" name="earned-${i}" data-grade="${i}" min="0" max="${r.points}" step="0.5" value="${r.earned ?? ''}" required inputmode="decimal" /> / ${r.points}</span></label>
        <label>Komentar untuk peserta <small>(opsional)</small><textarea name="feedback-${i}" rows="3" maxlength="2000">${esc(r.feedback || '')}</textarea></label></div></section>`
        : `<section class="grade-item grade-mc"><div class="grade-q"><span class="ed-num">${i + 1}</span><div><span class="q-kind q-mc">Pilihan ganda · otomatis</span><p>${nl(r.q)}</p></div></div><p class="grade-mc-line ${r.correct ? 'ok' : 'bad'}">${r.correct ? '✓ Benar' : '✕ Salah'} · jawaban: ${esc(r.options?.[r.selected] ?? '—')}${r.correct ? '' : ` · kunci: ${esc(r.options?.[r.answer] ?? '—')}`} · <b>${pts(r.earned)}/${r.points ?? 1}</b> poin</p></section>`).join('')}
      <div class="grade-bar"><div id="grade-total"></div><button class="btn btn-orange" type="submit">${a.status === 'graded' ? 'Simpan perubahan nilai' : 'Simpan nilai'}</button></div></form></div>`;
    updateGradeTotal();
  }
  function updateGradeTotal() {
    if (!grading) return; const box = $('#grade-total'); if (!box) return;
    let earned = 0, max = 0, missing = 0;
    grading.review.forEach((r, i) => {
      max += r.points ?? 1;
      if (r.type === 'essay') {const v = $(`[data-grade="${i}"]`).value; if (v === '') missing++; else earned += Number(v) || 0;} else earned += r.earned || 0;
    });
    const score = Math.round(earned / max * 100);
    box.innerHTML = `Total <b>${pts(earned)}</b> / ${pts(max)} poin · skor <b>${missing ? '—' : score}</b>/100 ${missing ? `<small>${missing} essay belum diberi nilai</small>` : score >= 80 ? '<span class="st st-live">Lulus</span>' : '<span class="st st-changed">Belum lulus</span>'}`;
  }
  main.addEventListener('input', e => {if (e.target.dataset?.grade !== undefined) updateGradeTotal();});
  main.addEventListener('input', e => {if (e.target.dataset?.docUrl !== undefined) {const h = e.target.parentElement.querySelector('.doc-detect'); if (h) h.textContent = docHint(e.target.value.trim());}});
  main.addEventListener('submit', async e => {
    if (e.target.id !== 'grade-form') return; e.preventDefault();
    const f = e.target, btn = f.querySelector('[type=submit]');
    const grades = grading.review.map((r, i) => r.type !== 'essay' ? null : {index: i, earned: Number(f.elements['earned-' + i].value), feedback: f.elements['feedback-' + i].value}).filter(Boolean);
    btn.disabled = true;
    try {
      const r = await api.post(`/api/admin/grading/${grading.userId}/${grading.attemptId}`, {grades});
      pendingCount = r.pending; toast(`Nilai tersimpan. Skor akhir ${r.score}/100.`);
      location.hash = '#grading';
    } catch (err) {toast(err.message, true); btn.disabled = false;}
  });

  // ---------- impor / ekspor quiz ----------
  const QCOLS = ['quiz_id', 'judul_quiz', 'kategori', 'deskripsi', 'menit', 'course_id', 'tipe', 'pertanyaan', 'pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d', 'pilihan_e', 'pilihan_f', 'jawaban_benar', 'pembahasan_rubrik', 'poin'];
  const QWIDTHS = [18, 30, 18, 34, 7, 20, 10, 50, 24, 24, 24, 24, 18, 18, 10, 44, 6];
  const HELP = [['Kolom', 'Isi'],
    ['quiz_id', 'Kosongkan untuk membuat quiz baru. Isi dengan ID quiz yang sudah ada untuk MENGGANTI seluruh pertanyaannya (lihat file ekspor).'],
    ['judul_quiz', 'Wajib untuk quiz baru. Baris berikutnya dengan quiz_id & judul_quiz kosong dianggap pertanyaan quiz yang sama.'],
    ['kategori, deskripsi, menit, course_id', 'Cukup diisi di baris pertama setiap quiz. course_id menautkan quiz ke course (lihat sheet "Daftar course").'],
    ['tipe', 'PG (pilihan ganda) atau Essay.'],
    ['pertanyaan', 'Wajib.'],
    ['pilihan_a … pilihan_f', 'Khusus PG: minimal 2 pilihan, isi berurutan dari A.'],
    ['jawaban_benar', 'Khusus PG: huruf A–F.'],
    ['pembahasan_rubrik', 'PG: pembahasan setelah quiz. Essay: rubrik/contoh jawaban untuk penilai (tampil ke peserta setelah dinilai).'],
    ['poin', 'Opsional. Default PG 1, Essay 5. Angka bulat 1–100.'],
    ['Catatan', 'Hasil impor disimpan sebagai DRAFT. Periksa lalu klik Publish di daftar quiz. Quiz yang sudah tayang tetap tampil versi lama sampai di-publish ulang.']];
  async function loadXlsx() {
    if (window.HubXlsx) return window.HubXlsx;
    await new Promise((resolve, reject) => {const s = document.createElement('script'); s.src = '/xlsx-tools.js'; s.onload = resolve; s.onerror = () => reject(new Error('Modul Excel gagal dimuat. Muat ulang halaman.')); document.head.append(s);});
    return window.HubXlsx;
  }
  const courseSheet = () => ({name: 'Daftar course', rows: [['course_id', 'Judul course'], ...items.filter(i => i.kind === 'course').map(c => [c.id, c.title])], widths: [28, 50]});
  function quizRowsOf(q) {
    return (q.questions || []).map((x, j) => {
      const essay = x.type === 'essay', opts = essay ? [] : x.options || [];
      return [q.id, j ? '' : q.title, j ? '' : q.category, j ? '' : q.description, j ? '' : q.minutes, j ? '' : q.course || '', essay ? 'Essay' : 'PG', x.q,
        ...[0, 1, 2, 3, 4, 5].map(k => opts[k] ?? ''), essay ? '' : (Number.isInteger(x.answer) ? String.fromCharCode(65 + x.answer) : ''), essay ? x.rubric || '' : x.why || '', x.points ?? (essay ? 5 : 1)];
    });
  }
  async function quizTemplate() {
    const X = await loadXlsx();
    const sample = [
      ['', 'Contoh: Dasar Pelayanan', 'Customer Experience', 'Latihan singkat pelayanan pelanggan.', 5, '', 'PG', 'Apa langkah pertama saat pelanggan mengeluh?', 'Mendengarkan sampai selesai', 'Langsung memberi solusi', 'Mengalihkan ke tim lain', '', '', '', 'A', 'Mendengarkan membuat pelanggan merasa dihargai.', 1],
      ['', '', '', '', '', '', 'PG', 'Kapan sebaiknya memberi update status?', 'Hanya jika ditanya', 'Secara proaktif sesuai janji waktu', '', '', '', '', 'B', 'Update proaktif menjaga kepercayaan.', 1],
      ['', '', '', '', '', '', 'Essay', 'Jelaskan cara menyampaikan penolakan visa kepada pelanggan.', '', '', '', '', '', '', '', 'Poin penting: empati, jelaskan alasan resmi, tawarkan langkah berikutnya.', 5]];
    await X.write([{name: 'Quiz', rows: [QCOLS, ...sample], widths: QWIDTHS}, {name: 'Petunjuk', rows: HELP, widths: [34, 110]}, courseSheet()], 'template-impor-quiz.xlsx');
  }
  async function quizExport() {
    const [{quizzes: list}, X] = await Promise.all([api.get('/api/admin/export/quizzes'), loadXlsx()]);
    if (!list.length) return toast('Belum ada quiz untuk diekspor.', true);
    await X.write([{name: 'Quiz', rows: [QCOLS, ...list.flatMap(quizRowsOf)], widths: QWIDTHS}, {name: 'Petunjuk', rows: HELP, widths: [34, 110]}, courseSheet()], `quiz-learning-hub-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast(`${list.length} quiz diekspor (termasuk draft).`);
  }
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/, 1)[0], delim = [';', ',', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {if (c === '"') {if (text[i + 1] === '"') {cell += '"'; i++;} else q = false;} else cell += c;}
      else if (c === '"' && cell === '') q = true;
      else if (c === delim) {row.push(cell); cell = '';}
      else if (c === '\n' || c === '\r') {if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '';}
      else cell += c;
    }
    if (cell !== '' || row.length) {row.push(cell); rows.push(row);}
    return rows;
  }
  const ALIAS = {id: 'quiz_id', quiz: 'quiz_id', judul: 'judul_quiz', title: 'judul_quiz', category: 'kategori', description: 'deskripsi', durasi: 'menit', minutes: 'menit', course: 'course_id', type: 'tipe', jenis: 'tipe', soal: 'pertanyaan', question: 'pertanyaan', jawaban: 'jawaban_benar', kunci: 'jawaban_benar', answer: 'jawaban_benar', pembahasan: 'pembahasan_rubrik', rubrik: 'pembahasan_rubrik', explanation: 'pembahasan_rubrik', points: 'poin', bobot: 'poin'};
  function rowsToQuizzes(rows) {
    const norm = h => {const k = String(h ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, ''); return ALIAS[k] || k.replace(/^opsi_/, 'pilihan_');};
    const hi = rows.findIndex(r => r.some(c => norm(c) === 'pertanyaan'));
    if (hi < 0) throw new Error('Kolom "pertanyaan" tidak ditemukan. Gunakan template dari tombol "Unduh template".');
    const cols = rows[hi].map(norm), get = (r, k) => {const i = cols.indexOf(k); const v = i < 0 ? '' : r[i]; return v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v).trim();};
    const quizzes = []; let cur = null;
    rows.slice(hi + 1).forEach((r, n) => {
      const row = hi + n + 2;
      if (!r.some(c => String(c ?? '').trim())) return;
      const id = get(r, 'quiz_id'), title = get(r, 'judul_quiz');
      if (!cur || (id && id !== cur.id) || (!id && title && title !== cur.title)) {
        cur = {row, id: id || undefined, title, category: get(r, 'kategori'), description: get(r, 'deskripsi'), minutes: get(r, 'menit'), course: get(r, 'course_id'), questions: []};
        quizzes.push(cur);
      }
      if (get(r, 'pertanyaan') || get(r, 'tipe'))
        cur.questions.push({row, type: get(r, 'tipe') || 'PG', q: get(r, 'pertanyaan'), options: ['a', 'b', 'c', 'd', 'e', 'f'].map(x => get(r, 'pilihan_' + x)), answer: get(r, 'jawaban_benar'), explanation: get(r, 'pembahasan_rubrik'), points: get(r, 'poin')});
    });
    if (!quizzes.length) throw new Error('File tidak berisi baris pertanyaan.');
    return quizzes;
  }
  let importing = null;
  function quizImport() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.addEventListener('change', async () => {
      const file = input.files[0]; if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('File terlalu besar (maksimal 5 MB).');
        const rows = /\.csv$/i.test(file.name) || file.type === 'text/csv' ? parseCsv(await file.text()) : await (await loadXlsx()).read(file);
        const quizzes = rowsToQuizzes(rows);
        const r = await api.post('/api/admin/import/quizzes', {dryRun: true, quizzes});
        importing = {quizzes, name: file.name}; showImportPreview(r);
      } catch (e) {toast(e.message, true);}
    });
    input.click();
  }
  function showImportPreview(r) {
    const s = r.summary;
    showModal('Pratinjau impor quiz', `<p class="import-file">${esc(importing.name)}</p>
      ${r.errors.length ? `<div class="import-errors"><strong>${r.errors.length} masalah harus diperbaiki di file, lalu impor ulang:</strong><ul>${r.errors.slice(0, 50).map(e => `<li>${esc(e.message)}</li>`).join('')}${r.errors.length > 50 ? `<li>… dan ${r.errors.length - 50} lainnya</li>` : ''}</ul></div>` : `<p class="import-ok">✓ File valid: ${s.create} quiz baru, ${s.update} quiz diperbarui, ${s.questions} pertanyaan.</p>`}
      ${!r.errors.length && r.items.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Quiz</th><th>Aksi</th><th>Pertanyaan</th><th>Catatan</th></tr></thead><tbody>${r.items.map(i => `<tr><td><span class="row-title">${esc(i.title)}</span>${i.id ? `<small>${esc(i.id)}</small>` : ''}</td><td>${i.action === 'create' ? '<span class="st st-draft">Baru</span>' : '<span class="st st-changed">Ganti pertanyaan</span>'}</td><td>${i.questions}${i.essays ? ` <small>(${i.essays} essay)</small>` : ''}</td><td>${i.published && i.action === 'update' ? 'Sedang tayang: peserta tetap melihat versi lama sampai di-publish ulang. ' : ''}${i.warning ? `<span class="hint-bad">${esc(i.warning)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="confirm-actions"><button class="btn btn-outline" data-act="close-modal">Batal</button>${r.errors.length ? '' : '<button class="btn btn-orange" data-act="import-commit">Simpan sebagai draft</button>'}</div>`, true);
  }
  async function importCommit(btn) {
    btn.disabled = true;
    const r = await api.post('/api/admin/import/quizzes', {dryRun: false, quizzes: importing.quizzes});
    if (!r.ok) {showImportPreview(r); return;}
    closeModal(); importing = null;
    toast(`Impor selesai: ${r.summary.create} quiz baru, ${r.summary.update} diperbarui (draft). Publish untuk menayangkan.`);
    await renderList('quiz');
  }

  // ---------- aksi ----------
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (b.closest('summary')) e.preventDefault();
    const d = editor?.draft;
    try {
      switch (act) {
        case 'menu': $('#sidebar').classList.toggle('open'); $('#mobile-scrim').classList.toggle('visible'); break;
        case 'close-modal': closeModal(); break;
        case 'reload': route(); break;
        case 'new': newItemDialog(b.dataset.kind); break;
        case 'move-item': {
          const kind = location.hash.split('/')[1] || 'course', list = items.filter(i => i.kind === kind).map(i => i.id), i = list.indexOf(b.dataset.id), j = i + Number(b.dataset.dir);
          [list[i], list[j]] = [list[j], list[i]]; await api.post(`/api/admin/content/${kind}/reorder`, {ids: list}); await renderList(kind); break;
        }
        case 'publish-item': b.disabled = true; await api.post(`/api/admin/content/${b.dataset.kind}/${b.dataset.id}/publish`, {}); toast('Tayang! Peserta sudah bisa melihatnya.'); await renderList(b.dataset.kind); break;
        case 'unpublish-item': case 'unpublish': {
          const kind = b.dataset.kind || editor.kind, id = b.dataset.id || editor.id;
          if (!await confirmBox('Sembunyikan dari peserta? Progres dan riwayat peserta tetap tersimpan, dan konten bisa di-publish lagi kapan saja.', 'Sembunyikan')) break;
          const r = await api.post(`/api/admin/content/${kind}/${id}/unpublish`, {}); toast('Disembunyikan dari peserta.');
          if (act === 'unpublish') {const dirty = editor.dirty, draft = editor.draft; applyItem(r.item); if (dirty) {editor.draft = draft; editor.dirty = true;} renderEditor();} else await renderList(kind);
          break;
        }
        case 'delete-item': {
          if (!await confirmBox('Hapus permanen? Konten ini tidak bisa dikembalikan.', 'Hapus permanen', true)) break;
          await api.post(`/api/admin/content/${b.dataset.kind}/${b.dataset.id}/delete`, {}); toast('Konten dihapus.'); await renderList(b.dataset.kind); break;
        }
        case 'save': b.disabled = true; await save(); break;
        case 'publish': b.disabled = true; await publish(); break;
        case 'reload-editor': {const {kind, id} = editor; editor = null; await openEditor(kind, id); break;}
        case 'add-lesson': {const id = newId(); d.lessons.push({id, title: '', duration: 5, intro: '', sections: [{heading: '', html: ''}]}); openKeys.add('L:' + id); markDirty(); renderEditor(); break;}
        case 'add-question': d.questions.push(b.dataset.type === 'essay' ? {type: 'essay', q: '', points: 5, rubric: ''} : {type: 'mc', q: '', options: ['', '', '', ''], answer: null, why: '', points: 1}); openKeys.add('Q:' + (d.questions.length - 1)); markDirty(); renderEditor(); break;
        case 'add-doc': {const p = b.dataset.arr.split('.'), key = p.pop(), parent = p.length ? getPath(d, p.join('.')) : d; (parent[key] ||= []).push(b.dataset.internal ? {title: '', ref: ''} : {title: '', url: ''}); markDirty(); renderEditor(); break;}
        case 'add-section': getPath(d, b.dataset.arr).push({heading: '', html: ''}); markDirty(); renderEditor(); break;
        case 'add-option': d.questions[b.dataset.q].options.push(''); markDirty(); renderEditor(); break;
        case 'remove-option': {
          const q = d.questions[b.dataset.q], j = Number(b.dataset.i); q.options.splice(j, 1);
          if (q.answer === j) q.answer = null; else if (q.answer > j) q.answer--;
          markDirty(); renderEditor(); break;
        }
        case 'move': {
          const arr = getPath(d, b.dataset.arr), i = Number(b.dataset.i), j = i + Number(b.dataset.dir);
          if (b.dataset.arr === 'questions') {const ki = openKeys.has('Q:' + i), kj = openKeys.has('Q:' + j); openKeys.delete('Q:' + i); openKeys.delete('Q:' + j); if (ki) openKeys.add('Q:' + j); if (kj) openKeys.add('Q:' + i);}
          [arr[i], arr[j]] = [arr[j], arr[i]]; markDirty(); renderEditor(); break;
        }
        case 'remove': {
          const arr = getPath(d, b.dataset.arr), i = Number(b.dataset.i), what = b.dataset.arr === 'lessons' ? 'modul' : b.dataset.arr === 'questions' ? 'pertanyaan' : /(^|\.)docs$/.test(b.dataset.arr) ? 'dokumen' : 'bagian';
          const filled = JSON.stringify(arr[i]).replace(/"(id|duration|answer)":[^,}]*/g, '').match(/:"[^"]+"/);
          if (filled && !await confirmBox(`Hapus ${what} ini beserta isinya?`, 'Hapus', true)) break;
          arr.splice(i, 1); if (b.dataset.arr === 'questions') openKeys.clear(); markDirty(); renderEditor(); break;
        }
        case 'upload-image': await uploadImage(b.dataset.path, b); break;
        case 'remove-image': setPath(d, b.dataset.path + '.image', undefined); markDirty(); renderEditor(); break;
        case 'preview-lesson': {
          const i = Number(b.dataset.i), l = d.lessons[i];
          const outline = `<aside class="learn-outline"><div class="outline-head"><span class="back-link">Pratinjau draft</span><h2>${esc(d.title || 'Course tanpa judul')}</h2></div><ol class="outline-list">${d.lessons.map((x, j) => `<li><button type="button" class="outline-item ${j === i ? 'current' : ''}" data-act="preview-lesson" data-i="${j}"><span class="outline-dot">${j + 1}</span><span>${esc(x.title || 'Modul tanpa judul')}<small>${Number(x.duration) || 0} menit</small></span></button></li>`).join('')}</ol></aside>`;
          showModal('Pratinjau modul — tampilan peserta', `<div class="preview-stage"><div class="learn-layout">${outline}<article class="learn-main lesson-content"><div class="modal-kicker">${esc(d.category)} · Modul ${i + 1} dari ${d.lessons.length} · ${Number(l.duration) || 0} menit</div><h1 class="learn-title">${esc(l.title || 'Modul tanpa judul')}</h1>${l.intro ? `<p class="lead">${esc(l.intro)}</p>` : ''}${previewSections(l.sections) + previewDocs(l.docs)}<div class="lesson-actions"><span class="sample-note">Pratinjau draft — peserta baru melihatnya setelah Publish.</span></div></article></div></div>`, 'full');
          break;
        }
        case 'preview-article':
          showModal('Pratinjau artikel — tampilan peserta', `<div class="preview-stage"><div class="page-narrow"><article class="article-reader page-card"><div class="modal-kicker">${esc(d.category)}</div><h1>${esc(d.title)}</h1><div class="reader-meta"><span>SPUN Learning Team</span><span>${Number(d.minutes) || 0} menit baca</span></div><p class="reader-lead">${esc(d.description)}</p>${previewSections(d.sections) + previewDocs(d.docs)}<p class="sample-note">Pratinjau draft — peserta baru melihatnya setelah Publish.</p></article></div></div>`, 'full');
          break;
        case 'invite': inviteDialog(); break;
        case 'user-teams': userTeamsDialog(b.dataset.id); break;
        case 'team-members': e.preventDefault(); userTeam = b.dataset.id; location.hash = '#users'; break;
        case 'team-rename': {const t = teamList.find(x => x.id === b.dataset.id), v = await askText('Nama tim', t?.name || ''); if (v === null || v === undefined || !String(v).trim()) break; try {teamList = (await api.post(`/api/admin/teams/${b.dataset.id}`, {name: v})).teams; toast('Nama tim diubah.'); await renderTeams();} catch (err) {toast(err.message, true);} break;}
        case 'team-delete': {const t = teamList.find(x => x.id === b.dataset.id); if (!(await confirmBox(`Hapus tim "${t?.name}"? ${t?.members ? `${t.members} peserta akan dikeluarkan dari tim ini (akun & progres mereka tetap aman).` : ''}`, 'Hapus tim', true))) break; try {teamList = (await api.post(`/api/admin/teams/${b.dataset.id}/delete`, {})).teams; toast('Tim dihapus.'); await renderTeams();} catch (err) {toast(err.message, true);} break;}
        case 'onb-filter': onbFilter = b.dataset.f; renderOnboarding(onbData); break;
        case 'onb-scope': onbScope = b.dataset.f; renderOnboarding(onbData); break;
        case 'onb-extend': onbExtendDialog(b.dataset.id); break;
        case 'onb-unlock': if (await confirmBox(`Buka akses penuh untuk ${b.dataset.name}? Onboarding dianggap selesai dan semua materi langsung terbuka, meskipun course onboarding belum selesai. Tercatat sebagai dibuka manual atas nama kamu.`, 'Buka akses')) await onbAction(b.dataset.id, {action: 'unlock'}, 'Akses penuh dibuka.'); break;
        case 'onb-cancel': if (await confirmBox(`Keluarkan ${b.dataset.name} dari onboarding? Peserta langsung mendapat akses penuh dan tidak lagi muncul di daftar onboarding. Progres belajarnya tetap tersimpan.`, 'Keluarkan', true)) await onbAction(b.dataset.id, {action: 'cancel'}, 'Peserta dikeluarkan dari onboarding.'); break;
        case 'user-detail': location.hash = `#raport/${b.dataset.id}`; break;
        case 'set-role': {
          const u = users.find(x => x.id === b.dataset.id), toAdmin = b.dataset.role === 'admin';
          if (!await confirmBox(toAdmin ? `Jadikan ${u.name} admin? Admin bisa mengubah materi, mengundang, dan menonaktifkan peserta.` : `Cabut akses admin ${u.name}?`, toAdmin ? 'Jadikan admin' : 'Cabut akses', !toAdmin)) break;
          users = (await api.post(`/api/admin/users/${u.id}/role`, {role: b.dataset.role})).users; renderUserRows(); toast('Role diperbarui.'); break;
        }
        case 'set-status': {
          const u = users.find(x => x.id === b.dataset.id), off = b.dataset.status === 'disabled';
          if (!await confirmBox(off ? `Nonaktifkan ${u.name}? Ia tidak bisa masuk lagi sampai diaktifkan. Progresnya tetap tersimpan.` : `Aktifkan kembali ${u.name}?`, off ? 'Nonaktifkan' : 'Aktifkan', off)) break;
          users = (await api.post(`/api/admin/users/${u.id}/status`, {status: b.dataset.status})).users; renderUserRows(); toast(off ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.'); break;
        }
        case 'resend': b.disabled = true; users = (await api.post(`/api/admin/users/${b.dataset.id}/resend`, {})).users; renderUserRows(); toast('Undangan dikirim ulang.'); break;
        case 'csv': downloadCsv(); break;
        case 'scores-csv': scoresCsv(); break;
        case 'quiz-template': b.disabled = true; try {await quizTemplate();} finally {b.disabled = false;} break;
        case 'quiz-export': b.disabled = true; try {await quizExport();} finally {b.disabled = false;} break;
        case 'quiz-import': quizImport(); break;
        case 'import-commit': await importCommit(b); break;
        case 'score-sort': {
          const st = location.hash.startsWith('#scores/') ? sf.qsort : sf.sort, k = b.dataset.key;
          if (st.key === k) st.dir *= -1; else {st.key = k; st.dir = k === 'name' ? 1 : -1;}
          renderScoreBody(); break;
        }
      }
    } catch (err) {toast(err.message || 'Aksi gagal. Coba lagi.', true); if (b.isConnected) b.disabled = false;}
  });
  $('#mobile-scrim').addEventListener('click', () => {$('#sidebar').classList.remove('open'); $('#mobile-scrim').classList.remove('visible');});
  modal.addEventListener('click', e => {if (e.target === modal) closeModal();});

  route();
  // Cek pengaturan keamanan situs yang aktif: pratinjau dokumen Google butuh frame-src docs/drive.google.com (vercel.json v3.8+).
  (async () => {
    try {
      const r = await fetch('/', {cache: 'no-store'}), c = r.headers.get('content-security-policy') || '';
      const fs = (c.match(/frame-src[^;]*/) || [''])[0]; if (!c || ['docs.google.com', 'drive.google.com', 'accounts.google.com'].every(h => fs.includes(h))) return;
      const w = document.createElement('div'); w.className = 'sys-warn'; w.setAttribute('role', 'alert');
      w.innerHTML = '<b>Pratinjau dokumen Google belum aktif sepenuhnya.</b> File <code>vercel.json</code> yang terpasang di Vercel masih versi lama (frame-src belum memuat docs.google.com, drive.google.com, dan accounts.google.com), jadi sebagian peserta melihat "This content is blocked" atau diminta membuka di tab baru. Upload ulang <code>vercel.json</code> dari ZIP terbaru ke GitHub, tunggu deploy selesai, lalu muat ulang halaman ini. Sementara itu peserta tetap bisa membuka dokumen di tab baru.';
      main.before(w);
    } catch {}
  })();
})();
