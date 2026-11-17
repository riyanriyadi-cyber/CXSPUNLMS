import {randomBytes,randomUUID,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {sql,json,fail,bodyJSON,protectMutation,HttpError} from './core.mjs';
const derive=promisify(scrypt),ttl=7*24*60*60;
const hashToken=s=>createHash('sha256').update(s).digest('hex');
const dummySalt='d24287b3361373c7bb806b503945f97b3';
const normalizeEmail=value=>typeof value==='string'?value.trim().toLowerCase():'';
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');const hash=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return `scrypt$32768$${salt}$${hash.toString('hex')}`;}
export async function passwordMatches(password,encoded){const parts=encoded?.split('$');const salt=parts?.[2]||dummySalt;const hash=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});if(!parts||parts.length!==4)return false;const expected=Buffer.from(parts[3],'hex');return expected.length===hash.length&&timingSafeEqual(hash,expected);}
function sessionToken(request){const cookie=request.headers.get('cookie')||'';const token=cookie.split(';').map(p=>p.trim()).find(p=>p.startsWith('spun_session='))?.slice(13);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}
export async function sessionUser(db,request){const token=sessionToken(request);if(!token)return null;const row=await sql(db,'SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',hashToken(token),Date.now()).first();return row||null;}
function cookie(value,secure,age=ttl){return `spun_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure?'; Secure':''}`;}
async function newSession(db,userId,secure){const token=randomBytes(32).toString('hex');await db.batch([sql(db,'DELETE FROM sessions WHERE expires_at<=?',Date.now()),sql(db,'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',hashToken(token),userId,Date.now()+ttl*1000)]);return cookie(token,secure);}
async function rateLimit(db,key,max,windowMs){const now=Date.now();const row=await sql(db,'INSERT INTO auth_throttle(bucket,count,reset_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END, reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING count,reset_at',hashToken(key),now+windowMs,now,now).first();if(row.count>max)fail(429,'Terlalu banyak percobaan. Coba lagi setelah 15 menit.');}
export async function localAuth(request,{db,allowRegistration,origin,ip}){
 const path=new URL(request.url).pathname,secure=origin.startsWith('https:');
 try{
  if(path==='/api/auth/config'&&request.method==='GET')return json({mode:'local',registration:allowRegistration});
  protectMutation(request,origin);
  if(request.method!=='POST')fail(405,'Metode tidak diizinkan.');
  const body=await bodyJSON(request);
  if(path==='/api/auth/logout'){const token=sessionToken(request);if(token)await sql(db,'DELETE FROM sessions WHERE token_hash=?',hashToken(token)).run();return json({ok:true},200,{'Set-Cookie':cookie('',secure,0)});}
  if(!['/api/auth/login','/api/auth/register'].includes(path))fail(404,'Endpoint tidak ditemukan.');
  const email=normalizeEmail(body.email),password=body.password;
  if(!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)||email.length>254||typeof password!=='string'||password.length>128)fail(422,'Email atau password tidak valid.');
  await rateLimit(db,`${path}:${ip}`,path.endsWith('login')?15:5,15*60*1000);
  if(path==='/api/auth/login'){
   const account=await sql(db,'SELECT user_id,password_hash FROM local_accounts WHERE email=?',email).first();
   const valid=await passwordMatches(password,account?.password_hash);if(!account||!valid)fail(401,'Email atau password salah.');
   return json({ok:true},200,{'Set-Cookie':await newSession(db,account.user_id,secure)});
  }
  if(!allowRegistration)fail(403,'Pendaftaran akun sedang ditutup. Hubungi pengelola.');
  const name=typeof body.name==='string'?body.name.trim():'';
  if(!/^[\p{L}\p{N} .'-]{2,80}$/u.test(name))fail(422,'Isi nama 2–80 karakter menggunakan huruf, angka, atau spasi.');
  if(password.length<12)fail(422,'Gunakan password minimal 12 karakter.');
  if(await sql(db,'SELECT user_id FROM local_accounts WHERE email=?',email).first())fail(409,'Email sudah terdaftar. Silakan masuk.');
  const id=randomUUID(),encoded=await passwordHash(password);
  try{await db.batch([sql(db,'INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?)',id,name,email,new Date().toISOString()),sql(db,'INSERT INTO local_accounts(user_id,email,password_hash) VALUES(?,?,?)',id,email,encoded)]);}catch(e){if(e.message.includes('UNIQUE'))fail(409,'Email sudah terdaftar. Silakan masuk.');throw e;}
  return json({ok:true},201,{'Set-Cookie':await newSession(db,id,secure)});
 }catch(e){if(!(e instanceof HttpError))console.error('Local auth error:',e.message);return json({error:e instanceof HttpError?e.message:'Login belum dapat diproses.'},e.status||500);}
}
