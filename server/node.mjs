import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {openDatabase} from './sqlite.mjs';
import {api,json} from './core.mjs';
import {localAuth,sessionUser} from './auth-local.mjs';
import {securityHeaders,mimeTypes} from './headers.mjs';
const root=fileURLToPath(new URL('../public/',import.meta.url));
export function createApp({filename='./data/learning-hub.sqlite',allowRegistration=true,appOrigin=''}={}){
 const db=openDatabase(filename);
 const server=http.createServer(async(req,res)=>{
  try{
   const host=req.headers.host||'localhost';
   if(!appOrigin&&!/^(localhost|127\.0\.0\.1|\[::1\]|terminal\.local)(:\d+)?$/.test(host)){res.writeHead(400);res.end('Invalid host');return;}
   const origin=appOrigin||`http://${host}`,url=new URL(req.url||'/',origin);
   const headers=new Headers();for(const [key,value] of Object.entries(req.headers)){if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);}
   const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
   let response;
   if(url.pathname.startsWith('/api/auth/'))response=await localAuth(request,{db,allowRegistration,origin,ip:req.socket.remoteAddress||'local'});
   else if(url.pathname.startsWith('/api/'))response=await api(request,{db,user:await sessionUser(db,request),origin});
   else if(!['GET','HEAD'].includes(request.method))response=json({error:'Metode tidak diizinkan.'},405);
   else{
    let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{pathname='';}
    const file=resolve(root,pathname==='/'?'index.html':'.'+pathname);
    if(!pathname||!file.startsWith(root.endsWith(sep)?root:root+sep)||!mimeTypes[extname(file)])response=new Response('Not found',{status:404});
    else try{response=new Response(await readFile(file),{headers:{'Content-Type':mimeTypes[extname(file)],'Cache-Control':'no-cache'}});}catch{response=new Response('Not found',{status:404});}
   }
   for(const [key,value] of Object.entries(securityHeaders))response.headers.set(key,value);
   if(appOrigin.startsWith('https:'))response.headers.set('Strict-Transport-Security','max-age=31536000');
   const responseHeaders=Object.fromEntries(response.headers.entries());res.writeHead(response.status,responseHeaders);res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  }catch(error){console.error('Server request error:',error.message);if(!res.headersSent){res.writeHead(500,{'Content-Type':'application/json',...securityHeaders});res.end(JSON.stringify({error:'Server mengalami kendala.'}));}else res.end();}
 });
 return{server,db,async close(){await new Promise(r=>server.close(r));db.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const production=process.env.NODE_ENV==='production';
 const origin=process.env.APP_ORIGIN?.replace(/\/$/,'')||'';
 if(production&&(!origin||!origin.startsWith('https://')))throw new Error('Production requires APP_ORIGIN set to your HTTPS origin.');
 if(origin&&new URL(origin).origin!==origin)throw new Error('APP_ORIGIN must be an origin without a path.');
 const args=process.argv.slice(2),portIndex=args.indexOf('--port');
 const port=Number(process.env.PORT||(portIndex>=0?args[portIndex+1]:4173));
 const host=process.env.HOST||(process.env.SITES_MANAGED_LINUX_CONTAINER==='1'?'0.0.0.0':'127.0.0.1');
 const app=createApp({filename:process.env.DB_PATH||'./data/learning-hub.sqlite',allowRegistration:process.env.ALLOW_REGISTRATION?process.env.ALLOW_REGISTRATION==='true':!production,appOrigin:origin});
 app.server.listen(port,host,()=>console.log(`SPUN Learning Hub running at http://${host==='0.0.0.0'?'127.0.0.1':host}:${port}`));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
}
