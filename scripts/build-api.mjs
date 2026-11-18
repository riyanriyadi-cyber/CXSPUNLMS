// Bundle server/vercel-entry.mjs (+ semua dependensi) menjadi SATU file: api/handler.js.
// Alasan: sanitize-html (CommonJS) memakai htmlparser2 (ES Module). Runtime Vercel tidak bisa
// require() ES Module, jadi campuran format diselesaikan di sini saat build.
// Jalankan setiap kali ada perubahan di folder server/:  npm run build:api
import {build} from 'esbuild';
await build({
  entryPoints: ['server/vercel-entry.mjs'], outfile: 'api/handler.js',
  bundle: true, platform: 'node', format: 'esm', target: 'node20', minify: false, legalComments: 'none',
  banner: {js: "// FILE HASIL BUILD — jangan diedit. Sumber: server/*.mjs, perintah: npm run build:api\nimport {createRequire as __cr} from 'node:module'; const require = __cr(import.meta.url);"}
});
console.log('Built api/handler.js');
