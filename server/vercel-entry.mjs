// Sumber Vercel Function. JANGAN deploy file ini langsung: `npm run build:api` mem-bundle-nya menjadi api/handler.js.
import {createHandler} from './app.mjs';
import {productionDb} from './db.mjs';
import {supabaseConfig, supabaseVerifier} from './auth.mjs';
import {supabaseAdmin} from './supabase-admin.mjs';

const config = supabaseConfig();
const handle = createHandler({getDb: productionDb, verifyToken: supabaseVerifier(config), config, admin: supabaseAdmin(config)});

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
