// Tampilan raport pembelajaran — dipakai bersama oleh aplikasi peserta (Raport saya) dan panel admin.
// Data dari API berupa teks mentah, jadi SEMUA teks di-escape di sini.
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const TZ = 'Asia/Jakarta';
  const fmtDay = v => v ? new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ}).format(new Date(v)) : '—';
  const fmtDayKey = k => k ? new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(k + 'T00:00:00Z')) : '';
  const fmtWeek = k => new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'short', timeZone: 'UTC'}).format(new Date(k + 'T00:00:00Z'));
  const fmtMinutes = m => m >= 60 ? `${Math.floor(m / 60)} jam${m % 60 ? ` ${m % 60} mnt` : ''}` : `${m} menit`;
  const todayKey = () => new Intl.DateTimeFormat('sv-SE', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
  const shift = (key, {days = 0, months = 0}) => {const d = new Date(key + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + months); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);};

  const PRESETS = [['all', 'Seluruh waktu'], ['this-month', 'Bulan ini'], ['last-month', 'Bulan lalu'], ['3m', '3 bulan terakhir'], ['this-year', 'Tahun ini'], ['custom', 'Rentang tanggal…']];
  function range(preset, custom = {}) {
    const t = todayKey(), y = t.slice(0, 4), ym = t.slice(0, 7);
    switch (preset) {
      case 'this-month': return {from: ym + '-01', to: t};
      case 'last-month': {const first = shift(ym + '-01', {months: -1}); return {from: first, to: shift(ym + '-01', {days: -1})};}
      case '3m': return {from: shift(t, {months: -3, days: 1}), to: t};
      case 'this-year': return {from: y + '-01-01', to: t};
      case 'custom': return {from: custom.from || '', to: custom.to || ''};
      default: return {from: '', to: ''};
    }
  }
  const query = r => {const q = new URLSearchParams(); if (r.from) q.set('from', r.from); if (r.to) q.set('to', r.to); const s = q.toString(); return s ? '?' + s : '';};
  const periodLabel = p => !p.from && !p.to ? 'Seluruh waktu' : `${p.from ? fmtDayKey(p.from) : 'Awal'} – ${p.to ? fmtDayKey(p.to) : 'hari ini'}`;

  function controls(state) {
    return `<div class="raport-controls" role="group" aria-label="Pengaturan raport">
      <label>Periode <select data-raport="preset">${PRESETS.map(([v, l]) => `<option value="${v}" ${state.preset === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <span class="raport-custom" ${state.preset === 'custom' ? '' : 'hidden'}><label>Dari <input type="date" data-raport="from" value="${esc(state.custom?.from || '')}" /></label><label>Sampai <input type="date" data-raport="to" value="${esc(state.custom?.to || '')}" /></label></span>
      <button type="button" class="btn btn-outline" data-raport="print">Unduh PDF</button>
    </div>`;
  }

  function chart(weekly) {
    const weeks = weekly.weeks, max = Math.max(0, ...weeks.map(w => w.minutes));
    if (!weeks.length || max === 0) return `<div class="raport-empty">Belum ada modul yang diselesaikan pada periode ini.</div>`;
    const narrow = typeof window !== 'undefined' && window.innerWidth < 720 && !window.matchMedia?.('print').matches;
    const W = narrow ? Math.max(300, window.innerWidth - 70) : 720, H = narrow ? 180 : 200, padL = 40, padR = 8, padT = 12, padB = 26, plotW = W - padL - padR, plotH = H - padT - padB;
    const step = [5, 10, 15, 30, 60, 120, 180, 300].find(s => max / s <= 4) || Math.ceil(max / 4 / 60) * 60;
    const top = Math.ceil(max / step) * step, y = v => padT + plotH - v / top * plotH;
    const slot = plotW / weeks.length, bw = Math.max(3, Math.min(28, slot - 2)), every = Math.ceil(weeks.length / (narrow ? 4 : 8));
    const grid = []; for (let v = 0; v <= top; v += step) grid.push(`<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" class="rp-grid${v === 0 ? ' rp-base' : ''}"/><text x="${padL - 6}" y="${y(v) + 3.5}" class="rp-tick" text-anchor="end">${v}</text>`);
    const bars = weeks.map((w, i) => {
      const x = padL + i * slot + (slot - bw) / 2, h = w.minutes / top * plotH, label = `Minggu ${fmtWeek(w.week)}: ${w.minutes} menit, ${w.lessons} modul, ${w.quizzes} quiz`;
      const r = Math.min(4, bw / 2, h);
      const bar = h > 0 ? `<path class="rp-bar" d="M${x},${padT + plotH} V${padT + plotH - h + r} Q${x},${padT + plotH - h} ${x + r},${padT + plotH - h} H${x + bw - r} Q${x + bw},${padT + plotH - h} ${x + bw},${padT + plotH - h + r} V${padT + plotH} Z"/>` : '';
      return `<g class="rp-col" tabindex="0" data-tip="${esc(label)}"><rect class="rp-hit" x="${padL + i * slot}" y="${padT}" width="${slot}" height="${plotH}"/>${bar}<title>${esc(label)}</title>${i % every === 0 ? `<text x="${x + bw / 2}" y="${H - 8}" class="rp-tick" text-anchor="middle">${fmtWeek(w.week)}</text>` : ''}</g>`;
    }).join('');
    return `<figure class="raport-chart"><div class="rp-chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Menit belajar per minggu">${grid.join('')}${bars}</svg><div class="rp-tip" hidden></div></div>
      <figcaption>Menit belajar per minggu (dari durasi modul yang diselesaikan)${weekly.truncated ? ' · menampilkan 26 minggu terakhir periode' : ''}</figcaption>
      <details class="rp-table"><summary>Lihat sebagai tabel</summary><table><thead><tr><th>Minggu mulai</th><th>Menit</th><th>Modul</th><th>Quiz dikerjakan</th></tr></thead><tbody>${weeks.map(w => `<tr><td>${fmtWeek(w.week)}</td><td>${w.minutes}</td><td>${w.lessons}</td><td>${w.quizzes}</td></tr>`).join('')}</tbody></table></details></figure>`;
  }

  function html(d, {logo = 'assets/spun-logo.png'} = {}) {
    const s = d.summary;
    const tile = (label, value, note) => `<div class="rp-tile"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
    const status = q => q.best === null ? '<span class="rp-status pending"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4v4.5l3 1.5"/><circle cx="8" cy="8" r="6"/></svg>Menunggu penilaian</span>' : q.passed ? '<span class="rp-status pass"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>Lulus</span>' : '<span class="rp-status pending"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4v4.5l3 1.5"/><circle cx="8" cy="8" r="6"/></svg>Belum lulus</span>';
    return `<article class="raport">
      <header class="raport-head"><img src="${esc(logo)}" alt="SPUN" class="rp-logo"/><div class="rp-title"><span class="rp-kicker">Raport Pembelajaran</span><h1>${esc(d.user.name)}</h1><p>${esc(d.user.email)}${d.user.role === 'admin' ? ' · Admin' : ''}</p></div>
        <dl class="rp-meta"><div><dt>Periode</dt><dd>${esc(periodLabel(d.period))}</dd></div><div><dt>Bergabung</dt><dd>${fmtDay(d.user.joinedAt)}</dd></div><div><dt>Terakhir aktif</dt><dd>${fmtDay(d.user.lastActivity)}</dd></div><div><dt>Dibuat</dt><dd>${fmtDay(d.generatedAt)}</dd></div></dl></header>
      <section class="rp-tiles">
        ${tile('Course selesai', `${s.coursesCompleted}<em>/${s.coursesFollowed}</em>`, `dari course yang diikuti · ${s.coursesAvailable} tersedia`)}
        ${tile('Modul selesai', s.lessonsCompleted, 'pada periode ini')}
        ${tile('Waktu belajar', esc(fmtMinutes(s.minutes)), 'estimasi dari durasi modul')}
        ${tile('Quiz lulus', `${s.quizzesPassed}<em>/${s.quizzesAttempted}</em>`, s.quizzesPending ? `dari quiz yang dikerjakan · ${s.quizzesPending} menunggu penilaian` : 'dari quiz yang dikerjakan')}
        ${tile('Rata-rata skor terbaik', s.avgBest ?? '—', 'skor 0–100 per quiz')}
        ${tile('Artikel dibaca', s.articlesRead, 'pada periode ini')}
      </section>
      <section class="rp-section"><h2>Aktivitas belajar</h2>${chart(d.weekly)}</section>
      <section class="rp-section"><h2>Course</h2>${d.courses.length ? `<div class="rp-table-wrap"><table class="rp-data"><thead><tr><th>Course</th><th>Progres</th><th>Modul</th><th>Mulai</th><th>Selesai</th><th>Modul di periode ini</th></tr></thead><tbody>
        ${d.courses.map(c => `<tr><td><strong>${esc(c.title)}</strong><small>${esc(c.category)}</small></td><td><div class="rp-progress"><span class="rp-track"><span style="width:${c.percent}%"></span></span><b>${c.percent}%</b></div></td><td>${c.done}/${c.total}</td><td>${fmtDay(c.startedAt)}</td><td>${c.completedAt ? fmtDay(c.completedAt) : '—'}</td><td>${c.lessonsInPeriod}</td></tr>`).join('')}</tbody></table></div>` : '<div class="raport-empty">Belum mengikuti course pada periode ini.</div>'}</section>
      <section class="rp-section"><h2>Quiz</h2>${d.quizzes.length ? `<div class="rp-table-wrap"><table class="rp-data"><thead><tr><th>Quiz</th><th>Skor terbaik</th><th>Skor terakhir</th><th>Percobaan</th><th>Status</th><th>Terakhir dikerjakan</th></tr></thead><tbody>
        ${d.quizzes.map(q => `<tr><td><strong>${esc(q.title)}</strong><small>${esc(q.category)}</small></td><td><b>${q.best ?? '—'}</b></td><td>${q.last ?? '—'}</td><td>${q.attempts}${q.pending ? `<small>${q.pending} menunggu penilaian</small>` : ''}</td><td>${status(q)}</td><td>${fmtDay(q.lastAt)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="raport-empty">Belum ada quiz yang dikerjakan pada periode ini.</div>'}</section>
      <section class="rp-section"><h2>Artikel dibaca</h2>${d.articles.length ? `<ul class="rp-articles">${d.articles.map(a => `<li><span>${esc(a.title)}</span><small>${esc(a.category)} · ${fmtDay(a.readAt)}</small></li>`).join('')}</ul>` : '<div class="raport-empty">Belum ada artikel yang ditandai dibaca pada periode ini.</div>'}</section>
      <footer class="rp-foot">Status lulus: skor terbaik ≥ 80. Angka modul, quiz, waktu belajar, dan artikel dihitung dalam periode yang dipilih; progres course dihitung kumulatif sampai akhir periode. Waktu belajar adalah estimasi dari durasi modul, bukan waktu layar.</footer>
    </article>`;
  }

  // Tooltip grafik (hover/fokus) — dipasang sekali per halaman.
  function bindTooltips(root) {
    root.addEventListener('pointerover', show); root.addEventListener('focusin', show);
    root.addEventListener('pointerout', hide); root.addEventListener('focusout', hide);
    function show(e) {
      const col = e.target.closest?.('.rp-col'); if (!col) return;
      const wrap = col.closest('.rp-chart-wrap'), tip = wrap.querySelector('.rp-tip'), box = col.querySelector('.rp-hit').getBoundingClientRect(), w = wrap.getBoundingClientRect();
      tip.textContent = col.dataset.tip; tip.hidden = false;
      const left = Math.min(Math.max(box.left - w.left + box.width / 2, 80), w.width - 80);
      tip.style.left = left + 'px'; tip.style.top = '0px'; col.classList.add('on');
    }
    function hide(e) {const col = e.target.closest?.('.rp-col'); if (!col) return; col.classList.remove('on'); const tip = col.closest('.rp-chart-wrap').querySelector('.rp-tip'); tip.hidden = true;}
  }

  window.HubRaport = {html, controls, range, query, bindTooltips, PRESETS};
})();
