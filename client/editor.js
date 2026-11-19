// Editor teks kolom "Isi" (panel admin). Di-bundle menjadi public/editor.js → window.HubEditor.
import {Editor, Extension} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TextStyle, FontFamily, FontSize, Color, BackgroundColor} from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import {TableKit} from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';

const FONTS = [['', 'Font standar'], ['Manrope, sans-serif', 'Manrope'], ['Georgia, serif', 'Georgia (serif)'], ['"Courier New", monospace', 'Courier New']];
const SIZES = [['', 'Normal'], ['13px', 'Kecil'], ['18px', 'Besar'], ['22px', 'Sangat besar']];
const COLORS = [['', 'Warna standar'], ['#d16527', 'Oranye'], ['#b74c34', 'Merah'], ['#2f6b45', 'Hijau'], ['#2f5d8a', 'Biru'], ['#6f7a6d', 'Abu-abu']];
const MARKS = [['', 'Tanpa highlight'], ['#fff3b0', 'Kuning'], ['#e3f2dc', 'Hijau muda'], ['#dfeaf6', 'Biru muda'], ['#ffe3d0', 'Peach']];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// Indent paragraf (1–4 tingkat). Di dalam list, indent = sub-list.
const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [{types: ['paragraph'], attributes: {indent: {default: 0,
      parseHTML: el => Math.min(4, Math.max(0, Number(el.getAttribute('data-indent')) || 0)),
      renderHTML: a => a.indent ? {'data-indent': String(a.indent)} : {}}}}];
  },
  addCommands() {
    // Perintah TipTap: ubah `tr` bersama saja; TipTap yang mengirim transaksinya.
    const change = d => ({editor, tr, dispatch, commands}) => {
      if (editor.isActive('listItem')) return d > 0 ? commands.sinkListItem('listItem') : commands.liftListItem('listItem');
      let changed = false;
      tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, pos) => {
        if (node.type.name !== 'paragraph') return;
        const next = Math.min(4, Math.max(0, (node.attrs.indent || 0) + d));
        if (next !== node.attrs.indent) {if (dispatch) tr.setNodeMarkup(pos, undefined, {...node.attrs, indent: next}); changed = true;}
      });
      return changed;
    };
    return {indentMore: () => change(1), indentLess: () => change(-1)};
  }
});

const SizedImage = Image.extend({
  addAttributes() {
    return {...this.parent?.(), size: {default: 'l', parseHTML: el => ['s', 'm', 'l'].includes(el.getAttribute('data-size')) ? el.getAttribute('data-size') : 'l', renderHTML: a => ({'data-size': a.size})}};
  }
});

const I = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  ol: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 6h1v4M4 10h2M4 14.5c0-.8.7-1.5 1.5-1.5S7 13.7 7 14.5c0 1.5-3 1.5-3 3.5h3"/>',
  left: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', center: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  right: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>', justify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  outdent: '<path d="M21 6H11M21 12H11M21 18H11"/><path d="m7 9-3 3 3 3"/>', indent: '<path d="M21 6H11M21 12H11M21 18H11"/><path d="m4 9 3 3-3 3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  quote: '<path d="M6 17c-1.5 0-3-1.2-3-3.5C3 10 5 7 8 6M15 17c-1.5 0-3-1.2-3-3.5C12 10 14 7 17 6"/>', hr: '<path d="M3 12h18"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  video: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="m10 9.5 4.5 2.5-4.5 2.5z"/>',
  clear: '<path d="M4 7V5h12v2M10 5l-3 14M5 19h6"/><path d="m15 14 6 6M21 14l-6 6"/>'
};
const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const btn = (cmd, label, inner, extra = '') => `<button type="button" class="rte-btn" data-cmd="${cmd}" title="${label}" aria-label="${label}" ${extra}>${inner}</button>`;
const sel = (cmd, label, opts) => `<select class="rte-select" data-cmd="${cmd}" title="${label}" aria-label="${label}">${opts.map(([v, l]) => `<option value="${v.replace(/"/g, '&quot;')}">${l}</option>`).join('')}</select>`;

