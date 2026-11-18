// Model konten LMS (course, quiz, artikel): normalisasi, validasi draft (longgar) dan publish (ketat).
// Konten disimpan sebagai JSON di tabel content_items (kolom draft & published).
import {HttpError} from './http.mjs';
import {sanitizeRich, plainToHtml, hasRichContent} from './rich.mjs';

export const KINDS = ['course', 'quiz', 'article'];
export const COLORS = ['peach', 'sage', 'lavender', 'blue', 'sand', 'pink'];
export const ARTS = ['conversation', 'listening', 'quality', 'journey', 'documents', 'ownership', 'growth'];
export const LEVELS = ['Fundamental', 'Intermediate', 'Advanced'];
export const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
export const MEDIA_BUCKET = 'lms-media';

const bad = message => {throw new HttpError(422, message);};
const str = (v, max, label) => {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') bad(`${label} harus berupa teks.`);
  const s = v.replace(/\r\n?/g, '\n').trim();
  if (s.length > max) bad(`${label} maksimal ${max} karakter.`);
  return s;
};
const int = (v, min, max, label, fallback) => {
  if (v === '' || v === undefined || v === null) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) bad(`${label} harus angka bulat ${min}–${max}.`);
  return n;
};
const pick = (v, list, fallback) => list.includes(v) ? v : fallback;
const arr = (v, max, label) => {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) bad(`${label} tidak valid.`);
  if (v.length > max) bad(`${label} maksimal ${max} item.`);
  return v;
};

