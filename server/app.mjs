// Handler HTTP (Web Request → Response) untuk semua endpoint /api/*.
// Dipakai oleh Vercel Function (api/handler.js), server dev lokal, dan pengujian.
import {api, json} from './core.mjs';
import {adminApi} from './admin.mjs';
import {sql} from './http.mjs';
import {securityHeaders} from './headers.mjs';

const bearer = request => {
  const value = request.headers.get('authorization') || '';
  const match = value.match(/^Bearer\s+([A-Za-z0-9._-]{20,4096})$/);
  return match ? match[1] : null;
};

// Profil + role + status dibaca dari database setiap request, jadi pencabutan admin/penonaktifan berlaku seketika.
async function resolveUser(db, verified) {
  let row = await sql(db, 'SELECT name,email,role,status FROM users WHERE id=?', verified.id).first();
  if (!row || row.email !== verified.email || (verified.hasName && row.name !== verified.name)) {
    row = await sql(db, `INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET email=excluded.email${verified.hasName ? ', name=excluded.name' : ''}
      RETURNING name,email,role,status`, verified.id, verified.name, verified.email, new Date().toISOString()).first();
  }
  return {id: verified.id, name: row.name, email: row.email, role: row.role, status: row.status};
}

import {ensureSchema} from './schema.mjs';
export const VERSION = '3.6.2';

export function createHandler({getDb, verifyToken, config, admin}) {
  return async function handle(request) {
    let response;
    try {
      const url = new URL(request.url), path = url.pathname;
      if (path === '/api/auth/config' && request.method === 'GET') {
        response = config.supabaseUrl && config.supabaseKey
          ? json({mode: 'supabase', version: VERSION, registration: config.allowRegistration, supabaseUrl: config.supabaseUrl, supabaseKey: config.supabaseKey})
          : json({error: 'Konfigurasi Supabase belum lengkap di server.'}, 503);
      } else {
        const token = bearer(request);
        const verified = token ? await verifyToken(token) : null;
        if (!verified) response = json({error: 'Silakan masuk untuk melanjutkan.'}, 401);
        else {
          const db = await getDb();
          await ensureSchema(db);
          const user = await resolveUser(db, verified);
          if (user.status === 'disabled') response = json({error: 'Akun kamu sedang dinonaktifkan. Hubungi pengelola Learning Hub.', code: 'disabled'}, 403);
          else if (path.startsWith('/api/admin/')) {
            response = user.role === 'admin'
              ? await adminApi(request, {db, user, origin: url.origin, config, admin})
              : json({error: 'Halaman ini khusus admin.'}, 403);
          } else response = await api(request, {db, user, origin: url.origin});
        }
      }
    } catch (error) {
      console.error('Learning Hub API error:', error?.message);
      response = json({error: 'Server mengalami kendala. Coba lagi.'}, 500);
    }
    for (const [k, v] of Object.entries(securityHeaders)) response.headers.set(k, v);
    return response;
  };
}
