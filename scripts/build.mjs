import {build} from 'esbuild';
import {readdir,readFile,writeFile,mkdir,rm,cp} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {mimeTypes} from '../server/headers.mjs';
const assets={};
async function collect(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name),key=prefix+'/'+entry.name;if(entry.isDirectory())await collect(path,key);else assets[key]={type:mimeTypes[extname(entry.name)]||'application/octet-stream',base64:(await readFile(path)).toString('base64')};}}
await collect('public');
await writeFile('.build-assets.json',JSON.stringify(assets));
try{
 await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});
 await build({entryPoints:['server/worker.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');
 await writeFile('dist/server/wrangler.json',JSON.stringify({name:'spun-learning-hub',main:'index.js',compatibility_date:'2026-05-15',d1_databases:[{binding:'DB',database_name:'spun-learning-hub',database_id:'00000000-0000-4000-8000-000000000000'}]},null,2));
 console.log('Built HTML assets and authenticated API for SPUN Learning Hub.');
}finally{await rm('.build-assets.json',{force:true});}
