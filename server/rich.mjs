// Penyaring HTML untuk kolom "Isi" (editor teks). Hanya tag, atribut, dan style di daftar izin yang lolos.
// Dijalankan setiap kali draft disimpan/dipublish, sehingga yang sampai ke peserta selalu aman.
import sanitizeHtml from 'sanitize-html';

export const FONTS = ['DM Sans', 'Manrope', 'Georgia', 'Courier New'];
export const FONT_SIZES = ['13px', '18px', '22px'];
const FONT_RE = new RegExp(`^['"]?(${FONTS.join('|')})['"]?(\\s*,\\s*['"]?[a-zA-Z -]{1,30}['"]?){0,3}$`);
const COLOR_RE = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
const PX_RE = /^\d{1,4}px$/;
const esc = s => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Teks biasa (format lama) → HTML paragraf.
export const plainToHtml = text => String(text || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

// Ada isi nyata? (bukan hanya paragraf kosong)
export const hasRichContent = html => /<(img|table|hr|iframe)\b/i.test(html) || html.replace(/<[^>]+>/g, '').replace(/&nbsp;|\s/g, '').length > 0;

export function sanitizeRich(html, {mediaPrefix}) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'span', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'table', 'colgroup', 'col', 'tbody', 'thead', 'tr', 'th', 'td', 'img', 'div', 'iframe'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'], img: ['src', 'alt', 'data-size'], p: ['style', 'data-indent'], span: ['style'],
      li: ['style'], th: ['colspan', 'rowspan', 'style'], td: ['colspan', 'rowspan', 'style'], ol: ['start'], col: ['style'], blockquote: ['style'],
      div: ['data-youtube-video'], iframe: ['src', 'width', 'height', 'allowfullscreen', 'title', 'allow', 'referrerpolicy', 'loading']
    },
    allowedStyles: {'*': {
      'text-align': [/^(left|center|right|justify)$/], 'font-family': [FONT_RE], 'font-size': [new RegExp(`^(${FONT_SIZES.join('|')})$`)],
      'color': [COLOR_RE], 'background-color': [COLOR_RE], 'min-width': [PX_RE], 'width': [PX_RE]
    }},
    allowedSchemes: ['https', 'http', 'mailto'], allowedSchemesByTag: {img: ['https', 'http'], iframe: ['https']}, allowedIframeHostnames: ['www.youtube-nocookie.com'], allowProtocolRelative: false,
    transformTags: {
      b: 'strong', i: 'em', strike: 's', del: 's',
      a: (tag, a) => ({tagName: 'a', attribs: {...(a.href ? {href: a.href} : {}), target: '_blank', rel: 'noopener noreferrer'}}),
      p: (tag, a) => ({tagName: 'p', attribs: {...(a.style ? {style: a.style} : {}), ...(/^[1-4]$/.test(a['data-indent'] || '') ? {'data-indent': a['data-indent']} : {})}}),
      div: (tag, a) => ({tagName: 'div', attribs: 'data-youtube-video' in a ? {'data-youtube-video': ''} : {}}),
      // Video YouTube di dalam teks: hanya embed youtube-nocookie dengan ID valid; atribut lain ditetapkan server.
      iframe: (tag, a) => {
        const m = /^https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})(?:\?(?:start=(\d{1,6}))?.*)?$/.exec(a.src || '');
        return m ? {tagName: 'iframe', attribs: {src: `https://www.youtube-nocookie.com/embed/${m[1]}${m[2] ? `?start=${m[2]}` : ''}`, width: '640', height: '360', title: 'Video YouTube', allowfullscreen: 'true', allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen', referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy'}} : {tagName: 'iframe', attribs: {}};
      },
      img: (tag, a) => ({tagName: 'img', attribs: {src: a.src || '', alt: (a.alt || '').slice(0, 200), ...(['s', 'm', 'l'].includes(a['data-size']) ? {'data-size': a['data-size']} : {})}})
    },
    // Gambar hanya dari bucket media proyek ini (gambar lain dibuang).
    exclusiveFilter: frame => (frame.tag === 'img' && !(frame.attribs.src || '').startsWith(mediaPrefix)) || (frame.tag === 'iframe' && !frame.attribs.src)
  });
}
