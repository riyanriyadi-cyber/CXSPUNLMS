import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server/node.mjs';

test('LMS backend: authentication, isolation, grading, idempotency, persistence',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'spun-test-')),filename=join(dir,'test.sqlite');
 let app=createApp({filename});
 const listen=()=>new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));await listen();
 let origin=`http://127.0.0.1:${app.server.address().port}`;
 const request=async(path,{cookie,body,method=body?'POST':'GET',headers={}}={})=>{
  const response=await fetch(origin+path,{method,headers:{...(cookie?{cookie}:{}),...(body?{'Content-Type':'application/json','X-Learning-Hub':'1',Origin:origin}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  return{status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
 };
 let alice,bob;
 try{
  await t.test('anonymous and spoofed platform identity are rejected by standalone server',async()=>{
   assert.equal((await request('/api/me')).status,401);
   assert.equal((await request('/api/me',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'fake@example.test'}})).status,401);
  });
  await t.test('registers isolated users with hashed passwords and HttpOnly sessions',async()=>{
   const a=await request('/api/auth/register',{body:{name:'Alice Learner',email:'alice@example.test',password:'Learning-Test-Pass-2026'}});
   assert.equal(a.status,201);assert.match(a.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);alice=a.cookie;
   const b=await request('/api/auth/register',{body:{name:'Bob Learner',email:'bob@example.test',password:'Another-Test-Pass-2026'}});assert.equal(b.status,201);bob=b.cookie;
   const row=app.db.raw.prepare('SELECT password_hash FROM local_accounts WHERE email=?').get('alice@example.test');assert.match(row.password_hash,/^scrypt\$32768\$/);assert.ok(!row.password_hash.includes('Learning-Test'));
   const me=await request('/api/me',{cookie:alice});assert.equal(me.data.profile.name,'Alice Learner');assert.deepEqual(me.data.state.enrolled,[]);assert.deepEqual(me.data.state.activity,[]);
  });
  await t.test('rejects bad credentials and short passwords',async()=>{
   assert.equal((await request('/api/auth/login',{body:{email:'alice@example.test',password:'wrong-password'}})).status,401);
   assert.equal((await request('/api/auth/register',{body:{name:'Test User',email:'short@example.test',password:'short'}})).status,422);
   assert.equal((await request('/api/auth/register',{body:{name:'Another User',email:'alice@example.test',password:'Learning-Test-Pass-2026'}})).status,409);
  });
  await t.test('catalog contains content but never quiz answer keys or explanations',async()=>{
   const c=await request('/api/catalog',{cookie:alice});assert.equal(c.status,200);assert.equal(c.data.courses.length,6);
   for(const quiz of c.data.quizzes)for(const q of quiz.questions){assert.equal(q.answer,undefined);assert.equal(q.why,undefined);assert.equal(q.options.length,4);}
  });
  await t.test('rejects cross-origin writes and invalid module references',async()=>{
   assert.equal((await request('/api/courses/cx/enroll',{cookie:alice,body:{},headers:{Origin:'https://untrusted.example'}})).status,403);
   assert.equal((await request('/api/courses/cx/lessons/99/complete',{cookie:alice,body:{}})).status,404);
  });
  await t.test('completion is durable, idempotent, and scoped to the signed-in user',async()=>{
   for(let i=0;i<2;i++){const p=await request('/api/courses/cx/lessons/0/complete',{cookie:alice,body:{userId:'bob'}});assert.equal(p.status,200);assert.deepEqual(p.data.state.progress.cx,[0]);assert.equal(p.data.state.activity.length,1);assert.equal(p.data.state.activity[0].minutes,8);}
   const b=await request('/api/me',{cookie:bob});assert.deepEqual(b.data.state.progress.cx,[]);assert.deepEqual(b.data.state.enrolled,[]);
  });
  await t.test('bookmark and read status are per-account',async()=>{
   const saved=await request('/api/bookmarks',{cookie:alice,body:{kind:'article',id:'empathy',saved:true}});assert.deepEqual(saved.data.state.savedArticles,['empathy']);
   const read=await request('/api/articles/empathy/read',{cookie:alice,body:{}});assert.deepEqual(read.data.state.readArticles,['empathy']);
   assert.deepEqual((await request('/api/me',{cookie:bob})).data.state.savedArticles,[]);
   assert.equal((await request('/api/bookmarks',{cookie:alice,body:{kind:'article',id:'does-not-exist',saved:true}})).status,404);
  });
  await t.test('server calculates scores and makes retries idempotent',async()=>{
   const attemptId=randomUUID(),answers=[0,0,0,0,0];
   const a=await request('/api/quizzes/cx-quiz/attempts',{cookie:alice,body:{attemptId,answers,score:100}});assert.equal(a.status,200);assert.equal(a.data.result.score,0);assert.equal(a.data.result.review.length,5);
   const retry=await request('/api/quizzes/cx-quiz/attempts',{cookie:alice,body:{attemptId,answers}});assert.equal(retry.data.state.results['cx-quiz'].attempts,1);
   assert.equal((await request('/api/quizzes/cx-quiz/attempts',{cookie:alice,body:{attemptId,answers:[1,2,1,2,1]}})).status,409);
   const good=await request('/api/quizzes/cx-quiz/attempts',{cookie:alice,body:{attemptId:randomUUID(),answers:[0,2,1,2,1]}});assert.equal(good.data.result.score,80);assert.equal(good.data.result.passed,true);assert.equal(good.data.state.results['cx-quiz'].attempts,2);
   assert.equal((await request('/api/quizzes/cx-quiz/attempts',{cookie:alice,body:{attemptId:randomUUID(),answers:[1]}})).status,422);
   const history=await request('/api/quizzes/cx-quiz/attempts',{cookie:bob});assert.deepEqual(history.data.attempts,[]);
  });
  await t.test('data and sessions survive an actual server/database restart',async()=>{
   await app.close();app=createApp({filename});await listen();origin=`http://127.0.0.1:${app.server.address().port}`;
   const me=await request('/api/me',{cookie:alice});assert.equal(me.status,200);assert.deepEqual(me.data.state.progress.cx,[0]);assert.equal(me.data.state.results['cx-quiz'].score,80);assert.deepEqual(me.data.state.savedArticles,['empathy']);
  });
  await t.test('logout revokes the session in the database',async()=>{
   assert.equal((await request('/api/auth/logout',{cookie:alice,body:{}})).status,200);assert.equal((await request('/api/me',{cookie:alice})).status,401);
   const login=await request('/api/auth/login',{body:{email:'alice@example.test',password:'Learning-Test-Pass-2026'}});assert.equal(login.status,200);assert.ok(login.cookie);
  });
  await t.test('login throttling limits repeated guesses',async()=>{
   let status;for(let i=0;i<16;i++){status=(await request('/api/auth/login',{body:{email:'missing@example.test',password:'wrong-password'}})).status;}assert.equal(status,429);
  });
 }finally{await app.close();await rm(dir,{recursive:true,force:true});}
});
