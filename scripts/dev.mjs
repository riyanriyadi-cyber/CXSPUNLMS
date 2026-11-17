// Server pengembangan lokal (meniru Vercel): file statis dari public/ + /api/* ke handler yang sama.
// Butuh .env berisi SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DATABASE_URL. Jalankan: npm run dev
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {createHandler} from '../server/app.mjs';
import {productionDb} from '../server/db.mjs';
import {supabaseConfig, supabaseVerifier} from '../server/auth.mjs';
import {securityHeaders, mimeTypes} from '../server/headers.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const config = supabaseConfig();
const handle = createHandler({getDb: productionDb, verifyToken: supabaseVerifier(config), config});
const port = Number(process.env.PORT || 4173);

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let response;
    if (url.pathname.startsWith('/api/')) {
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(',') : v);
      const hasBody = !['GET', 'HEAD'].includes(req.method);
      response = await handle(new Request(url, {method: req.method, headers, ...(hasBody ? {body: Readable.toWeb(req), duplex: 'half'} : {})}));
    } else {
      let pathname; try {pathname = decodeURIComponent(url.pathname);} catch {pathname = '';}
      const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
      if (!pathname || !file.startsWith(root.endsWith(sep) ? root : root + sep) || !mimeTypes[extname(file)]) response = new Response('Not found', {status: 404});
      else try {response = new Response(await readFile(file), {headers: {'Content-Type': mimeTypes[extname(file)], 'Cache-Control': 'no-cache', ...securityHeaders}});} catch {response = new Response('Not found', {status: 404});}
    }
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port, '127.0.0.1', () => console.log(`SPUN Learning Hub (dev) → http://localhost:${port}`));
