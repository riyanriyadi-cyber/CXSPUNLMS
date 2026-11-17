import catalog from './catalog.json' with {type:'json'};

export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
export const fail=(status,message)=>{throw new HttpError(status,message);};
export const sql=(db,query,...args)=>db.prepare(query).bind(...args);
const courseById=id=>catalog.courses.find(c=>c.id===id)||fail(404,'Course tidak ditemukan.');
const quizById=id=>catalog.quizzes.find(q=>q.id===id)||fail(404,'Quiz tidak ditemukan.');
const articleById=id=>catalog.articles.find(a=>a.id===id)||fail(404,'Artikel tidak ditemukan.');
export function protectMutation(request,origin=new URL(request.url).origin){
 if(['GET','HEAD'].includes(request.method))return;
 if(request.headers.get('origin')!==origin||request.headers.get('x-learning-hub')!=='1')fail(403,'Permintaan tidak diizinkan. Muat ulang halaman.');
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'Gunakan Content-Type application/json.');
}
export async function bodyJSON(request){
 if(Number(request.headers.get('content-length')||0)>16384)fail(413,'Permintaan terlalu besar.');
 const reader=request.body?.getReader();if(!reader)fail(400,'Body JSON diperlukan.');
 const chunks=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();fail(413,'Permintaan terlalu besar.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 try{const parsed=JSON.parse(new TextDecoder().decode(bytes));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(400,'Body harus berupa objek JSON.');return parsed;}catch(e){if(e instanceof HttpError)throw e;fail(400,'JSON tidak valid.');}
}
export function safeCatalog(){return{
 courses:catalog.courses.map(({progress,...c})=>c),
 quizzes:catalog.quizzes.map(q=>({...q,questions:q.questions.map(({q,options})=>({q,options}))})),
 articles:catalog.articles
};}
export async function ensureUser(db,profile){
 await sql(db,'INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email',profile.id,profile.name,profile.email,new Date().toISOString()).run();
}
export async function learningState(db,userId){
 const [p,e,b,r,a]=await Promise.all([
 sql(db,'SELECT course_id,lesson_index,completed_at FROM lesson_progress WHERE user_id=? ORDER BY completed_at',userId).all(),
 sql(db,'SELECT course_id FROM enrollments WHERE user_id=? ORDER BY created_at',userId).all(),
 sql(db,'SELECT kind,content_id FROM bookmarks WHERE user_id=? ORDER BY created_at',userId).all(),
 sql(db,'SELECT article_id FROM article_reads WHERE user_id=?',userId).all(),
 sql(db,'SELECT quiz_id,score,created_at FROM quiz_attempts WHERE user_id=? ORDER BY created_at,attempt_id',userId).all()
 ]);
 const progress=Object.fromEntries(catalog.courses.map(c=>[c.id,[]]));
 const activity=[];
 const dateFormat=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'});
 for(const row of p.results){const c=catalog.courses.find(c=>c.id===row.course_id),lesson=c?.lessons[row.lesson_index];if(!lesson)continue;progress[c.id].push(row.lesson_index);activity.push({date:dateFormat.format(new Date(row.completed_at)),minutes:lesson.duration});}
 const results={};for(const row of a.results){const prev=results[row.quiz_id];results[row.quiz_id]={score:Math.max(prev?.score||0,row.score),lastScore:row.score,attempts:(prev?.attempts||0)+1,date:row.created_at};}
 return{version:2,progress,enrolled:e.results.map(x=>x.course_id),savedCourses:b.results.filter(x=>x.kind==='course').map(x=>x.content_id),savedArticles:b.results.filter(x=>x.kind==='article').map(x=>x.content_id),readArticles:r.results.map(x=>x.article_id),results,activity};
}
function attemptResult(record,q){const review=JSON.parse(record.review);return {id:record.attempt_id,score:record.score,correct:review.filter(r=>r.correct).length,total:review.length,passed:record.score>=80,answers:JSON.parse(record.answers),review,quizId:q.id,createdAt:record.created_at};}
export async function api(request,{db,user,origin}){
 try{
  if(!user?.id)fail(401,'Silakan masuk untuk melanjutkan.');
  const path=new URL(request.url).pathname,method=request.method;
  protectMutation(request,origin);
  if(path==='/api/catalog'&&method==='GET')return json(safeCatalog());
  if(path==='/api/me'&&method==='GET')return json({profile:user,state:await learningState(db,user.id)});
  let m;
  if(method==='POST'&&(m=path.match(/^\/api\/courses\/([a-z-]+)\/enroll$/))){
   courseById(m[1]);await bodyJSON(request);await sql(db,'INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING',user.id,m[1],new Date().toISOString()).run();
  }else if(method==='POST'&&(m=path.match(/^\/api\/courses\/([a-z-]+)\/lessons\/(\d+)\/complete$/))){
   const c=courseById(m[1]),index=Number(m[2]);if(!Number.isSafeInteger(index)||!c.lessons[index])fail(404,'Modul tidak ditemukan.');await bodyJSON(request);const now=new Date().toISOString();
   await db.batch([sql(db,'INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING',user.id,c.id,now),sql(db,'INSERT INTO lesson_progress(user_id,course_id,lesson_index,completed_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING',user.id,c.id,index,now)]);
  }else if(path==='/api/bookmarks'&&method==='POST'){
   const data=await bodyJSON(request);if(!['course','article'].includes(data.kind)||typeof data.saved!=='boolean'||typeof data.id!=='string')fail(422,'Jenis, ID, dan status simpan tidak valid.');
   (data.kind==='course'?courseById:articleById)(data.id);
   if(data.saved)await sql(db,'INSERT INTO bookmarks(user_id,kind,content_id,created_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING',user.id,data.kind,data.id,new Date().toISOString()).run();
   else await sql(db,'DELETE FROM bookmarks WHERE user_id=? AND kind=? AND content_id=?',user.id,data.kind,data.id).run();
  }else if(method==='POST'&&(m=path.match(/^\/api\/articles\/([a-z-]+)\/read$/))){
   articleById(m[1]);await bodyJSON(request);await sql(db,'INSERT INTO article_reads(user_id,article_id,read_at) VALUES(?,?,?) ON CONFLICT DO NOTHING',user.id,m[1],new Date().toISOString()).run();
  }else if(method==='POST'&&(m=path.match(/^\/api\/quizzes\/([a-z-]+)\/attempts$/))){
   const q=quizById(m[1]),data=await bodyJSON(request);
   if(typeof data.attemptId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.attemptId))fail(422,'ID percobaan tidak valid.');
   if(!Array.isArray(data.answers)||data.answers.length!==q.questions.length||data.answers.some((v,i)=>!Number.isInteger(v)||v<0||v>=q.questions[i].options.length))fail(422,'Jawab semua pertanyaan dengan pilihan yang valid.');
   const review=q.questions.map((question,i)=>({q:question.q,options:question.options,selected:data.answers[i],answer:question.answer,correct:data.answers[i]===question.answer,why:question.why}));
   const score=Math.round(review.filter(x=>x.correct).length/review.length*100),now=new Date().toISOString();
   await sql(db,'INSERT INTO quiz_attempts(user_id,attempt_id,quiz_id,score,answers,review,content_version,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',user.id,data.attemptId,q.id,score,JSON.stringify(data.answers),JSON.stringify(review),'1',now).run();
   const record=await sql(db,'SELECT * FROM quiz_attempts WHERE user_id=? AND attempt_id=?',user.id,data.attemptId).first();
   if(record.quiz_id!==q.id||record.answers!==JSON.stringify(data.answers))fail(409,'ID percobaan telah digunakan untuk jawaban yang berbeda.');
   return json({result:attemptResult(record,q),state:await learningState(db,user.id)});
  }else if(method==='GET'&&(m=path.match(/^\/api\/quizzes\/([a-z-]+)\/attempts$/))){
   const q=quizById(m[1]);const records=await sql(db,'SELECT * FROM quiz_attempts WHERE user_id=? AND quiz_id=? ORDER BY created_at DESC LIMIT 50',user.id,q.id).all();return json({attempts:records.results.map(r=>attemptResult(r,q))});
  }else fail(404,'Endpoint tidak ditemukan.');
  return json({state:await learningState(db,user.id)});
 }catch(error){if(!(error instanceof HttpError))console.error('Learning API error:',error.message);return json({error:error instanceof HttpError?error.message:'Server mengalami kendala. Coba lagi.'},error.status||500);}
}
