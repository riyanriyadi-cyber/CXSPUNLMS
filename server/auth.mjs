// Verifikasi access token Supabase Auth di server.
// getClaims() memverifikasi tanda tangan JWT secara lokal memakai JWKS proyek (signing key asimetris),
// atau otomatis memanggil Auth server (getUser) bila proyek masih memakai legacy JWT secret.
import {AuthClient} from '@supabase/auth-js';

export function supabaseConfig(env = process.env) {
  return {
    supabaseUrl: (env.SUPABASE_URL || '').replace(/\/$/, ''),
    supabaseKey: env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '',
    allowRegistration: env.ALLOW_REGISTRATION === 'true'
  };
}

export function profileFromClaims(claims) {
  if (!claims?.sub || claims.role !== 'authenticated' || claims.is_anonymous) return null;
  const email = typeof claims.email === 'string' ? claims.email : '';
  const meta = claims.user_metadata || {};
  const raw = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : '';
  const name = raw.trim().slice(0, 80) || email.split('@')[0] || 'Learner';
  return {id: claims.sub, name, email};
}

export function supabaseVerifier({supabaseUrl, supabaseKey}) {
  let client;
  return async token => {
    if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY belum diatur.');
    client ||= new AuthClient({url: `${supabaseUrl}/auth/v1`, headers: {apikey: supabaseKey}, persistSession: false, autoRefreshToken: false, detectSessionInUrl: false});
    const {data, error} = await client.getClaims(token);
    if (error || !data?.claims) return null;
    return profileFromClaims(data.claims);
  };
}