function toolbarHtml() {
  return `<div class="rte-row">
    ${btn('undo', 'Urungkan (Ctrl+Z)', svg('undo'))}${btn('redo', 'Ulangi (Ctrl+Y)', svg('redo'))}<span class="rte-sep"></span>
    ${sel('font', 'Jenis font', FONTS)}${sel('size', 'Ukuran font', SIZES)}<span class="rte-sep"></span>
    ${btn('bold', 'Tebal (Ctrl+B)', '<b>B</b>')}${btn('italic', 'Miring (Ctrl+I)', '<i>I</i>')}${btn('underline', 'Garis bawah (Ctrl+U)', '<u>U</u>')}${btn('strike', 'Coret', '<s>S</s>')}
    ${sel('color', 'Warna teks', COLORS)}${sel('mark', 'Highlight', MARKS)}<span class="rte-sep"></span>
    ${btn('ul', 'Bullet list', svg('ul'))}${btn('ol', 'Daftar bernomor', svg('ol'))}${btn('outdent', 'Kurangi indent (Shift+Tab di list)', svg('outdent'))}${btn('indent', 'Tambah indent (Tab di list)', svg('indent'))}<span class="rte-sep"></span>
    ${btn('left', 'Rata kiri', svg('left'))}${btn('center', 'Rata tengah', svg('center'))}${btn('right', 'Rata kanan', svg('right'))}${btn('justify', 'Rata kiri-kanan', svg('justify'))}<span class="rte-sep"></span>
    ${btn('link', 'Sisipkan link', svg('link'))}${btn('quote', 'Kutipan', svg('quote'))}${btn('hr', 'Garis pemisah', svg('hr'))}${btn('table', 'Sisipkan tabel', svg('table'))}${btn('image', 'Sisipkan gambar (atau paste / drag gambar ke sini)', svg('image'))}${btn('video', 'Sisipkan video YouTube di posisi kursor', svg('video'))}${btn('clear', 'Hapus format', svg('clear'))}
  </div>
  <div class="rte-row rte-context" data-ctx="table" hidden><span class="rte-ctx-label">Tabel:</span>
    ${btn('row-add', 'Tambah baris', '+ Baris')}${btn('col-add', 'Tambah kolom', '+ Kolom')}${btn('row-del', 'Hapus baris', '− Baris')}${btn('col-del', 'Hapus kolom', '− Kolom')}${btn('header', 'Baris judul tabel', 'Baris judul')}${btn('table-del', 'Hapus tabel', 'Hapus tabel', 'data-danger')}
  </div>
  <div class="rte-row rte-context" data-ctx="image" hidden><span class="rte-ctx-label">Gambar:</span>
    ${btn('img-s', 'Ukuran kecil', 'Kecil')}${btn('img-m', 'Ukuran sedang', 'Sedang')}${btn('img-l', 'Lebar penuh', 'Penuh')}${btn('img-alt', 'Teks alternatif gambar', 'Teks alternatif')}
  </div>`;
}

/**
 * @param {HTMLElement} host
 * @param {{html:string, onChange:(html:string)=>void, upload:(file:File)=>Promise<string>, isOwnImage:(src:string)=>boolean, notify:(msg:string,bad?:boolean)=>void, ask:(label:string,value:string)=>Promise<string|null>}} o
 */
