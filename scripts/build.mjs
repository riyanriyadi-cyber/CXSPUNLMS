// Build frontend (Vercel menjalankan ini otomatis lewat vercel.json → buildCommand):
// - client/auth.js   → public/auth.js   (login + Supabase Auth)
// - client/editor.js → public/editor.js (editor teks panel admin, window.HubEditor)
import {build} from 'esbuild';
const common = {bundle: true, format: 'iife', platform: 'browser', target: 'es2020', minify: true, legalComments: 'none'};
await build({...common, entryPoints: ['client/auth.js'], outfile: 'public/auth.js'});
await build({...common, entryPoints: ['client/editor.js'], outfile: 'public/editor.js', globalName: 'HubEditor'});
console.log('Built public/auth.js and public/editor.js');
