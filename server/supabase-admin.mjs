// Operasi yang butuh secret key Supabase (HANYA di server): undang user, nonaktifkan/aktifkan, URL unggah gambar.
// Secret key tidak pernah dikirim ke browser.
import {AuthClient} from '@supabase/auth-js';
import {MEDIA_BUCKET} from './content.mjs';
import {HttpError} from './http.mjs';

export function supabaseAdmin({supabaseUrl, secretKey}) {
  const need = () => {if (!supabaseUrl || !secretKey) throw new HttpError(503, 'SUPABASE_SECRET_KEY belum diatur di Vercel. Fitur ini butuh secret key.');};
  const headers = () => ({apikey: secretKey, Authorization: `Bearer ${secretKey}`});
  let auth;
  const admin = () => {need(); auth ||= new AuthClient({url: `${supabaseUrl}/auth/v1`, headers: headers(), persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}); return auth.admin;};
  return {
    async invite(email, {name, redirectTo}) {
      const {data, error} = await admin().inviteUserByEmail(email, {data: {full_name: name}, redirectTo});
      if (error) {
        if (/already been registered|already registered|email_exists/i.test(error.message + (error.code || ''))) throw new HttpError(409, 'Email ini sudah terdaftar.');
        if (/rate limit/i.test(error.message)) throw new HttpError(429, 'Batas pengiriman email tercapai. Coba lagi nanti atau naikkan batas di Supabase → Authentication → Rate Limits.');
        console.error('Invite error:', error.message);
        throw new HttpError(502, 'Undangan gagal dikirim. Cek pengaturan SMTP di Supabase (Authentication → Logs).');
      }
      return {id: data.user.id};
    },
    async setBanned(id, banned) {
      const {error} = await admin().updateUserById(id, {ban_duration: banned ? '876000h' : 'none'});
      if (error) {console.error('Ban error:', error.message); throw new HttpError(502, 'Status akun gagal diubah di Supabase Auth.');}
    },
    async signUpload(path) {
      need();
      const response = await fetch(`${supabaseUrl}/storage/v1/object/upload/sign/${MEDIA_BUCKET}/${path}`, {method: 'POST', headers: {...headers(), 'Content-Type': 'application/json'}, body: '{}'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.url !== 'string') {console.error('Signed upload error:', response.status, data?.message); throw new HttpError(502, 'Gagal menyiapkan unggahan. Pastikan migrasi 2 (bucket lms-media) sudah dijalankan.');}
      return {uploadUrl: `${supabaseUrl}/storage/v1${data.url}`};
    }
  };
}
