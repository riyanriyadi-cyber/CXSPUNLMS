'use strict';
/**
 * Turns a lesson into something the browser may safely render. Only https URLs and an allow-list of hosts are
 * accepted; anything else becomes an "unsupported" notice with a plain-language reason (also shown to admins
 * when they save a lesson). The browser never receives raw HTML from the database.
 */
const { U } = require('./utils');

const Content = {
  MAX_URL: 2000,

  parse(url) {
    const s = String(url || '').trim();
    if (!s || s.length > this.MAX_URL) return null;
    const m = /^https:\/\/([a-z0-9.-]+)(?::\d+)?(\/[^?#\s]*)?(?:\?([^#\s]*))?(?:#\S*)?$/i.exec(s);
    if (!m) return null;
    return { url: s, host: m[1].toLowerCase(), path: m[2] || '/', query: m[3] || '' };
  },

  param(query, name) {
    const parts = String(query).split('&');
    for (let i = 0; i < parts.length; i++) {
      const kv = parts[i].split('=');
      if (kv[0] === name) return kv[1] || '';
    }
    return '';
  },

  googleEmbed(p) {
    if (p.host === 'drive.google.com') {
      const m = /^\/file\/d\/([A-Za-z0-9_-]{10,})/.exec(p.path);
      if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
      const id = this.param(p.query, 'id');
      if (/^\/(open|uc)$/.test(p.path) && /^[A-Za-z0-9_-]{10,}$/.test(id)) return 'https://drive.google.com/file/d/' + id + '/preview';
    } else if (p.host === 'docs.google.com') {
      const d = /^\/(document|presentation|spreadsheets)\/d\/([A-Za-z0-9_-]{10,})/.exec(p.path);
      if (d) return 'https://docs.google.com/' + d[1] + '/d/' + d[2] + '/preview';
    }
    return null;
  },

  isGoogleHost: (h) => h === 'drive.google.com' || h === 'docs.google.com',

  videoEmbed(p) {
    let id = '';
    if (p.host === 'www.youtube.com' || p.host === 'youtube.com' || p.host === 'm.youtube.com') {
      if (p.path === '/watch') id = this.param(p.query, 'v');
      else { const m = /^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/.exec(p.path); if (m) id = m[1]; }
    } else if (p.host === 'youtu.be') {
      const y = /^\/([A-Za-z0-9_-]{11})/.exec(p.path); if (y) id = y[1];
    }
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) return 'https://www.youtube-nocookie.com/embed/' + id;
    if (p.host === 'vimeo.com' || p.host === 'www.vimeo.com') {
      const v = /^\/(\d{5,12})/.exec(p.path); if (v) return 'https://player.vimeo.com/video/' + v[1];
    }
    return null;
  },

  safeLink(url) { const p = this.parse(url); return p ? p.url : ''; },

  /** @param {{lesson_type:string, content_text?:string, content_url?:string}} lesson */
  resolve(lesson) {
    const type = U.upper(lesson.lesson_type);
    const caption = lesson.content_text || '';
    const unsupported = (note) => ({ kind: 'unsupported', text: caption, note });
    if (type === 'TEXT') return caption ? { kind: 'text', text: caption } : unsupported('This lesson has no content yet.');
    const p = this.parse(lesson.content_url);
    if (!p) return unsupported('The link is missing or is not a secure address (it must start with https://).');
    if (type === 'IMAGE') {
      const g = this.googleEmbed(p);
      return g ? { kind: 'embed', src: g, openUrl: p.url, text: caption } : { kind: 'image', src: p.url, text: caption };
    }
    if (type === 'VIDEO') {
      const v = this.videoEmbed(p) || this.googleEmbed(p);
      return v ? { kind: 'embed', src: v, openUrl: p.url, text: caption }
        : unsupported('Only YouTube, Vimeo and Google Drive videos are supported.');
    }
    if (type === 'DRIVE') {
      const d = this.googleEmbed(p);
      if (d) return { kind: 'embed', src: d, openUrl: p.url, text: caption };
      if (this.isGoogleHost(p.host)) return { kind: 'link', openUrl: p.url, text: caption };
      return unsupported('Only Google Drive or Google Docs links are supported for this lesson type.');
    }
    return unsupported('This lesson type is not supported.');
  }
};

module.exports = Content;
