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
    article: {label: 'Artikel', unit: 'bagian', icon: '📄', blank: {title: '', category: '', description: '', minutes: 5, color: 'peach', art: 'conversation', featured: false, sections: []}}
  };
  const COLORS = [['peach', 'Peach'], ['sage', 'Hijau sage'], ['lavender', 'Lavender'], ['blue', 'Biru'], ['sand', 'Pasir'], ['pink', 'Pink']];
  const ARTS = [['conversation', 'Percakapan'], ['listening', 'Mendengarkan'], ['quality', 'Kualitas'], ['journey', 'Perjalanan'], ['documents', 'Dokumen'], ['ownership', 'Ownership'], ['growth', 'Pertumbuhan']];
  const LEVELS = [['Fundamental', 'Fundamental'], ['Intermediate', 'Intermediate'], ['Advanced', 'Advanced']];
  const STATUS = {draft: ['Draft', 'st-draft'], published: ['Tayang', 'st-live'], changed: ['Tayang · ada perubahan', 'st-changed']};
  const USTATUS = {active: ['Aktif', 'st-live'], invited: ['Menunggu aktivasi', 'st-changed'], disabled: ['Nonaktif', 'st-off']};
  const NAV = [['content/course', 'Course'], ['content/quiz', 'Quiz'], ['content/article', 'Artikel'], ['users', 'Peserta'], ['report', 'Laporan']];

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
    $('#admin-nav').innerHTML = NAV.map(([h, label]) => `<a class="nav-item ${active === h ? 'active' : ''}" href="#${h}">${label}</a>`).join('');
    $('#breadcrumb').textContent = 'Admin · ' + (NAV.find(n => n[0] === active)?.[1] || 'Editor');
  }
  async function route() {
    const [page, a, b] = location.hash.slice(1).split('/');
    destroyRtes();
    $('#sidebar').classList.remove('open'); $('#mobile-scrim').classList.remove('visible');
    try {
      if (page === 'edit' && KIND[a] && b) {nav('content/' + a); await openEditor(a, b);}
      else if (page === 'users') {editor = null; nav('users'); await renderUsers();}
      else if (page === 'raport' && a) {editor = null; nav('users'); await renderAdminRaport(a);}
      else if (page === 'report') {editor = null; nav('report'); await renderReport();}
      else {editor = null; const k = KIND[a] ? a : 'course'; nav('content/' + k); await renderList(k);}
    } catch (e) {main.innerHTML = `<div class="admin-denied"><h1>Belum dapat memuat.</h1><p>${esc(e.message)}</p><button class="btn btn-orange" data-act="reload">Coba lagi</button></div>`;}
    lastHash = location.hash; main.focus({preventScroll: true});
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
    main.innerHTML = `<div class="content-fade">${heading('Kelola materi', `${K.label}`, 'Perubahan disimpan sebagai draft. Peserta hanya melihat versi yang sudah di-publish.', `<button class="btn btn-orange" data-act="new" data-kind="${kind}">+ ${K.label} baru</button>`)}
      <div class="catalog-toolbar"><div class="tabs">${tabs}</div></div>
      ${list.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th class="col-order">Urutan</th><th>Judul</th><th>Isi</th><th>Status</th><th>Terakhir diubah</th><th class="col-actions">Aksi</th></tr></thead><tbody>
      ${list.map((it, i) => `<tr>
        <td class="col-order"><button class="mini" data-act="move-item" data-id="${esc(it.id)}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">↑</button><button class="mini" data-act="move-item" data-id="${esc(it.id)}" data-dir="1" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Turunkan">↓</button></td>
        <td><a class="row-title" href="#edit/${kind}/${esc(it.id)}">${esc(it.title)}</a><small>${esc(it.category || 'Tanpa kategori')}</small></td>
        <td>${it.count} ${K.unit}</td>
        <td>${badge(STATUS[it.status])}</td>
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
  const fSelect = (label, p, opts, o = {}) => `<label class="${o.cls || ''}">${label}<select data-f="${p}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val(p) ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const tools = (arr, i, n, what) => `<span class="ed-tools"><button type="button" class="mini" data-act="move" data-arr="${arr}" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan ${what}">↑</button><button type="button" class="mini" data-act="move" data-arr="${arr}" data-i="${i}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Turunkan ${what}">↓</button><button type="button" class="mini mini-danger" data-act="remove" data-arr="${arr}" data-i="${i}" aria-label="Hapus ${what}">✕</button></span>`;
  const catList = () => `<datalist id="cat-list">${[...new Set(items.map(i => i.category).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;

  function sectionsEditor(base) {
    const list = val(base) || [];
    return `<div class="ed-sections">${list.map((s, j) => {
      const p = `${base}.${j}`, video = s.video ? (s.video.url ?? (s.video.youtubeId ? `https://youtu.be/${s.video.youtubeId}` : '')) : '';
      const vid = ytId(video);
      return `<div class="ed-section"><div class="ed-section-head"><strong>Bagian ${j + 1}</strong>${tools(base, j, list.length, 'bagian')}</div>
        ${fInput('Subjudul', `${p}.heading`, {max: 160, ph: 'Opsional'})}
        <div class="ed-rte"><span class="ed-label">Isi</span><div class="rte-host" data-rte="${p}"></div><small class="ed-hint">Paste (Ctrl/Cmd+V) atau drag gambar langsung ke kolom isi. Tab / Shift+Tab mengatur indent di dalam list.</small></div>
        <div class="ed-media">
          <div class="ed-media-col"><span class="ed-label">Gambar utama bagian (opsional)</span>${s.image?.url ? `<div class="ed-image"><img src="${esc(s.image.url)}" alt="" /><div>${fInput('Teks alternatif (deskripsi gambar)', `${p}.image.alt`, {max: 200})}${fInput('Keterangan (opsional)', `${p}.image.caption`, {max: 200})}<button type="button" class="btn btn-outline btn-danger-text" data-act="remove-image" data-path="${p}">Hapus gambar</button></div></div>` : `<button type="button" class="btn btn-outline" data-act="upload-image" data-path="${p}">Unggah gambar</button><small>PNG, JPG, WEBP, atau GIF · maks. 5 MB</small>`}</div>
          <div class="ed-media-col"><label>Video YouTube<input data-f="${p}.video" data-video type="url" value="${esc(video)}" placeholder="https://www.youtube.com/watch?v=…" /><small class="${vid === null ? 'hint-bad' : vid ? 'hint-ok' : ''}" data-video-hint>${vid === null ? 'Link YouTube tidak dikenali.' : vid ? 'Video terdeteksi ✓' : 'Opsional. Tempel link video YouTube.'}</small></label></div>
        </div></div>`;
    }).join('')}<button type="button" class="btn btn-subtle" data-act="add-section" data-arr="${base}">+ Tambah bagian</button></div>`;
  }
  function lessonCard(l, i, n) {
    const key = 'L:' + l.id;
    return `<details class="ed-item" data-key="${esc(key)}" ${openKeys.has(key) ? 'open' : ''}>
      <summary><span class="ed-num">${i + 1}</span><span class="ed-title">${esc(l.title || 'Modul tanpa judul')}</span><span class="ed-meta">${Number(l.duration) || 0} menit · ${(l.sections || []).length} bagian</span>${tools('lessons', i, n, 'modul')}</summary>
      <div class="ed-body"><div class="form-grid">${fInput('Judul modul', `lessons.${i}.title`, {max: 160, cls: 'span-2'})}${fInput('Durasi (menit)', `lessons.${i}.duration`, {num: true})}</div>
      ${fText('Pengantar', `lessons.${i}.intro`, {rows: 2, max: 2000, hint: 'Ditampilkan sebagai kotak ringkasan di awal modul.'})}
      <h4 class="ed-subhead">Isi modul</h4>${sectionsEditor(`lessons.${i}.sections`)}
      <div class="ed-item-foot"><button type="button" class="btn btn-outline" data-act="preview-lesson" data-i="${i}">Pratinjau modul</button></div></div></details>`;
  }
  function questionCard(q, i, n) {
    const key = 'Q:' + i, opts = q.options || [];
    return `<details class="ed-item" data-key="${key}" ${openKeys.has(key) ? 'open' : ''}>
      <summary><span class="ed-num">${i + 1}</span><span class="ed-title">${esc(q.q || 'Pertanyaan baru')}</span><span class="ed-meta">${q.answer === null || q.answer === undefined ? '<em class="hint-bad">jawaban belum dipilih</em>' : 'Jawaban: ' + String.fromCharCode(65 + Number(q.answer))}</span>${tools('questions', i, n, 'pertanyaan')}</summary>
      <div class="ed-body">${fText('Pertanyaan', `questions.${i}.q`, {rows: 2, max: 600})}
      <span class="ed-label">Pilihan jawaban <small>(pilih bulatan pada jawaban yang benar)</small></span>
      <div class="ed-options">${opts.map((o, j) => `<div class="ed-option"><input type="radio" name="ans-${i}" data-f="questions.${i}.answer" data-num value="${j}" ${Number(q.answer) === j && q.answer !== null ? 'checked' : ''} aria-label="Tandai pilihan ${String.fromCharCode(65 + j)} sebagai jawaban benar" /><span class="answer-letter">${String.fromCharCode(65 + j)}</span><input type="text" data-f="questions.${i}.options.${j}" value="${esc(o)}" maxlength="400" placeholder="Pilihan ${String.fromCharCode(65 + j)}" />${opts.length > 2 ? `<button type="button" class="mini mini-danger" data-act="remove-option" data-q="${i}" data-i="${j}" aria-label="Hapus pilihan">✕</button>` : ''}</div>`).join('')}
      ${opts.length < 6 ? `<button type="button" class="btn btn-subtle" data-act="add-option" data-q="${i}">+ Tambah pilihan</button>` : ''}</div>
      ${fText('Pembahasan', `questions.${i}.why`, {rows: 2, max: 2000, hint: 'Ditampilkan ke peserta setelah quiz dikumpulkan.'})}</div></details>`;
  }
  function renderEditor() {
    destroyRtes();
    const {kind, draft: d, status} = editor, K = KIND[kind];
    let body = '';
    if (kind === 'course') {
      body = `<section class="ed-card"><h2>Informasi course</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori', 'category', {max: 60, list: 'cat-list'})}${fSelect('Level', 'level', LEVELS)}${fSelect('Warna kartu', 'color', COLORS)}${fSelect('Ilustrasi', 'art', ARTS)}</div>${fText('Deskripsi', 'description', {rows: 2, max: 500})}${catList()}</section>
        <section class="ed-card"><div class="ed-card-head"><h2>Modul <span class="count">${d.lessons.length}</span></h2><small>Durasi course dihitung otomatis: ${d.lessons.reduce((n, l) => n + (Number(l.duration) || 0), 0)} menit</small></div>
        ${d.lessons.map((l, i) => lessonCard(l, i, d.lessons.length)).join('')}<button type="button" class="btn btn-subtle" data-act="add-lesson">+ Tambah modul</button></section>`;
    } else if (kind === 'quiz') {
      const courses = items.filter(i => i.kind === 'course');
      body = `<section class="ed-card"><h2>Informasi quiz</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori', 'category', {max: 60, list: 'cat-list'})}${fInput('Estimasi (menit)', 'minutes', {num: true})}${fSelect('Warna kartu', 'color', COLORS)}${fSelect('Course terkait', 'course', [['', '— Tidak ada —'], ...courses.map(c => [c.id, c.title + (c.status === 'draft' ? ' (belum tayang)' : '')])])}</div>${fText('Deskripsi', 'description', {rows: 2, max: 500})}${catList()}<p class="ed-note">Nilai lulus latihan: 80. Peserta bisa mengulang tanpa batas.</p></section>
        <section class="ed-card"><div class="ed-card-head"><h2>Pertanyaan <span class="count">${d.questions.length}</span></h2></div>${d.questions.map((q, i) => questionCard(q, i, d.questions.length)).join('')}<button type="button" class="btn btn-subtle" data-act="add-question">+ Tambah pertanyaan</button></section>`;
    } else {
      body = `<section class="ed-card"><h2>Informasi artikel</h2><div class="form-grid">${fInput('Judul', 'title', {max: 140, cls: 'span-2'})}${fInput('Kategori / topik', 'category', {max: 60, list: 'cat-list'})}${fInput('Estimasi baca (menit)', 'minutes', {num: true})}${fSelect('Warna kartu', 'color', COLORS)}${fSelect('Ilustrasi', 'art', ARTS)}</div>${fText('Ringkasan pembuka', 'description', {rows: 2, max: 500})}
        <label class="check"><input type="checkbox" data-f="featured" data-bool ${d.featured ? 'checked' : ''} /> Jadikan Editor's Pick di Knowledge Center</label>${catList()}</section>
        <section class="ed-card"><div class="ed-card-head"><h2>Isi artikel</h2></div>${sectionsEditor('sections')}<div class="ed-item-foot"><button type="button" class="btn btn-outline" data-act="preview-article">Pratinjau artikel</button></div></section>`;
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
      hint.textContent = id === null ? 'Link YouTube tidak dikenali.' : id ? 'Video terdeteksi ✓' : 'Opsional. Tempel link video YouTube.';
      hint.className = id === null ? 'hint-bad' : id ? 'hint-ok' : '';
      setPath(editor.draft, p, v.trim() ? {url: v.trim()} : undefined);
    } else setPath(editor.draft, p, v);
    markDirty();
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
  function previewSections(sections) {
    return (sections || []).map(s => {
      const paras = `<div class="rich">${sectionHtml(s)}</div>`; // HTML dari editor (sudah disaring server saat disimpan)
      const v = s.video ? ytId(s.video.url ?? s.video.youtubeId) : '';
      return `<section class="content-section">${s.heading ? `<h4>${esc(s.heading)}</h4>` : ''}${paras}${s.image?.url ? `<figure class="content-media"><img src="${esc(s.image.url)}" alt="${esc(s.image.alt)}" />${s.image.caption ? `<figcaption>${esc(s.image.caption)}</figcaption>` : ''}</figure>` : ''}${v ? `<div class="content-video"><iframe src="https://www.youtube-nocookie.com/embed/${v}" title="Video" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : ''}</section>`;
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
  async function renderUsers() {
    users = (await api.get('/api/admin/users')).users;
    main.innerHTML = `<div class="content-fade">${heading('Kelola akses', 'Peserta', 'Undang karyawan maupun freelancer memakai email apa pun. Peserta menerima email untuk membuat password.', '<button class="btn btn-orange" data-act="invite">+ Undang peserta</button>')}
      <div class="filters"><label class="filter-search"><input id="user-search" placeholder="Cari nama atau email…" value="${esc(userQuery)}" aria-label="Cari peserta" /></label>
      <span class="results-count" id="user-count"></span></div>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>Peserta</th><th>Role</th><th>Status</th><th>Progres</th><th>Terakhir aktif</th><th class="col-actions">Aksi</th></tr></thead><tbody id="user-rows"></tbody></table></div></div>`;
    renderUserRows();
  }
  function renderUserRows() {
    const q = userQuery.toLowerCase(), list = users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(q));
    $('#user-count').textContent = `${users.length} akun · ${users.filter(u => u.role === 'admin').length} admin`;
    $('#user-rows').innerHTML = list.map(u => {
      const self = u.id === me.id;
      return `<tr><td><button class="row-title linkish" data-act="user-detail" data-id="${u.id}">${esc(u.name)}${self ? ' <small class="you">(kamu)</small>' : ''}</button><small>${esc(u.email)}</small></td>
        <td>${u.role === 'admin' ? badge(['Admin', 'st-admin']) : 'Peserta'}</td><td>${badge(USTATUS[u.status])}</td>
        <td>${u.lessonsCompleted} modul · ${u.quizzesPassed} quiz lulus</td><td><span class="when">${fmtDate(u.lastActivity || u.lastSignInAt)}</span></td>
        <td class="col-actions"><a class="btn btn-outline" href="#raport/${u.id}">Raport</a>${self ? '' : `
          ${u.status === 'invited' ? `<button class="btn btn-outline" data-act="resend" data-id="${u.id}">Kirim ulang undangan</button>` : ''}
          <button class="btn btn-outline" data-act="set-role" data-id="${u.id}" data-role="${u.role === 'admin' ? 'learner' : 'admin'}">${u.role === 'admin' ? 'Jadikan peserta' : 'Jadikan admin'}</button>
          <button class="btn btn-outline ${u.status === 'disabled' ? '' : 'btn-danger-text'}" data-act="set-status" data-id="${u.id}" data-status="${u.status === 'disabled' ? 'active' : 'disabled'}">${u.status === 'disabled' ? 'Aktifkan' : 'Nonaktifkan'}</button>`}</td></tr>`;
    }).join('') || '<tr><td colspan="6" class="empty-row">Tidak ada peserta yang cocok.</td></tr>';
  }
  main.addEventListener('input', e => {if (e.target.id === 'user-search') {userQuery = e.target.value; renderUserRows();}});
  function inviteDialog() {
    showModal('Undang peserta', `<form id="invite-form" class="admin-form">
      <label>Nama lengkap<input name="name" required minlength="2" maxlength="80" autocomplete="off" /></label>
      <label>Email<input name="email" type="email" required maxlength="254" autocomplete="off" placeholder="nama@contoh.com" /><small>Boleh email pribadi untuk freelancer atau staf kontrak.</small></label>
      <label>Role<select name="role"><option value="learner">Peserta</option><option value="admin">Admin (bisa kelola materi & peserta)</option></select></label>
      <div class="form-error" role="alert"></div>
      <div class="confirm-actions"><button type="button" class="btn btn-outline" data-act="close-modal">Batal</button><button class="btn btn-orange" type="submit">Kirim undangan</button></div></form>`);
    $('#invite-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Mengirim…';
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

  // ---------- laporan ----------
  let report = null;
  async function renderReport() {
    report = await api.get('/api/admin/report');
    const active30 = report.users.filter(u => u.lastActivity && Date.now() - new Date(u.lastActivity) < 30 * 864e5).length;
    const learners = report.users.filter(u => u.status !== 'disabled').length;
    const avg = report.courses.length ? Math.round(report.courses.reduce((s, c) => s + c.avgProgress, 0) / report.courses.length) : 0;
    const passed = report.quizzes.reduce((s, q) => s + q.passed, 0);
    main.innerHTML = `<div class="content-fade">${heading('Pantau perkembangan', 'Laporan', `Data per ${fmtDate(report.generatedAt)}. Hanya materi yang sedang tayang yang dihitung.`, '<button class="btn btn-outline" data-act="csv">Unduh CSV peserta</button>')}
      <section class="stats-grid">${[['Akun aktif', learners, 'termasuk yang belum aktivasi'], ['Aktif 30 hari terakhir', active30, 'menyelesaikan modul atau quiz'], ['Rata-rata progres course', avg + '%', 'dari peserta yang mengikuti'], ['Quiz lulus', passed, 'kombinasi peserta × quiz, skor ≥ 80']].map(([l, v, n]) => `<div class="stat-card"><div><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-trend">${n}</div></div></div>`).join('')}</section>
      <h2 class="report-h">Course</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Course</th><th>Modul</th><th>Diikuti</th><th>Selesai</th><th>Rata-rata progres</th></tr></thead><tbody>
      ${report.courses.map(c => `<tr><td>${esc(c.title)}</td><td>${c.lessons}</td><td>${c.enrolled}</td><td>${c.completed}</td><td><div class="progress-row inline"><div class="progress-track"><span style="width:${c.avgProgress}%"></span></div><b>${c.avgProgress}%</b></div></td></tr>`).join('') || '<tr><td colspan="5" class="empty-row">Belum ada course tayang.</td></tr>'}</tbody></table></div>
      <h2 class="report-h">Quiz</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Quiz</th><th>Peserta</th><th>Lulus</th><th>Rata-rata skor terbaik</th><th>Total percobaan</th></tr></thead><tbody>
      ${report.quizzes.map(q => `<tr><td>${esc(q.title)}</td><td>${q.takers}</td><td>${q.passed}</td><td>${q.avgBest ?? '—'}</td><td>${q.attempts}</td></tr>`).join('') || '<tr><td colspan="5" class="empty-row">Belum ada quiz tayang.</td></tr>'}</tbody></table></div></div>`;
  }
  function downloadCsv() {
    const cell = v => {const s = String(v ?? ''); return /[",\n;]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""')}"` : s;};
    const rows = [['Nama', 'Email', 'Role', 'Status', 'Course diikuti', 'Modul selesai', 'Quiz lulus', 'Terakhir aktif', 'Terakhir login'],
      ...report.users.map(u => [u.name, u.email, u.role === 'admin' ? 'Admin' : 'Peserta', USTATUS[u.status][0], u.coursesEnrolled, u.lessonsCompleted, u.quizzesPassed, u.lastActivity ? fmtDate(u.lastActivity) : '', u.lastSignInAt ? fmtDate(u.lastSignInAt) : ''])];
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `learning-hub-peserta-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
        case 'add-question': d.questions.push({q: '', options: ['', '', '', ''], answer: null, why: ''}); openKeys.add('Q:' + (d.questions.length - 1)); markDirty(); renderEditor(); break;
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
          const arr = getPath(d, b.dataset.arr), i = Number(b.dataset.i), what = b.dataset.arr === 'lessons' ? 'modul' : b.dataset.arr === 'questions' ? 'pertanyaan' : 'bagian';
          const filled = JSON.stringify(arr[i]).replace(/"(id|duration|answer)":[^,}]*/g, '').match(/:"[^"]+"/);
          if (filled && !await confirmBox(`Hapus ${what} ini beserta isinya?`, 'Hapus', true)) break;
          arr.splice(i, 1); if (b.dataset.arr === 'questions') openKeys.clear(); markDirty(); renderEditor(); break;
        }
        case 'upload-image': await uploadImage(b.dataset.path, b); break;
        case 'remove-image': setPath(d, b.dataset.path + '.image', undefined); markDirty(); renderEditor(); break;
        case 'preview-lesson': {
          const i = Number(b.dataset.i), l = d.lessons[i];
          const outline = `<aside class="learn-outline"><div class="outline-head"><span class="back-link">Pratinjau draft</span><h2>${esc(d.title || 'Course tanpa judul')}</h2></div><ol class="outline-list">${d.lessons.map((x, j) => `<li><button type="button" class="outline-item ${j === i ? 'current' : ''}" data-act="preview-lesson" data-i="${j}"><span class="outline-dot">${j + 1}</span><span>${esc(x.title || 'Modul tanpa judul')}<small>${Number(x.duration) || 0} menit</small></span></button></li>`).join('')}</ol></aside>`;
          showModal('Pratinjau modul — tampilan peserta', `<div class="preview-stage"><div class="learn-layout">${outline}<article class="learn-main lesson-content"><div class="modal-kicker">${esc(d.category)} · Modul ${i + 1} dari ${d.lessons.length} · ${Number(l.duration) || 0} menit</div><h1 class="learn-title">${esc(l.title || 'Modul tanpa judul')}</h1>${l.intro ? `<p class="lead">${esc(l.intro)}</p>` : ''}${previewSections(l.sections)}<div class="lesson-actions"><span class="sample-note">Pratinjau draft — peserta baru melihatnya setelah Publish.</span></div></article></div></div>`, 'full');
          break;
        }
        case 'preview-article':
          showModal('Pratinjau artikel — tampilan peserta', `<div class="preview-stage"><div class="page-narrow"><article class="article-reader page-card"><div class="modal-kicker">${esc(d.category)}</div><h1>${esc(d.title)}</h1><div class="reader-meta"><span>SPUN Learning Team</span><span>${Number(d.minutes) || 0} menit baca</span></div><p class="reader-lead">${esc(d.description)}</p>${previewSections(d.sections)}<p class="sample-note">Pratinjau draft — peserta baru melihatnya setelah Publish.</p></article></div></div>`, 'full');
          break;
        case 'invite': inviteDialog(); break;
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
      }
    } catch (err) {toast(err.message || 'Aksi gagal. Coba lagi.', true); if (b.isConnected) b.disabled = false;}
  });
  $('#mobile-scrim').addEventListener('click', () => {$('#sidebar').classList.remove('open'); $('#mobile-scrim').classList.remove('visible');});
  modal.addEventListener('click', e => {if (e.target === modal) closeModal();});

  route();
})();