export function youtubeId(input) {
  if (!input) return '';
  const s = String(input).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let url; try {url = new URL(s);} catch {return null;}
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (['youtube.com', 'youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/); id = m?.[1];}
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

// Gambar hanya boleh dari bucket Storage milik proyek ini (juga dibatasi CSP img-src).
export const mediaPrefix = supabaseUrl => `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/`;

function section(s, i, label, ctx) {
  const where = `${label}, bagian ${i + 1}`;
  if (Array.isArray(s)) s = {heading: s[0], body: s[1]}; // format lama [judul, isi]
  if (!s || typeof s !== 'object') bad(`${where} tidak valid.`);
  const raw = typeof s.html === 'string' ? s.html : plainToHtml(str(s.body, 10000, `${where}: isi`));
  if (raw.length > 200000) bad(`${where}: isi terlalu panjang. Bagi menjadi beberapa bagian.`);
  const out = {heading: str(s.heading, 160, `${where}: judul`), html: sanitizeRich(raw, {mediaPrefix: mediaPrefix(ctx.supabaseUrl)})};
  const imageUrl = str(s.image?.url ?? s.imageUrl, 600, `${where}: URL gambar`);
  if (imageUrl) {
    if (!imageUrl.startsWith(mediaPrefix(ctx.supabaseUrl)) || /["'<>\s]/.test(imageUrl)) bad(`${where}: gambar harus diunggah lewat tombol Unggah gambar.`);
    out.image = {url: imageUrl, alt: str(s.image?.alt ?? s.imageAlt, 200, `${where}: teks alternatif gambar`), caption: str(s.image?.caption, 200, `${where}: keterangan gambar`)};
  }
  const rawVideo = s.video?.youtubeId ?? s.video?.url ?? s.videoUrl ?? '';
  if (rawVideo) {
    const id = youtubeId(rawVideo);
    if (!id) bad(`${where}: link YouTube tidak dikenali.`);
    out.video = {youtubeId: id, title: str(s.video?.title, 160, `${where}: judul video`)};
  }
  return out;
}

function lessonIdFor(raw, used) {
  let id = typeof raw === 'string' && ID_RE.test(raw) ? raw : '';
  while (!id || used.has(id)) id = 'm' + Math.random().toString(36).slice(2, 10);
  used.add(id);
  return id;
}

export function normalize(kind, d, ctx) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) bad('Isi konten tidak valid.');
  const base = {
    title: str(d.title, 140, 'Judul'),
    category: str(d.category, 60, 'Kategori'),
    description: str(d.description, 500, 'Deskripsi'),
    color: pick(d.color, COLORS, 'peach')
  };
  if (kind === 'course') {
    const used = new Set();
    const lessons = arr(d.lessons, 60, 'Modul').map((l, i) => {
      if (!l || typeof l !== 'object') bad(`Modul ${i + 1} tidak valid.`);
      return {
        id: lessonIdFor(l.id, used),
        title: str(l.title, 160, `Modul ${i + 1}: judul`),
        duration: int(l.duration, 1, 600, `Modul ${i + 1}: durasi`, 5),
        intro: str(l.intro, 2000, `Modul ${i + 1}: pengantar`),
        sections: arr(l.sections, 40, `Modul ${i + 1}: bagian`).map((s, j) => section(s, j, `Modul ${i + 1}`, ctx))
      };
    });
    return {...base, level: pick(d.level, LEVELS, 'Fundamental'), art: pick(d.art, ARTS, 'conversation'), lessons};
  }
  if (kind === 'quiz') {
    const questions = arr(d.questions, 60, 'Pertanyaan').map((q, i) => {
      if (!q || typeof q !== 'object') bad(`Pertanyaan ${i + 1} tidak valid.`);
      const options = arr(q.options, 6, `Pertanyaan ${i + 1}: pilihan`).map((o, j) => str(o, 400, `Pertanyaan ${i + 1}: pilihan ${String.fromCharCode(65 + j)}`));
      const answer = q.answer === null || q.answer === undefined || q.answer === '' ? null : Number(q.answer);
      if (answer !== null && (!Number.isInteger(answer) || answer < 0 || answer >= Math.max(options.length, 1))) bad(`Pertanyaan ${i + 1}: jawaban benar tidak valid.`);
      return {q: str(q.q, 600, `Pertanyaan ${i + 1}`), options, answer, why: str(q.why, 2000, `Pertanyaan ${i + 1}: pembahasan`)};
    });
    const course = typeof d.course === 'string' && ID_RE.test(d.course) ? d.course : '';
    return {...base, minutes: int(d.minutes, 1, 300, 'Estimasi menit', 5), course, questions};
  }
  if (kind === 'article') {
    return {
      ...base, art: pick(d.art, ARTS, 'conversation'),
      minutes: int(d.minutes, 1, 300, 'Estimasi menit baca', 5),
      featured: d.featured === true,
      sections: arr(d.sections, 40, 'Bagian artikel').map((s, j) => section(s, j, 'Artikel', ctx))
    };
  }
  bad('Jenis konten tidak dikenal.');
}

// Aturan tambahan sebelum tayang. Mengembalikan versi publish (field turunan dihitung).
export function forPublish(kind, d) {
  const need = (cond, msg) => {if (!cond) bad(msg);};
  need(d.title, 'Judul wajib diisi sebelum publish.');
  need(d.category, 'Kategori wajib diisi sebelum publish.');
  need(d.description, 'Deskripsi wajib diisi sebelum publish.');
  if (kind === 'course') {
    need(d.lessons.length, 'Course butuh minimal 1 modul sebelum publish.');
    d.lessons.forEach((l, i) => {
      need(l.title, `Modul ${i + 1}: judul wajib diisi.`);
      need(l.intro || l.sections.length, `Modul ${i + 1}: isi pengantar atau minimal 1 bagian.`);
      l.sections.forEach((s, j) => need(s.heading || hasRichContent(s.html) || s.image || s.video, `Modul ${i + 1}, bagian ${j + 1} masih kosong.`));
    });
    return {...d, label: d.category.toUpperCase(), minutes: d.lessons.reduce((n, l) => n + l.duration, 0)};
  }
  if (kind === 'quiz') {
    need(d.questions.length, 'Quiz butuh minimal 1 pertanyaan sebelum publish.');
    d.questions.forEach((q, i) => {
      need(q.q, `Pertanyaan ${i + 1}: teks pertanyaan wajib diisi.`);
      need(q.options.length >= 2 && q.options.every(Boolean), `Pertanyaan ${i + 1}: isi minimal 2 pilihan dan jangan biarkan pilihan kosong.`);
      need(q.answer !== null && q.answer < q.options.length, `Pertanyaan ${i + 1}: pilih jawaban yang benar.`);
    });
    return d;
  }
  need(d.sections.length, 'Artikel butuh minimal 1 bagian sebelum publish.');
  return d;
}

const ESC = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
// Frontend peserta menyisipkan konten sebagai HTML; semua teks di-escape di server agar aman.
// Pengecualian: kolom `html` sudah disaring ketat oleh sanitizeRich saat disimpan.
export const escapeDeep = v => typeof v === 'string' ? v.replace(/[&<>"']/g, c => ESC[c])
  : Array.isArray(v) ? v.map(escapeDeep)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'html' && typeof x === 'string' ? x : escapeDeep(x)])) : v;

export function slugify(title) {
  const s = String(title || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  return s.length >= 2 ? s : 'konten';
}
