import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/sqlite.mjs';
import {ensureUser,api,safeCatalog} from '../server/core.mjs';

test('hosted API: platform profiles and per-user D1-compatible operations',async()=>{
 const db=openDatabase(':memory:');
 try{
  const user={id:'platform-user-alpha',name:'Learner Alpha',email:'alpha@example.test'};
  await ensureUser(db,user);
  const response=await api(new Request('https://learning.example.test/api/me'),{db,user,origin:'https://learning.example.test'});
  assert.equal(response.status,200);assert.equal((await response.json()).profile.id,user.id);
  const completion=await api(new Request('https://learning.example.test/api/courses/cx/lessons/0/complete',{method:'POST',headers:{Origin:'https://learning.example.test','X-Learning-Hub':'1','Content-Type':'application/json'},body:'{}'}),{db,user,origin:'https://learning.example.test'});
  assert.equal(completion.status,200);assert.deepEqual((await completion.json()).state.progress.cx,[0]);
  await ensureUser(db,{...user,name:'Updated Name'});assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM users').get().n,1);
  const anonymous=await api(new Request('https://learning.example.test/api/me'),{db,user:null,origin:'https://learning.example.test'});assert.equal(anonymous.status,401);
  assert.ok(safeCatalog().quizzes.every(q=>q.questions.every(x=>!('answer' in x))));
 }finally{db.close();}
});
