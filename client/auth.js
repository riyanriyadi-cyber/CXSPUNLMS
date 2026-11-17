// Sumber frontend auth (Supabase Auth). Di-bundle oleh scripts/build.mjs menjadi public/auth.js.
import {AuthClient} from '@supabase/auth-js';

const overlay = () => document.getElementById('auth-overlay');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Baca tipe link email (invite / recovery / signup) dan error sebelum AuthClient membersihkan hash URL.
const hash = new URLSearchParams(location.hash.slice(1));
const linkType = hash.get('type');
const linkError = hash.get('error_code') || hash.get('error');

let auth;
async function accessToken() {
  if (!auth) return null;
  const {data} = await auth.getSession();
  return data.session?.access_token || null;
}

window.hubRequest = async function (path, options = {}) {
  const token = await accessToken();
  const response = await fetch(path, {credentials: 'same-origin', ...options, headers: {'Content-Type': 'application/json', 'X-Learning-Hub': '1', ...(token ? {Authorization: `Bearer ${token}`} : {}), ...(options.headers || {})}});
  let data;
  try {data = await response.json();} catch {throw new Error('Respons server tidak valid. Coba muat ulang.');}
  if (!response.ok) {const error = new Error(data.error || 'Permintaan belum berhasil.'); error.status = response.status; throw error;}
  return data;
};
window.hubSignOut = async function () {
  try {await auth?.signOut();} catch {/* sesi lokal tetap dihapus */}
  location.replace(location.pathname);
};

const MESSAGES = [
  [/invalid login credentials/i, 'Email atau password salah.'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Buka link konfirmasi di inbox-mu.'],
  [/user already registered|already been registered/i, 'Email sudah terdaftar. Silakan masuk.'],
  [/signups? not allowed|signup is disabled/i, 'Pendaftaran akun sedang ditutup. Hubungi pengelola.'],
  [/rate limit|too many|after \d+ seconds/i, 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'],
  [/password should be at least|weak password|password is known/i, 'Password terlalu lemah. Gunakan minimal 12 karakter yang sulit ditebak.'],
  [/should be different from the old/i, 'Gunakan password yang berbeda dari sebelumnya.'],
  [/failed to fetch|network/i, 'Tidak dapat terhubung. Periksa koneksi internet.']
];
const friendly = error => MESSAGES.find(([re]) => re.test(error?.message || ''))?.[1] || 'Permintaan belum berhasil. Coba lagi.';

function card(inner) {
  overlay().innerHTML = `<div class="auth-card"><img src="assets/spun-logo.png" alt="SPUN"/><div class="modal-kicker">SPUN LEARNING HUB</div>${inner}<div class="auth-footer">Small steps. Big growth. <span>✦</span></div></div>`;
}
function connectionError(message) {
  overlay().innerHTML = '<div class="auth-card"><img src="assets/spun-logo.png" alt="SPUN"/><h1>Belum dapat terhubung.</h1><p id="connection-error"></p><button id="retry-connection" class="btn btn-orange">Coba lagi</button></div>';
  document.getElementById('connection-error').textContent = message;
  document.getElementById('retry-connection').onclick = () => location.reload();
}
function bindForm(handler) {
  const form = document.getElementById('auth-form');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type=submit]'), error = document.getElementById('auth-error');
    button.disabled = true; error.textContent = '';
    try {await handler(Object.fromEntries(new FormData(form)));}
    catch (e) {error.textContent = e.userMessage || friendly(e); button.disabled = false;}
  });
}
const fail = message => {const e = new Error(message); e.userMessage = message; throw e;};
const notice = text => `<p class="auth-notice" role="status">${esc(text)}</p>`;