export function create(host, o) {
  host.classList.add('rte');
  host.innerHTML = `<div class="rte-toolbar" role="toolbar" aria-label="Format teks">${toolbarHtml()}</div><div class="rte-body"></div><div class="rte-status" aria-live="polite"></div>`;
  const toolbar = host.querySelector('.rte-toolbar'), status = host.querySelector('.rte-status');
  let uploading = 0;
  const setStatus = () => {status.textContent = uploading ? `Mengunggah ${uploading} gambar…` : '';};

  let editor;
  async function insertImages(files, pos) {
    for (const file of files) {
      if (!IMAGE_TYPES.includes(file.type)) {o.notify('Format gambar harus PNG, JPG, WEBP, atau GIF.', true); continue;}
      if (file.size > 5 * 1024 * 1024) {o.notify('Ukuran gambar maksimal 5 MB.', true); continue;}
      uploading++; setStatus();
      try {
        const src = await o.upload(file);
        const at = pos ?? editor.state.selection.to;
        editor.chain().focus().insertContentAt(Math.min(at, editor.state.doc.content.size), {type: 'image', attrs: {src, alt: '', size: 'l'}}).run();
        pos = undefined;
      } catch (e) {o.notify(e.message || 'Gambar gagal diunggah.', true);}
      finally {uploading--; setStatus();}
    }
  }
  const dataUrlToFile = (url, i) => {
    const [head, b64] = url.split(','), type = (head.match(/^data:(image\/[a-z+]+);base64$/) || [])[1];
    if (!type || !b64) return null;
    const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return new File([bytes], `paste-${i}.${type.split('/')[1]}`, {type});
  };

  editor = new Editor({
    element: host.querySelector('.rte-body'),
    extensions: [
      StarterKit.configure({heading: false, code: false, codeBlock: false, link: {openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['mailto'], HTMLAttributes: {target: '_blank', rel: 'noopener noreferrer'}}}),
      TextStyle, FontFamily, FontSize, Color, BackgroundColor,
      TextAlign.configure({types: ['paragraph']}),
      TableKit.configure({table: {resizable: false}}),
      SizedImage.configure({inline: false, allowBase64: false}),
      Youtube.configure({nocookie: true, controls: true, rel: 0, width: 640, height: 360, HTMLAttributes: {referrerpolicy: 'strict-origin-when-cross-origin'}}),
      Indent
    ],
    content: o.html || '<p></p>',
    editorProps: {
      attributes: {class: 'rich rte-content', spellcheck: 'true'},
      handlePaste(view, event) {
        const files = [...(event.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
        const html = event.clipboardData?.getData('text/html') || '';
        if (files.length && !/<(p|div|table|li|span)\b/i.test(html)) {event.preventDefault(); insertImages(files); return true;}
        return false;
      },
      handleDrop(view, event, slice, moved) {
        if (moved) return false;
        const files = [...(event.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        insertImages(files, view.posAtCoords({left: event.clientX, top: event.clientY})?.pos);
        return true;
      },
      transformPastedHTML(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const pending = []; let dropped = 0;
        doc.querySelectorAll('img').forEach((img, i) => {
          const src = img.getAttribute('src') || '';
          if (o.isOwnImage(src)) return;
          if (src.startsWith('data:image/')) {const f = dataUrlToFile(src, i); if (f) pending.push(f); else dropped++;}
          else dropped++;
          img.remove();
        });
        if (pending.length) setTimeout(() => insertImages(pending), 0);
        if (dropped) o.notify(`${dropped} gambar dari dokumen asal tidak bisa ikut disalin. Salin gambarnya satu per satu (klik kanan → Salin gambar), lalu paste di sini.`, true);
        return doc.body.innerHTML;
      }
    },
    onUpdate: ({editor}) => o.onChange(editor.isEmpty ? '' : editor.getHTML()),
    onSelectionUpdate: () => refresh(),
    onTransaction: () => refresh()
  });

  function refresh() {
    const a = (n, attrs) => editor.isActive(n, attrs);
    const state = {
      bold: a('bold'), italic: a('italic'), underline: a('underline'), strike: a('strike'), ul: a('bulletList'), ol: a('orderedList'),
      left: a({textAlign: 'left'}), center: a({textAlign: 'center'}), right: a({textAlign: 'right'}), justify: a({textAlign: 'justify'}),
      link: a('link'), quote: a('blockquote'), header: a('tableHeader')
    };
    toolbar.querySelectorAll('[data-cmd]').forEach(el => {
      if (el.tagName === 'BUTTON') el.classList.toggle('on', Boolean(state[el.dataset.cmd]));
    });
    const ts = editor.getAttributes('textStyle');
    const setSel = (cmd, v) => {const s = toolbar.querySelector(`select[data-cmd="${cmd}"]`); s.value = [...s.options].some(o => o.value === (v || '')) ? (v || '') : '';};
    setSel('font', ts.fontFamily); setSel('size', ts.fontSize); setSel('color', ts.color); setSel('mark', ts.backgroundColor);
    toolbar.querySelector('[data-ctx="table"]').hidden = !a('table');
    const imgSel = a('image');
    toolbar.querySelector('[data-ctx="image"]').hidden = !imgSel;
    if (imgSel) {const size = editor.getAttributes('image').size; ['s', 'm', 'l'].forEach(z => toolbar.querySelector(`[data-cmd="img-${z}"]`).classList.toggle('on', size === z));}
    toolbar.querySelector('[data-cmd="undo"]').disabled = !editor.can().undo();
    toolbar.querySelector('[data-cmd="redo"]').disabled = !editor.can().redo();
  }

  toolbar.addEventListener('mousedown', e => {if (e.target.closest('button')) e.preventDefault();}); // jaga seleksi
  toolbar.addEventListener('click', async e => {
    const b = e.target.closest('button[data-cmd]'); if (!b) return;
    const c = editor.chain().focus();
    switch (b.dataset.cmd) {
      case 'undo': c.undo().run(); break; case 'redo': c.redo().run(); break;
      case 'bold': c.toggleBold().run(); break; case 'italic': c.toggleItalic().run(); break;
      case 'underline': c.toggleUnderline().run(); break; case 'strike': c.toggleStrike().run(); break;
      case 'ul': c.toggleBulletList().run(); break; case 'ol': c.toggleOrderedList().run(); break;
      case 'indent': c.indentMore().run(); break; case 'outdent': c.indentLess().run(); break;
      case 'left': case 'center': case 'right': case 'justify': c.setTextAlign(b.dataset.cmd).run(); break;
      case 'quote': c.toggleBlockquote().run(); break; case 'hr': c.setHorizontalRule().run(); break;
      case 'clear': c.unsetAllMarks().unsetTextAlign().run(); break;
      case 'link': {
        const prev = editor.getAttributes('link').href || '';
        const url = await o.ask('Alamat link (kosongkan untuk menghapus link)', prev || 'https://');
        if (url === null) break;
        const clean = url.trim();
        if (!clean || clean === 'https://') {editor.chain().focus().extendMarkRange('link').unsetLink().run(); break;}
        if (!/^(https?:\/\/|mailto:)/i.test(clean)) {o.notify('Link harus diawali https:// atau mailto:', true); break;}
        if (editor.state.selection.empty && !editor.isActive('link')) editor.chain().focus().insertContent({type: 'text', text: clean, marks: [{type: 'link', attrs: {href: clean}}]}).run();
        else editor.chain().focus().extendMarkRange('link').setLink({href: clean}).run();
        break;
      }
      case 'table': c.insertTable({rows: 3, cols: 3, withHeaderRow: true}).run(); break;
      case 'row-add': c.addRowAfter().run(); break; case 'col-add': c.addColumnAfter().run(); break;
      case 'row-del': c.deleteRow().run(); break; case 'col-del': c.deleteColumn().run(); break;
      case 'header': c.toggleHeaderRow().run(); break; case 'table-del': c.deleteTable().run(); break;
      case 'image': {
        const input = document.createElement('input'); input.type = 'file'; input.accept = IMAGE_TYPES.join(','); input.multiple = true;
        input.onchange = () => insertImages([...input.files]); input.click(); break;
      }
      case 'video': {
        const url = await o.ask('Link video YouTube (mis. https://www.youtube.com/watch?v=…)', 'https://');
        if (url === null || !url.trim() || url.trim() === 'https://') break;
        if (!editor.chain().focus().setYoutubeVideo({src: url.trim()}).run()) o.notify('Link YouTube tidak dikenali. Salin link dari tombol Bagikan di YouTube.', true);
        break;
      }
      case 'img-s': case 'img-m': case 'img-l': c.updateAttributes('image', {size: b.dataset.cmd.slice(4)}).run(); break;
      case 'img-alt': {
        const alt = await o.ask('Teks alternatif (deskripsi singkat gambar untuk pembaca layar)', editor.getAttributes('image').alt || '');
        if (alt !== null) editor.chain().focus().updateAttributes('image', {alt: alt.slice(0, 200)}).run();
        break;
      }
    }
  });
  toolbar.addEventListener('change', e => {
    const s = e.target.closest('select[data-cmd]'); if (!s) return;
    const v = s.value, c = editor.chain().focus();
    if (s.dataset.cmd === 'font') (v ? c.setFontFamily(v) : c.unsetFontFamily()).run();
    if (s.dataset.cmd === 'size') (v ? c.setFontSize(v) : c.unsetFontSize()).run();
    if (s.dataset.cmd === 'color') (v ? c.setColor(v) : c.unsetColor()).run();
    if (s.dataset.cmd === 'mark') (v ? c.setBackgroundColor(v) : c.unsetBackgroundColor()).run();
  });
  refresh();
  return {destroy: () => editor.destroy(), editor};
}
