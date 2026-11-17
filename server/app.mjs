// Handler HTTP (Web Request → Response) untuk semua endpoint /api/*.
// Dipakai oleh Vercel Function (api/handler.js), server dev lokal, dan pengujian.
import {api, json, ensureUser} from './core.mjs';
import {securityHeaders} from './headers.mjs';

const bearer = request => {
  const value = request.headers.get('authorization') || '';
  const match = value.match(/^Bearer\s+([A-Za-z0-9._-]{20,4096})$/);
  return match ? match[1] : null;
};

export function createHandler({getDb, verifyToken, config}) {
  const synced = new Map(); // cache per instance: user id → nama+email terakhir yang ditulis ke tabel users
  return async function handle(request) {
    let response;
    try {
      const path = new URL(request.url).pathname;
      if (path === '/api/auth/config' && request.method === 'GET') {
        response = config.supabaseUrl && config.supabaseKey
          ? json({mode: 'supabase', registration: config.allowRegistration, supabaseUrl: config.supabaseUrl, supabaseKey: config.supabaseKey})
          : json({error: 'Konfigurasi Supabase belum lengkap di server.'}, 503);
      } else {
        const token = bearer(request);
        const user = token ? await verifyToken(token) : null;
        if (!user) response = json({error: 'Silakan masuk untuk melanjutkan.'}, 401);
        else {
          const db = await getDb();
          const key = `${user.name}\n${user.email}`;
          if (synced.get(user.id) !== key) {await ensureUser(db, user); synced.set(user.id, key);}
          response = await api(request, {db, user, origin: new URL(request.url).origin});
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
