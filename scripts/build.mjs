// Build frontend (Vercel menjalankan ini otomatis lewat vercel.json → buildCommand):
// - client/auth.js   → public/auth.js   (login + Supabase Auth)
// - client/editor.js → public/editor.js (editor teks panel admin, window.HubEditor)
// - client/xlsx-tools.js → public/xlsx-tools.js (impor/ekspor Excel quiz, window.HubXlsx)
import {build} from 'esbuild';
const common = {bundle: true, format: 'iife', platform: 'browser', target: 'es2020', minify: true, legalComments: 'none'};
await build({...common, entryPoints: ['client/auth.js'], outfile: 'public/auth.js'});
await build({...common, entryPoints: ['client/editor.js'], outfile: 'public/editor.js', globalName: 'HubEditor'});
await build({...common, entryPoints: ['client/xlsx-tools.js'], outfile: 'public/xlsx-tools.js', globalName: 'HubXlsx'});
console.log('Built public/auth.js, public/editor.js and public/xlsx-tools.js');
