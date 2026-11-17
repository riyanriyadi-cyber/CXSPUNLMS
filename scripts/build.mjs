// Build frontend: bundle client/auth.js (+ Supabase Auth client) menjadi public/auth.js.
// Vercel menjalankan ini otomatis (lihat vercel.json → buildCommand).
import {build} from 'esbuild';
await build({
  entryPoints: ['client/auth.js'], outfile: 'public/auth.js',
  bundle: true, format: 'iife', platform: 'browser', target: 'es2020', minify: true, legalComments: 'none'
});
console.log('Built public/auth.js');
