// Uji panel admin: akses, materi draft/publish, konflik edit, progres per ID modul, media, peserta, laporan.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setupApp, SUPABASE_URL} from './helpers.mjs';
import {youtubeId} from '../server/content.mjs';

test('Admin panel API', async t => {
  const {pg, call, addUser, adminCalls, origin} = await setupApp();
  const ADM = await addUser('admin', {name: 'Nia Admin', email: 'nia@spun.global'});
  const L = await addUser('learner', {name: 'Tri Learner', email: 'tri@spun.global'});
  await call('/api/me', {token: ADM.token}); await call('/api/me', {token: L.token});
  await pg.query("update public.users set role='admin' where email='nia@spun.global'");
  const adm = ADM.token, lrn = L.token;

  await t.test('learners cannot reach admin API; admins see role in profile', async () => {
    assert.equal((await call('/api/admin/content', {token: lrn})).status, 403);
    assert.equal((await call('/api/admin/users/invite', {token: lrn, body: {email: 'x@y.co', name: 'X Y'}})).status, 403);
    assert.equal((await call('/api/me', {token: adm})).data.profile.role, 'admin');
  });

  await t.test('seeded content is listed as published', async () => {
    const r = await call('/api/admin/content', {token: adm});
    assert.equal(r.status, 200);
    assert.equal(r.data.items.filter(i => i.kind === 'course').length, 6);
    assert.ok(r.data.items.every(i => i.status === 'published'));
    const cx = (await call('/api/admin/content/course/cx', {token: adm})).data.item;
    assert.equal(cx.draft.lessons[0].id, 'cx-m1'); assert.equal(typeof cx.draft.lessons[0].sections[0].heading, 'string');
  });

  let course;
  await t.test('new course stays hidden from learners until published', async () => {
    const r = await call('/api/admin/content/course', {token: adm, body: {draft: {title: 'Visa Schengen Dasar', category: 'Visa Knowledge', description: 'Pengantar', lessons: []}}});
    assert.equal(r.status, 201); course = r.data.item;
    assert.equal(course.id, 'visa-schengen-dasar'); assert.equal(course.status, 'draft');
    assert.ok(!(await call('/api/catalog', {token: lrn})).data.courses.some(c => c.id === course.id));
    const pub = await call(`/api/admin/content/course/${course.id}/publish`, {token: adm, body: {}});
    assert.equal(pub.status, 422); assert.match(pub.data.error, /minimal 1 modul/);
  });

  await t.test('save draft with image + YouTube, publish, learner sees escaped content', async () => {
    const draft = {...course.draft, lessons: [
      {title: 'Dokumen <b>wajib</b>', duration: 10, intro: 'Kenali dokumen.', sections: [
        {heading: 'Paspor', body: 'Masa berlaku minimal 3 bulan.\n\nCek halaman kosong.', image: {url: `${SUPABASE_URL}/storage/v1/object/public/lms-media/content/2026/11/a.png`, alt: 'Contoh paspor'}, video: {url: 'https://youtu.be/dQw4w9WgXcQ'}}
      ]},
      {title: 'Asuransi', duration: 5, intro: 'Minimal coverage EUR 30.000.', sections: []}
    ]};
    const saved = await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft, baseRevision: course.revision}});
    assert.equal(saved.status, 200); course = saved.data.item;
    assert.equal(course.draft.lessons[0].sections[0].video.youtubeId, 'dQw4w9WgXcQ');
    assert.equal((await call(`/api/admin/content/course/${course.id}/publish`, {token: adm, body: {}})).data.item.status, 'published');
    const c = (await call('/api/catalog', {token: lrn})).data.courses.find(c => c.id === course.id);
    assert.equal(c.lessons[0].title, 'Dokumen &lt;b&gt;wajib&lt;/b&gt;');
    assert.equal(c.minutes, 15); assert.equal(c.label, 'VISA KNOWLEDGE');
  });

  await t.test('editing a published course creates pending changes, not live changes', async () => {
    const draft = structuredClone(course.draft); draft.title = 'Visa Schengen Lengkap';
    const saved = await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft, baseRevision: course.revision}});
    assert.equal(saved.data.item.status, 'changed');
    assert.equal((await call('/api/catalog', {token: lrn})).data.courses.find(c => c.id === course.id).title, 'Visa Schengen Dasar');
    const stale = await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft, baseRevision: course.revision}});
    assert.equal(stale.status, 409); assert.match(stale.data.error, /Nia Admin/);
    course = saved.data.item;
  });

  await t.test('progress follows lesson IDs when modules are reordered or inserted', async () => {
    const second = course.draft.lessons[1].id;
    await call(`/api/courses/${course.id}/lessons/1/complete`, {token: lrn, body: {lessonId: second}});
    const draft = structuredClone(course.draft);
    draft.lessons = [{title: 'Modul baru di depan', duration: 3, intro: 'Halo', sections: []}, draft.lessons[1], draft.lessons[0]];
    course = (await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft, baseRevision: course.revision}})).data.item;
    await call(`/api/admin/content/course/${course.id}/publish`, {token: adm, body: {}});
    const st = (await call('/api/me', {token: lrn})).data.state;
    assert.deepEqual(st.progress[course.id], [1]); // "Asuransi" kini di posisi 2 (indeks 1)
  });

  await t.test('validation errors are specific', async () => {
    const bad = structuredClone(course.draft); bad.lessons[0].sections = [{heading: 'x', image: {url: 'https://evil.example/x.png'}}];
    const r = await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft: bad}});
    assert.equal(r.status, 422); assert.match(r.data.error, /Modul 1, bagian 1: gambar/);
    bad.lessons[0].sections = [{heading: 'x', video: {url: 'https://vimeo.com/123'}}];
    assert.match((await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft: bad}})).data.error, /YouTube/);
    assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1'), 'dQw4w9WgXcQ');
    assert.equal(youtubeId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  await t.test('quiz: answers stay server-side, publish requires correct answers', async () => {
    const q = (await call('/api/admin/content/quiz', {token: adm, body: {draft: {title: 'Quiz Schengen', category: 'Visa', description: 'Uji', course: course.id, questions: [{q: 'Coverage asuransi minimal?', options: ['EUR 10.000', 'EUR 30.000'], answer: null, why: 'Aturan Schengen'}]}}})).data.item;
    assert.match((await call(`/api/admin/content/quiz/${q.id}/publish`, {token: adm, body: {}})).data.error, /pilih jawaban yang benar/);
    const d = structuredClone(q.draft); d.questions[0].answer = 1;
    await call(`/api/admin/content/quiz/${q.id}`, {token: adm, body: {draft: d}});
    assert.equal((await call(`/api/admin/content/quiz/${q.id}/publish`, {token: adm, body: {}})).status, 200);
    const pubQ = (await call('/api/catalog', {token: lrn})).data.quizzes.find(x => x.id === q.id);
    assert.equal(pubQ.questions[0].answer, undefined);
    const res = await call(`/api/quizzes/${q.id}/attempts`, {token: lrn, body: {attemptId: randomUUID(), answers: [1]}});
    assert.equal(res.data.result.score, 100);
  });

  await t.test('unpublish hides content, delete only after unpublish, reorder works', async () => {
    assert.equal((await call(`/api/admin/content/article/empathy/delete`, {token: adm, body: {}})).status, 409);
    await call('/api/admin/content/article/empathy/unpublish', {token: adm, body: {}});
    assert.ok(!(await call('/api/catalog', {token: lrn})).data.articles.some(a => a.id === 'empathy'));
    assert.equal((await call('/api/admin/content/article/empathy/delete', {token: adm, body: {}})).status, 200);
    await call('/api/admin/content/course/reorder', {token: adm, body: {ids: [course.id, 'cx']}});
    assert.equal((await call('/api/catalog', {token: lrn})).data.courses[0].id, course.id);
  });

  await t.test('image upload URL is signed server-side with type/size limits', async () => {
    assert.equal((await call('/api/admin/media/upload-url', {token: adm, body: {contentType: 'application/pdf', size: 10}})).status, 422);
    assert.equal((await call('/api/admin/media/upload-url', {token: adm, body: {contentType: 'image/png', size: 6 * 1024 * 1024}})).status, 422);
    const r = await call('/api/admin/media/upload-url', {token: adm, body: {contentType: 'image/webp', size: 2000}});
    assert.equal(r.status, 200);
    assert.match(r.data.publicUrl, /^https:\/\/demo\.supabase\.co\/storage\/v1\/object\/public\/lms-media\/content\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);
    assert.match(r.data.uploadUrl, /upload\/sign\/lms-media\//);
  });

  await t.test('users: list, invite, role, disable (blocks access), self-protection', async () => {
    const list = (await call('/api/admin/users', {token: adm})).data.users;
    assert.deepEqual(list.map(u => u.name), ['Nia Admin', 'Tri Learner']);
    const inv = await call('/api/admin/users/invite', {token: adm, body: {email: 'Freelancer@Gmail.com', name: 'Budi Freelancer', role: 'learner'}});
    assert.equal(inv.status, 201);
    assert.deepEqual(adminCalls.find(c => c[0] === 'invite'), ['invite', 'freelancer@gmail.com', 'Budi Freelancer', origin + '/']);
    const budi = inv.data.users.find(u => u.email === 'freelancer@gmail.com');
    assert.equal(budi.status, 'invited');
    assert.equal((await call('/api/admin/users/invite', {token: adm, body: {email: 'freelancer@gmail.com', name: 'Budi'}})).status, 409);
    assert.equal((await call(`/api/admin/users/${ADM.id}/role`, {token: adm, body: {role: 'learner'}})).status, 409);
    await call(`/api/admin/users/${L.id}/role`, {token: adm, body: {role: 'admin'}});
    assert.equal((await call('/api/admin/content', {token: lrn})).status, 200);
    await call(`/api/admin/users/${L.id}/role`, {token: adm, body: {role: 'learner'}});
    assert.equal((await call('/api/admin/content', {token: lrn})).status, 403);
    const dis = await call(`/api/admin/users/${L.id}/status`, {token: adm, body: {status: 'disabled'}});
    assert.equal(dis.data.users.find(u => u.id === L.id).status, 'disabled');
    assert.ok(adminCalls.some(c => c[0] === 'ban' && c[1] === L.id && c[2] === true));
    const blocked = await call('/api/me', {token: lrn});
    assert.equal(blocked.status, 403); assert.equal(blocked.data.code, 'disabled');
    await call(`/api/admin/users/${L.id}/status`, {token: adm, body: {status: 'active'}});
    assert.equal((await call('/api/me', {token: lrn})).status, 200);
  });

  await t.test('user detail and report reflect progress', async () => {
    const d = (await call(`/api/admin/users/${L.id}`, {token: adm})).data;
    const c = d.courses.find(c => c.id === course.id);
    assert.deepEqual([c.done, c.total], [1, 3]);
    assert.equal(d.quizzes.find(q => q.title === 'Quiz Schengen').best, 100);
    const r = (await call('/api/admin/report', {token: adm})).data;
    const rc = r.courses.find(c => c.id === course.id);
    assert.deepEqual([rc.enrolled, rc.completed, rc.avgProgress], [1, 0, 33]);
    assert.equal(r.quizzes.find(q => q.title === 'Quiz Schengen').passed, 1);
    assert.equal(r.users.length, 3);
  });
  await pg.close();
});