function renderSignIn(config, mode = 'login', message = '') {
  const titles = {login: 'Selamat datang kembali.', register: 'Mulai perjalanan belajarmu.', forgot: 'Atur ulang password.'};
  const subtitle = mode === 'forgot' ? 'Masukkan email akunmu. Kami kirim link untuk membuat password baru.' : 'Belajar hari ini. Bertumbuh setiap hari.';
  const fields = `${mode === 'register' ? '<label>Nama lengkap<input name="name" autocomplete="name" required minlength="2" maxlength="80" placeholder="Nama lengkap" /></label>' : ''}<label>Email<input name="email" type="email" autocomplete="username" required maxlength="254" placeholder="nama@perusahaan.com" /></label>${mode === 'forgot' ? '' : `<label>Password<input name="password" type="password" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" required ${mode === 'register' ? 'minlength="12"' : ''} maxlength="128" placeholder="${mode === 'register' ? 'Minimal 12 karakter' : 'Masukkan password'}" /></label>`}`;
  const submit = {login: 'Masuk', register: 'Buat akun', forgot: 'Kirim link reset'}[mode];
  const links = [
    mode === 'login' ? '<button type="button" class="auth-switch" data-mode="forgot">Lupa password?</button>' : '<button type="button" class="auth-switch" data-mode="login">Kembali ke halaman masuk</button>',
    mode === 'login' && config.registration ? '<button type="button" class="auth-switch" data-mode="register">Belum punya akun? Daftar</button>' : '',
    mode === 'login' && !config.registration ? '<p class="auth-small">Belum punya akun? Hubungi pengelola untuk dikirimi undangan.</p>' : ''
  ].join('');
  card(`<h1>${titles[mode]}</h1><p>${subtitle}</p>${message ? notice(message) : ''}<form id="auth-form">${fields}<div id="auth-error" role="alert"></div><button class="btn btn-orange auth-submit" type="submit">${submit} →</button></form>${links}`);
  overlay().querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => renderSignIn(config, b.dataset.mode)));
  bindForm(async ({name = '', email = '', password = ''}) => {
    email = email.trim().toLowerCase();
    if (mode === 'forgot') {
      const {error} = await auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname});
      if (error) throw error;
      return renderSignIn(config, 'login', 'Jika email terdaftar, link reset password sudah dikirim. Cek inbox dan folder spam.');
    }
    if (mode === 'register') {
      name = name.trim();
      if (!/^[\p{L}\p{N} .'-]{2,80}$/u.test(name)) fail('Isi nama 2–80 karakter menggunakan huruf, angka, atau spasi.');
      if (password.length < 12) fail('Gunakan password minimal 12 karakter.');
      const {data, error} = await auth.signUp({email, password, options: {data: {full_name: name}, emailRedirectTo: location.origin + location.pathname}});
      if (error) throw error;
      if (!data.session) return renderSignIn(config, 'login', 'Akun dibuat. Buka link konfirmasi yang dikirim ke emailmu, lalu masuk.');
      return location.reload();
    }
    const {error} = await auth.signInWithPassword({email, password});
    if (error) throw error;
    location.reload();
  });
}

function renderSetPassword(kind, session) {
  const currentName = session.user.user_metadata?.full_name || '';
  const invite = kind === 'invite';
  card(`<h1>${invite ? 'Aktifkan akunmu.' : 'Buat password baru.'}</h1><p>${esc(session.user.email)}</p><form id="auth-form">${invite ? `<label>Nama lengkap<input name="name" autocomplete="name" required minlength="2" maxlength="80" value="${esc(currentName)}" placeholder="Nama lengkap" /></label>` : ''}<label>Password baru<input name="password" type="password" autocomplete="new-password" required minlength="12" maxlength="128" placeholder="Minimal 12 karakter" /></label><label>Ulangi password<input name="confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="128" placeholder="Ketik ulang password" /></label><div id="auth-error" role="alert"></div><button class="btn btn-orange auth-submit" type="submit">Simpan & mulai belajar →</button></form>`);
  bindForm(async ({name = '', password = '', confirm = ''}) => {
    if (password.length < 12) fail('Gunakan password minimal 12 karakter.');
    if (password !== confirm) fail('Kedua password belum sama.');
    const update = {password};
    if (invite) {
      name = name.trim();
      if (!/^[\p{L}\p{N} .'-]{2,80}$/u.test(name)) fail('Isi nama 2–80 karakter menggunakan huruf, angka, atau spasi.');
      update.data = {full_name: name};
    }
    const {error} = await auth.updateUser(update);
    if (error) throw error;
    await auth.refreshSession(); // token baru membawa nama terbaru
    location.replace(location.pathname);
  });
}

window.hubReady = (async () => {
  let config;
  try {
    const response = await fetch('/api/auth/config', {credentials: 'same-origin'});
    config = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(config.error || 'Server belum dapat memuat konfigurasi.');
    auth = new AuthClient({
      url: `${config.supabaseUrl}/auth/v1`, headers: {apikey: config.supabaseKey},
      storageKey: 'spun-learning-hub-auth', flowType: 'implicit',
      persistSession: true, autoRefreshToken: true, detectSessionInUrl: true
    });
    const {data: {session}} = await auth.getSession();
    if (linkError && !session) {
      renderSignIn(config, 'login', 'Link dari email sudah kedaluwarsa atau sudah dipakai. Minta link baru melalui "Lupa password?" atau hubungi pengelola.');
      history.replaceState(null, '', location.pathname);
      return new Promise(() => {});
    }
    if (session && (linkType === 'invite' || linkType === 'recovery')) {renderSetPassword(linkType, session); return new Promise(() => {});}
    if (session) {
      try {
        const me = await window.hubRequest('/api/me');
        const catalog = await window.hubRequest('/api/catalog');
        overlay().remove(); document.body.classList.remove('is-loading');
        return {...me, catalog, auth: {mode: 'supabase', registration: config.registration}};
      } catch (error) {
        if (error.status === 403) {
          card(`<h1>Akses belum tersedia.</h1><p>${esc(error.message)}</p><button id="auth-signout" class="btn btn-outline auth-submit">Keluar</button>`);
          document.getElementById('auth-signout').onclick = () => window.hubSignOut();
          return new Promise(() => {});
        }
        if (error.status !== 401) throw error;
        await auth.signOut({scope: 'local'}).catch(() => {});
      }
    }
  } catch (error) {connectionError(error.message); return new Promise(() => {});}
  renderSignIn(config);
  return new Promise(() => {});
})();
