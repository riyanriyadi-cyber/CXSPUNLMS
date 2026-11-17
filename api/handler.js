// Vercel Function: menerima semua request /api/* (lihat rewrite di vercel.json).
import {createHandler} from '../server/app.mjs';
import {productionDb} from '../server/db.mjs';
import {supabaseConfig, supabaseVerifier} from '../server/auth.mjs';

const config = supabaseConfig();
const handle = createHandler({getDb: productionDb, verifyToken: supabaseVerifier(config), config});

// Bangun ulang URL publik: path asli dari rewrite (?__path=) dan host dari header proxy Vercel,
// sehingga pemeriksaan Origin di core.mjs membandingkan dengan domain yang dibuka pengguna.
function publicRequest(request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = (request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')).split(',')[0].trim();
  const original = url.searchParams.get('__path');
  url.searchParams.delete('__path');
  const pathname = original !== null ? `/api/${original}` : url.pathname;
  const fixed = new URL(`${proto}://${host}${pathname}${url.search}`);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  return new Request(fixed, {method: request.method, headers: request.headers, ...(hasBody ? {body: request.body, duplex: 'half'} : {})});
}

const entry = request => handle(publicRequest(request));
export const GET = entry;
export const POST = entry;
