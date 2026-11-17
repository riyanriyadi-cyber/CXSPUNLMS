import {api,json,ensureUser} from './core.mjs';
import {securityHeaders} from './headers.mjs';
import assets from '../.build-assets.json' with {type:'json'};
function platformUser(request){
 const id=request.headers.get('oai-authenticated-user-id');if(!id)return null;
 const email=request.headers.get('oai-authenticated-user-email')||'';
 let name=request.headers.get('oai-authenticated-user-full-name')||'';
 if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'){try{name=decodeURIComponent(name);}catch{name='';}}
 return{id,name:name||email.split('@')[0]||'Learner',email};
}
export default {async fetch(request,env){
 try{
  const path=new URL(request.url).pathname;let response;
  if(path==='/api/auth/config'&&request.method==='GET')response=json({mode:'chatgpt',registration:false,signIn:'/signin-with-chatgpt?return_to=%2F',signOut:'/signout-with-chatgpt?return_to=%2F'});
  else if(path.startsWith('/api/')){
   const user=platformUser(request);
   if(!user)response=json({error:'Silakan masuk menggunakan akun ChatGPT.'},401);
   else if(!env.DB)response=json({error:'Database belum tersedia.'},503);
   else{await ensureUser(env.DB,user);response=await api(request,{db:env.DB,user,origin:new URL(request.url).origin});}
  }else if(!['GET','HEAD'].includes(request.method))response=new Response('Method not allowed',{status:405});
  else{const asset=assets[path==='/'?'/index.html':path];if(!asset)response=new Response('Not found',{status:404});else{const bytes=Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));response=new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache'}});}}
  for(const [key,value] of Object.entries(securityHeaders))response.headers.set(key,value);
  return response;
 }catch(error){console.error('Worker error:',error.message);return json({error:'Layanan belum dapat diproses.'},500);}
}};
