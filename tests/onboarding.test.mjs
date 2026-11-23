// Uji program onboarding: assign saat undang, kunci akses, syarat selesai (modul + quiz lulus), aksi admin.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setupApp} from './helpers.mjs';

test('Onboarding karyawan baru', async t => {
  const {pg, call, addUser} = await setupApp();
  const ADM = await addUser('admin', {name: 'Nia Admin', email: 'nia@spun.global'});
  await call('/api/me', {token: ADM.token});
  await pg.query("update public.users set role='admin' where email='nia@spun.global'");
  const adm = ADM.token;
  const OLD = await addUser('old', {name: 'Lama Learner', email: 'lama@spun.global'});
  await call('/api/me', {token: OLD.token});

  const cx = (await call('/api/catalog', {token: adm})).data.courses.find(c => c.id === 'cx');
  const cxQuiz = (await call('/api/catalog', {token: adm})).data.quizzes.find(q => q.course === 'cx');
  assert.ok(cxQuiz, 'seed punya quiz yang ditautkan ke cx');

  await t.test('pengaturan program divalidasi dan disimpan', async () => {
    assert.equal((await call('/api/admin/onboarding/settings', {token: adm, body: {courses: ['tidak-ada'], days: 14}})).status, 422);
    assert.equal((await call('/api/admin/onboarding/settings', {token: adm, body: {courses: ['cx'], days: 0}})).status, 422);
    const r = await call('/api/admin/onboarding/settings', {token: adm, body: {courses: ['cx', 'cx'], days: 14}});
    assert.equal(r.status, 200);
    assert.deepEqual(r.data.settings, {courses: ['cx'], byTeam: {}, days: 14});
    assert.equal(r.data.programTotal, 1);
  });

  await t.test('undangan peserta otomatis wajib onboarding; status belum login', async () => {
    const r = await call('/api/admin/users/invite', {token: adm, body: {email: 'baru@spun.global', name: 'Karyawan Baru'}});
    assert.equal(r.status, 201);
    const u = r.data.users.find(x => x.email === 'baru@spun.global');
    assert.equal(u.onboarding, 'not_started');
    const ov = (await call('/api/admin/onboarding', {token: adm})).data;
    assert.equal(ov.people.length, 1); assert.equal(ov.people[0].status, 'not_started');
  });

  await t.test('peserta lama tidak terkunci', async () => {
    const me = (await call('/api/me', {token: OLD.token})).data;
    assert.equal(me.state.onboarding.status, 'none');
    const cat = (await call('/api/catalog', {token: OLD.token})).data;
    assert.ok(cat.courses.every(c => !c.locked));
    assert.equal((await call('/api/courses/service/enroll', {token: OLD.token, body: {}})).status, 200);
  });

  await t.test('assign manual: terkunci, hanya course onboarding & quiz-nya yang terbuka', async () => {
    const L = await addUser('l2', {name: 'Peserta Dua', email: 'dua@spun.global'});
    await call('/api/me', {token: L.token});
    const uid = (await pg.query("select id from public.users where email='dua@spun.global'")).rows[0].id;
    assert.equal((await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'extend', days: 3}})).status, 409);
    assert.equal((await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'assign'}})).status, 200);

    const me = (await call('/api/me', {token: L.token})).data.state.onboarding;
    assert.equal(me.status, 'active'); assert.equal(me.daysLeft, 14); assert.equal(me.total, 1);
    assert.equal(me.courses[0].lessonsTotal, cx.lessons.length);

    const cat = (await call('/api/catalog', {token: L.token})).data;
    const other = cat.courses.find(c => c.id === 'service');
    assert.equal(other.locked, true); assert.deepEqual(other.lessons[0].sections, []);
    assert.ok(!cat.courses.find(c => c.id === 'cx').locked);
    assert.ok(cat.articles.every(a => a.locked && a.sections.length === 0));
    assert.ok(!cat.quizzes.find(q => q.id === cxQuiz.id).locked);
    const lockedQuiz = cat.quizzes.find(q => q.id !== cxQuiz.id);
    assert.equal(lockedQuiz.locked, true); assert.ok(lockedQuiz.questions.every(q => q.q === ''));

    assert.equal((await call('/api/courses/service/enroll', {token: L.token, body: {}})).status, 403);
    assert.equal((await call('/api/courses/service/lessons/0/complete', {token: L.token, body: {}})).status, 403);
    assert.equal((await call('/api/articles/empathy/read', {token: L.token, body: {}})).status, 403);
    assert.equal((await call(`/api/quizzes/${lockedQuiz.id}/attempts`, {token: L.token, body: {attemptId: randomUUID(), answers: []}})).status, 403);
    assert.equal((await call('/api/me/raport', {token: L.token})).status, 200);

    // selesaikan semua modul → belum selesai karena quiz belum lulus
    let st;
    for (let i = 0; i < cx.lessons.length; i++) st = (await call(`/api/courses/cx/lessons/${i}/complete`, {token: L.token, body: {}})).data.state;
    assert.equal(st.onboarding.status, 'active'); assert.equal(st.onboarding.courses[0].lessonsDone, cx.lessons.length);
    // quiz gagal
    const quiz = (await pg.query("select published from content_items where kind='quiz' and id=$1", [cxQuiz.id])).rows[0].published;
    const wrong = quiz.questions.map(q => (q.answer + 1) % q.options.length);
    st = (await call(`/api/quizzes/${cxQuiz.id}/attempts`, {token: L.token, body: {attemptId: randomUUID(), answers: wrong}})).data.state;
    assert.equal(st.onboarding.status, 'active');
    // quiz lulus → selesai, akses terbuka
    st = (await call(`/api/quizzes/${cxQuiz.id}/attempts`, {token: L.token, body: {attemptId: randomUUID(), answers: quiz.questions.map(q => q.answer)}})).data.state;
    assert.equal(st.onboarding.status, 'completed'); assert.equal(st.onboarding.manual, false);
    const cat2 = (await call('/api/catalog', {token: L.token})).data;
    assert.ok(cat2.courses.every(c => !c.locked) && cat2.articles.every(a => !a.locked));
    assert.equal((await call('/api/courses/service/enroll', {token: L.token, body: {}})).status, 200);
    const ov = (await call('/api/admin/onboarding', {token: adm})).data;
    assert.equal(ov.people.find(p => p.id === uid).status, 'completed');
  });

  await t.test('terlambat tetap bisa belajar; perpanjang & buka manual', async () => {
    const L = await addUser('l3', {name: 'Peserta Tiga', email: 'tiga@spun.global'});
    await call('/api/me', {token: L.token});
    const uid = (await pg.query("select id from public.users where email='tiga@spun.global'")).rows[0].id;
    await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'assign'}});
    await call('/api/me', {token: L.token});
    await pg.query("update public.users set onboarding_due_at = now() - interval '2 days' where id=$1", [uid]);
    let me = (await call('/api/me', {token: L.token})).data.state.onboarding;
    assert.equal(me.status, 'overdue'); assert.ok(me.daysLeft < 0);
    assert.equal((await call('/api/courses/cx/lessons/0/complete', {token: L.token, body: {}})).status, 200);
    assert.equal((await call('/api/courses/service/enroll', {token: L.token, body: {}})).status, 403);
    const users = (await call('/api/admin/users', {token: adm})).data.users;
    assert.equal(users.find(u => u.id === uid).onboarding, 'overdue');

    assert.equal((await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'extend', days: 0}})).status, 422);
    const ex = await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'extend', days: 7}});
    assert.equal(ex.data.people.find(p => p.id === uid).status, 'active');
    me = (await call('/api/me', {token: L.token})).data.state.onboarding;
    assert.equal(me.daysLeft, 7);

    const un = await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'unlock'}});
    const p = un.data.people.find(p => p.id === uid);
    assert.equal(p.status, 'completed'); assert.equal(p.manual, true); assert.equal(p.completedBy, 'Nia Admin');
    assert.equal((await call('/api/courses/service/enroll', {token: L.token, body: {}})).status, 200);
    assert.equal((await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'cancel'}})).status, 200);
    assert.ok(!(await call('/api/admin/onboarding', {token: adm})).data.people.some(p => p.id === uid));
  });

  await t.test('admin yang diundang tidak wajib onboarding; program kosong tidak mengunci', async () => {
    const r = await call('/api/admin/users/invite', {token: adm, body: {email: 'adm2@spun.global', name: 'Admin Dua', role: 'admin'}});
    assert.equal(r.data.users.find(x => x.email === 'adm2@spun.global').onboarding, null);
    const L = await addUser('l4', {name: 'Peserta Empat', email: 'empat@spun.global'});
    await call('/api/me', {token: L.token});
    const uid = (await pg.query("select id from public.users where email='empat@spun.global'")).rows[0].id;
    await call(`/api/admin/users/${uid}/onboarding`, {token: adm, body: {action: 'assign'}});
    await call('/api/admin/onboarding/settings', {token: adm, body: {courses: [], days: 14}});
    const me = (await call('/api/me', {token: L.token})).data.state.onboarding;
    assert.equal(me.active, false);
    assert.equal((await call('/api/courses/service/enroll', {token: L.token, body: {}})).status, 200);
  });
});
