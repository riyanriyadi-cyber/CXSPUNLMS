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

  await t.test('rich text: allowed formatting kept, scripts/handlers/foreign images stripped', async () => {
    const img = `${SUPABASE_URL}/storage/v1/object/public/lms-media/content/2026/11/b.png`;
    const html = `<p style="text-align:center;position:fixed" onclick="steal()">Halo <strong>tebal</strong> <span style="font-family:Manrope, sans-serif;font-size:18px;color:#d16527;background-color:#fff3b0">teks</span><script>alert(1)</script></p>`
      + `<p data-indent="2">indent</p><ul><li><p>poin</p></li></ul><table><tbody><tr><th><p>A</p></th></tr><tr><td colspan="1"><p>B</p></td></tr></tbody></table>`
      + `<img src="${img}" alt="diagram" data-size="m" onerror="x()"><img src="https://evil.example/x.png"><img src="data:image/png;base64,AAAA">`
      + `<a href="javascript:alert(1)">bahaya</a><a href="https://spun.global">aman</a><iframe src="https://evil.example"></iframe><style>body{display:none}</style>`;
    const draft = structuredClone(course.draft); draft.lessons[0].sections = [{heading: 'Rich', html}];
    const saved = await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft}});
    assert.equal(saved.status, 200);
    const out = saved.data.item.draft.lessons[0].sections[0].html;
    for (const bad of ['<script', 'onclick', 'onerror', 'position', 'evil.example', 'data:image', 'javascript:', '<iframe', '<style']) assert.ok(!out.includes(bad), bad);
    for (const good of ['text-align:center', '<strong>tebal</strong>', 'font-family:Manrope', 'font-size:18px', 'color:#d16527', 'background-color:#fff3b0', 'data-indent="2"', '<ul>', '<th>', `src="${img}"`, 'data-size="m"', 'href="https://spun.global"', 'rel="noopener noreferrer"']) assert.ok(out.includes(good), good);
    course = saved.data.item;
    await call(`/api/admin/content/course/${course.id}/publish`, {token: adm, body: {}});
    const learnerSection = (await call('/api/catalog', {token: lrn})).data.courses.find(c => c.id === course.id).lessons.find(l => l.sections[0]?.heading === 'Rich').sections[0];
    assert.equal(learnerSection.html, out); // tidak di-escape ganda, sudah aman
    const empty = structuredClone(course.draft); empty.lessons[0].sections = [{heading: '', html: '<p></p><p> </p>'}];
    await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft: empty}});
    assert.match((await call(`/api/admin/content/course/${course.id}/publish`, {token: adm, body: {}})).data.error, /bagian 1 masih kosong/);
    course = (await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft: course.draft}})).data.item;
    await call(`/api/admin/content/course/${course.id}/publish`, {token: adm, body: {}});
  });

  await t.test('rich text: only youtube-nocookie embeds survive', async () => {
    const draft = structuredClone(course.draft);
    draft.lessons[0].sections = [{heading: 'Video', html: '<p>a</p><div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=5" onload="x()"></iframe></div><iframe src="https://evil.example/x"></iframe><iframe srcdoc="<b>x</b>"></iframe>'}];
    const out = (await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft}})).data.item.draft.lessons[0].sections[0].html;
    assert.equal((out.match(/<iframe/g) || []).length, 1);
    assert.ok(out.includes('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=5"') && out.includes('data-youtube-video') && !out.includes('onload') && !out.includes('evil') && !out.includes('srcdoc'));
    course = (await call(`/api/admin/content/course/${course.id}`, {token: adm, body: {draft: course.draft}})).data.item;
  });

  await t.test('legacy plain-text sections are converted, not lost', async () => {
    const cx = (await call('/api/admin/content/course/cx', {token: adm})).data.item;
    assert.match(cx.draft.lessons[0].sections[0].html, /^<p>.+<\/p>$/);
    await pg.query(`update content_items set published = jsonb_set(published, '{lessons,0,sections,0}', '{"heading":"Lama","body":"Baris <b>satu</b>"}'::jsonb) where kind='course' and id='cx'`);
    const sec = (await call('/api/catalog', {token: lrn})).data.courses.find(c => c.id === 'cx').lessons[0].sections[0];
    assert.equal(sec.body, 'Baris &lt;b&gt;satu&lt;/b&gt;'); assert.equal(sec.html, undefined);
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
  await t.test('raport: own raport for learners, any raport for admins, period filter', async () => {
    const all = await call('/api/me/raport', {token: lrn});
    assert.equal(all.status, 200);
    assert.equal(all.data.user.email, 'tri@spun.global');
    const c = all.data.courses.find(c => c.id === course.id);
    assert.ok(c && c.done === 1 && c.total === 3 && c.percent === 33 && c.completedAt === null);
    assert.equal(all.data.summary.lessonsCompleted, 1);
    assert.equal(all.data.summary.minutes, 5);
    const qz = all.data.quizzes.find(q => q.title === 'Quiz Schengen');
    assert.deepEqual([qz.best, qz.last, qz.attempts, qz.passed], [100, 100, 1, true]);
    assert.equal(all.data.summary.avgBest, 100);
    assert.ok(all.data.weekly.weeks.length >= 1 && all.data.weekly.weeks.at(-1).minutes === 5 && all.data.weekly.weeks.at(-1).quizzes === 1);
    // admin melihat raport peserta lain → sama
    const viaAdmin = await call(`/api/admin/users/${L.id}/raport`, {token: adm});
    assert.equal(viaAdmin.status, 200); assert.equal(viaAdmin.data.summary.lessonsCompleted, 1);
    // peserta tidak bisa melihat raport orang lain
    assert.equal((await call(`/api/admin/users/${ADM.id}/raport`, {token: lrn})).status, 403);
    // periode di masa lalu: belum ada aktivitas, course belum diikuti
    const past = await call('/api/me/raport?from=2020-01-01&to=2020-01-31', {token: lrn});
    assert.equal(past.data.summary.lessonsCompleted, 0); assert.equal(past.data.courses.length, 0); assert.equal(past.data.quizzes.length, 0);
    assert.deepEqual(past.data.period, {from: '2020-01-01', to: '2020-01-31'});
    assert.equal(past.data.weekly.weeks.length, 5);
    // data lama di luar periode tidak ikut; data lama sebelum periode tetap dihitung kumulatif untuk progres course
    await pg.query(`update lesson_progress set completed_at = '2025-01-10T10:00:00+07:00' where user_id=$1`, [L.id]);
    const thisYear = await call('/api/me/raport?from=2026-01-01', {token: lrn});
    const c2 = thisYear.data.courses.find(c => c.id === course.id);
    assert.equal(thisYear.data.summary.lessonsCompleted, 0); assert.equal(c2.done, 1); assert.equal(c2.lessonsInPeriod, 0);
    // validasi
    assert.equal((await call('/api/me/raport?from=2026-13-01', {token: lrn})).status, 422);
    assert.equal((await call('/api/me/raport?from=2026-02-01&to=2026-01-01', {token: lrn})).status, 422);
    // akun undangan yang belum pernah login tetap punya raport kosong
    const invited = (await call('/api/admin/users', {token: adm})).data.users.find(u => u.status === 'invited');
    const ri = await call(`/api/admin/users/${invited.id}/raport`, {token: adm});
    assert.equal(ri.status, 200); assert.equal(ri.data.summary.coursesFollowed, 0);
  });
  await t.test('scores matrix: best/last/attempts per user × quiz, period filter, admin only', async () => {
    const quizId = (await call('/api/catalog', {token: lrn})).data.quizzes.find(q => q.title === 'Quiz Schengen').id;
    await call(`/api/quizzes/${quizId}/attempts`, {token: lrn, body: {attemptId: randomUUID(), answers: [0]}});
    await call(`/api/quizzes/${quizId}/attempts`, {token: adm, body: {attemptId: randomUUID(), answers: [1]}});
    const r = await call('/api/admin/scores', {token: adm});
    assert.equal(r.status, 200);
    assert.ok(r.data.quizzes.some(q => q.id === quizId && q.questions === 1));
    assert.deepEqual(r.data.cells[L.id][quizId], {...r.data.cells[L.id][quizId], best: 100, last: 0, attempts: 2});
    assert.equal(r.data.cells[ADM.id][quizId].best, 100);
    assert.ok(r.data.users.some(u => u.status === 'invited'));
    assert.ok(r.data.users.find(u => u.id === ADM.id).role === 'admin');
    const past = await call('/api/admin/scores?from=2020-01-01&to=2020-12-31', {token: adm});
    assert.deepEqual(past.data.cells, {}); assert.deepEqual(past.data.period, {from: '2020-01-01', to: '2020-12-31'});
    assert.equal((await call('/api/admin/scores', {token: lrn})).status, 403);
    assert.equal((await call('/api/admin/scores?to=2026-99-01', {token: adm})).status, 422);
  });
  await t.test('essay quiz: pending until graded, rubric hidden, points-weighted score, everywhere consistent', async () => {
    const created = (await call('/api/admin/content/quiz', {token: adm, body: {draft: {title: 'Quiz Essay Visa', category: 'Visa', description: 'Campuran', course: course.id, questions: [
      {type: 'mc', q: 'Coverage minimal?', options: ['EUR 10.000', 'EUR 30.000'], answer: 1, why: 'Aturan', points: 2},
      {type: 'essay', q: 'Jelaskan cara menangani tamu yang dokumennya kurang.', points: 8, rubric: 'RAHASIA-RUBRIK: empati + solusi'}
    ]}}})).data.item;
    assert.equal((await call(`/api/admin/content/quiz/${created.id}/publish`, {token: adm, body: {}})).status, 200);
    const pub = (await call('/api/catalog', {token: lrn})).data.quizzes.find(q => q.id === created.id);
    assert.deepEqual(pub.questions.map(q => [q.type, q.points, q.options.length]), [['mc', 2, 2], ['essay', 8, 0]]);
    assert.ok(!JSON.stringify(pub).includes('RAHASIA'));
    // jawaban essay wajib diisi
    assert.equal((await call(`/api/quizzes/${created.id}/attempts`, {token: lrn, body: {attemptId: randomUUID(), answers: [1, '  ']}})).status, 422);
    const attemptId = randomUUID();
    const sub = await call(`/api/quizzes/${created.id}/attempts`, {token: lrn, body: {attemptId, answers: [1, 'Saya akan berempati lalu memberi daftar dokumen.']}});
    assert.equal(sub.status, 200);
    assert.equal(sub.data.result.status, 'pending'); assert.equal(sub.data.result.score, null); assert.equal(sub.data.result.earnedPoints, 2); assert.equal(sub.data.result.maxPoints, 10);
    assert.ok(!JSON.stringify(sub.data).includes('RAHASIA'));
    assert.equal(sub.data.state.pending[created.id], 1); assert.equal(sub.data.state.results[created.id], undefined);
    // admin: antrean & badge
    assert.equal((await call('/api/admin/grading/count', {token: adm})).data.pending, 1);
    const list = (await call('/api/admin/grading', {token: adm})).data.items;
    assert.equal(list.length, 1); assert.equal(list[0].quizTitle, 'Quiz Essay Visa'); assert.equal(list[0].name, 'Tri Learner');
    const detail = (await call(`/api/admin/grading/${L.id}/${attemptId}`, {token: adm})).data.attempt;
    assert.equal(detail.review[1].rubric, 'RAHASIA-RUBRIK: empati + solusi'); assert.equal(detail.review[1].answerText, 'Saya akan berempati lalu memberi daftar dokumen.');
    // nilai pending tidak masuk matriks/raport sebagai skor
    let cell = (await call('/api/admin/scores', {token: adm})).data.cells[L.id][created.id];
    assert.deepEqual([cell.best, cell.pending, cell.attempts], [null, 1, 1]);
    const rp = (await call('/api/me/raport', {token: lrn})).data.quizzes.find(q => q.id === created.id);
    assert.deepEqual([rp.best, rp.pending, rp.passed], [null, 1, false]);
    // validasi nilai
    assert.equal((await call(`/api/admin/grading/${L.id}/${attemptId}`, {token: adm, body: {grades: [{index: 1, earned: 9}]}})).status, 422);
    assert.equal((await call(`/api/admin/grading/${L.id}/${attemptId}`, {token: adm, body: {grades: [{index: 1, earned: 2.3}]}})).status, 422);
    assert.equal((await call(`/api/admin/grading/${L.id}/${attemptId}`, {token: lrn, body: {grades: [{index: 1, earned: 8}]}})).status, 403);
    const g = await call(`/api/admin/grading/${L.id}/${attemptId}`, {token: adm, body: {grades: [{index: 1, earned: 6.5, feedback: 'Bagus, tambahkan opsi alternatif.'}]}});
    assert.equal(g.status, 200); assert.equal(g.data.score, 85); assert.equal(g.data.pending, 0); // (2 + 6,5) / 10
    // peserta melihat hasil akhir + rubrik sebagai pembahasan + komentar
    const hist = (await call(`/api/quizzes/${created.id}/attempts`, {token: lrn})).data.attempts[0];
    assert.equal(hist.status, 'graded'); assert.equal(hist.score, 85); assert.equal(hist.passed, true);
    assert.equal(hist.review[1].why, 'RAHASIA-RUBRIK: empati + solusi'); assert.equal(hist.review[1].feedback, 'Bagus, tambahkan opsi alternatif.'); assert.equal(hist.review[1].earned, 6.5);
    const me = (await call('/api/me', {token: lrn})).data.state;
    assert.equal(me.results[created.id].score, 85); assert.equal(me.pending[created.id], undefined);
    cell = (await call('/api/admin/scores', {token: adm})).data.cells[L.id][created.id];
    assert.deepEqual([cell.best, cell.pending], [85, 0]);
    assert.equal((await call('/api/admin/grading?status=graded', {token: adm})).data.items[0].grader, 'Nia Admin');
    // MC-only quiz tetap langsung dinilai dengan poin
    const r = (await call('/api/admin/report', {token: adm})).data.quizzes.find(q => q.id === created.id);
    assert.equal(r.passed, 1);
  });

  await t.test('import quizzes from spreadsheet rows: dry run, row errors, create & replace as draft', async () => {
    const bad = await call('/api/admin/import/quizzes', {token: adm, body: {dryRun: true, quizzes: [
      {row: 2, title: 'Impor A', category: 'Visa', questions: [
        {row: 2, type: 'PG', q: 'Soal 1', options: ['a', 'b'], answer: 'C', explanation: ''},
        {row: 3, type: 'Esai', q: '', points: 5},
        {row: 4, type: 'Kuis', q: 'x'}
      ]},
      {row: 5, id: 'tidak-ada', questions: [{row: 5, type: 'PG', q: 'x', options: ['a', 'b'], answer: 'A'}]}
    ]}});
    assert.equal(bad.data.ok, false);
    assert.deepEqual(bad.data.errors.map(e => e.row), [2, 3, 4, 5]);
    assert.match(bad.data.errors[0].message, /jawaban_benar harus huruf A–B/);
    const existing = (await call('/api/admin/export/quizzes', {token: adm})).data.quizzes.find(q => q.id === 'cx-quiz');
    assert.equal(existing.questions.length, 5);
    const good = {quizzes: [
      {row: 2, title: 'Impor Baru', category: 'Visa', description: 'Dari Excel', questions: [
        {row: 2, type: 'PG', q: 'Ibu kota Jepang?', options: ['Osaka', 'Tokyo', '', ''], answer: 'b', explanation: 'Tokyo', points: 2},
        {row: 3, type: 'Essay', q: 'Jelaskan proses visa Jepang.', explanation: 'Rubrik: dokumen, alur', points: 10}
      ]},
      {row: 4, id: 'cx-quiz', title: '', questions: [{row: 4, type: 'PG', q: 'Satu soal pengganti', options: ['Ya', 'Tidak'], answer: 'A'}]}
    ]};
    const dry = await call('/api/admin/import/quizzes', {token: adm, body: {...good, dryRun: true}});
    assert.equal(dry.data.ok, true); assert.deepEqual(dry.data.summary, {create: 1, update: 1, questions: 3});
    assert.equal(dry.data.items.find(i => i.id === 'cx-quiz').published, true);
    assert.equal((await call('/api/admin/content/quiz/cx-quiz', {token: adm})).data.item.draft.questions.length, 5); // dry run tidak menyimpan
    const done = await call('/api/admin/import/quizzes', {token: adm, body: {...good, dryRun: false}});
    assert.equal(done.data.ok, true);
    const cx = (await call('/api/admin/content/quiz/cx-quiz', {token: adm})).data.item;
    assert.equal(cx.draft.questions.length, 1); assert.equal(cx.status, 'changed'); assert.equal(cx.draft.title, 'Customer Experience Fundamentals');
    assert.equal((await call('/api/catalog', {token: lrn})).data.quizzes.find(q => q.id === 'cx-quiz').questions.length, 5); // peserta belum terpengaruh
    const neu = (await call('/api/admin/export/quizzes', {token: adm})).data.quizzes.find(q => q.title === 'Impor Baru');
    assert.deepEqual(neu.questions.map(q => [q.type, q.points]), [['mc', 2], ['essay', 10]]);
    assert.equal(neu.questions[0].answer, 1); assert.equal(neu.questions[1].rubric, 'Rubrik: dokumen, alur'); assert.equal(neu.published, false);
    assert.equal((await call('/api/admin/import/quizzes', {token: lrn, body: good})).status, 403);
  });
  await pg.close();
});
