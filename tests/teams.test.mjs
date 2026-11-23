// Uji tim: CRUD, anggota, audiens materi, pembatasan di server, onboarding per tim, filter laporan.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setupApp} from './helpers.mjs';

test('Tim & audiens materi', async t => {
  const {pg, call, addUser} = await setupApp();
  const ADM = await addUser('admin', {name: 'Nia Admin', email: 'nia@spun.global'});
  await call('/api/me', {token: ADM.token});
  await pg.query("update public.users set role='admin' where email='nia@spun.global'");
  const adm = ADM.token;
  const CE = await addUser('ce', {name: 'Cici CE', email: 'ce@spun.global'}), OPS = await addUser('ops', {name: 'Oki Ops', email: 'ops@spun.global'}), NONE = await addUser('none', {name: 'Nana', email: 'nana@spun.global'});
  for (const u of [CE, OPS, NONE]) await call('/api/me', {token: u.token});
  const uid = async e => (await pg.query('select id from public.users where email=$1', [e])).rows[0].id;
  const ceId = await uid('ce@spun.global'), opsId = await uid('ops@spun.global');

  await t.test('CRUD tim', async () => {
    assert.equal((await call('/api/admin/teams', {token: adm, body: {name: ' '}})).status, 422);
    let r = await call('/api/admin/teams', {token: adm, body: {name: 'Customer Experience'}});
    assert.equal(r.status, 201);
    r = await call('/api/admin/teams', {token: adm, body: {name: 'Visa Ops'}});
    assert.deepEqual(r.data.teams.map(x => x.id), ['customer-experience', 'visa-ops']);
    assert.equal((await call('/api/admin/teams', {token: adm, body: {name: 'visa ops'}})).status, 409);
    r = await call('/api/admin/teams/visa-ops', {token: adm, body: {name: 'Visa Operations'}});
    assert.equal(r.data.teams.find(x => x.id === 'visa-ops').name, 'Visa Operations');
    assert.equal((await call('/api/admin/teams', {token: CE.token})).status, 403);
  });

  await t.test('anggota tim & undangan dengan tim', async () => {
    assert.equal((await call(`/api/admin/users/${ceId}/teams`, {token: adm, body: {teams: ['tidak-ada']}})).status, 422);
    let r = await call(`/api/admin/users/${ceId}/teams`, {token: adm, body: {teams: ['customer-experience']}});
    assert.deepEqual(r.data.users.find(u => u.id === ceId).teams, ['customer-experience']);
    await call(`/api/admin/users/${opsId}/teams`, {token: adm, body: {teams: ['visa-ops', 'customer-experience']}});
    await call(`/api/admin/users/${opsId}/teams`, {token: adm, body: {teams: ['visa-ops']}});
    r = await call('/api/admin/users/invite', {token: adm, body: {email: 'baru@spun.global', name: 'Baru', teams: ['visa-ops'], onboarding: false}});
    assert.equal(r.status, 201);
    assert.deepEqual(r.data.users.find(u => u.email === 'baru@spun.global').teams, ['visa-ops']);
    assert.equal((await call('/api/admin/teams', {token: adm})).data.teams.find(x => x.id === 'visa-ops').members, 2);
  });

  await t.test('audiens materi membatasi katalog & akses langsung', async () => {
    const save = async (kind, id, teams) => {
      const it = (await call(`/api/admin/content/${kind}/${id}`, {token: adm})).data.item;
      const r = await call(`/api/admin/content/${kind}/${id}`, {token: adm, body: {draft: {...it.draft, teams}, baseRevision: it.revision}});
      assert.equal(r.status, 200, JSON.stringify(r.data));
      assert.equal((await call(`/api/admin/content/${kind}/${id}/publish`, {token: adm, body: {}})).status, 200);
    };
    const it = (await call('/api/admin/content/course/cx', {token: adm})).data.item;
    assert.equal((await call('/api/admin/content/course/cx', {token: adm, body: {draft: {...it.draft, teams: ['hantu']}, baseRevision: it.revision}})).status, 422);
    await save('course', 'cx', ['customer-experience']);
    await save('article', 'empathy', ['visa-ops']);
    const cxQuiz = (await call('/api/catalog', {token: adm})).data.quizzes.find(q => q.course === 'cx');

    const ce = (await call('/api/catalog', {token: CE.token})).data, ops = (await call('/api/catalog', {token: OPS.token})).data, none = (await call('/api/catalog', {token: NONE.token})).data;
    assert.ok(ce.courses.some(c => c.id === 'cx') && ce.quizzes.some(q => q.id === cxQuiz.id) && !ce.articles.some(a => a.id === 'empathy'));
    assert.ok(!ops.courses.some(c => c.id === 'cx') && !ops.quizzes.some(q => q.id === cxQuiz.id) && ops.articles.some(a => a.id === 'empathy'));
    assert.ok(!none.courses.some(c => c.id === 'cx') && !none.articles.some(a => a.id === 'empathy'));
    assert.ok(none.courses.some(c => c.id === 'service'), 'materi semua tim tetap terlihat');
    assert.equal((await call('/api/courses/cx/enroll', {token: OPS.token, body: {}})).status, 404);
    assert.equal((await call(`/api/quizzes/${cxQuiz.id}/attempts`, {token: OPS.token, body: {attemptId: randomUUID(), answers: []}})).status, 404);
    assert.equal((await call('/api/articles/empathy/read', {token: CE.token, body: {}})).status, 404);
    assert.equal((await call('/api/courses/cx/enroll', {token: CE.token, body: {}})).status, 200);
    const admCat = (await call('/api/catalog', {token: adm})).data;
    assert.ok(admCat.courses.some(c => c.id === 'cx') && admCat.articles.some(a => a.id === 'empathy'), 'admin melihat semua');
    const rp = (await call(`/api/admin/users/${opsId}/raport`, {token: adm})).data;
    assert.ok(!rp.courses?.some?.(c => c.id === 'cx'));
    const list = (await call('/api/admin/content', {token: adm})).data.items.filter(i => i.kind === 'course');
    assert.deepEqual(list.find(i => i.id === 'cx').teams, ['customer-experience']);
  });

  await t.test('hapus tim ditolak bila masih dipakai materi', async () => {
    assert.equal((await call('/api/admin/teams/customer-experience/delete', {token: adm, body: {}})).status, 409);
    await call('/api/admin/teams', {token: adm, body: {name: 'Sementara'}});
    const r = await call('/api/admin/teams/sementara/delete', {token: adm, body: {}});
    assert.equal(r.status, 200); assert.ok(!r.data.teams.some(x => x.id === 'sementara'));
  });

  await t.test('onboarding per tim', async () => {
    assert.equal((await call('/api/admin/onboarding/settings', {token: adm, body: {courses: ['onboarding'], byTeam: {hantu: ['cx']}, days: 14}})).status, 422);
    const r = await call('/api/admin/onboarding/settings', {token: adm, body: {courses: ['onboarding'], byTeam: {'customer-experience': ['cx', 'onboarding']}, days: 14}});
    assert.deepEqual(r.data.settings.byTeam, {'customer-experience': ['cx']});
    for (const id of [ceId, opsId]) await call(`/api/admin/users/${id}/onboarding`, {token: adm, body: {action: 'assign'}});
    const ce = (await call('/api/me', {token: CE.token})).data.state.onboarding, ops = (await call('/api/me', {token: OPS.token})).data.state.onboarding;
    assert.deepEqual(ce.courses.map(c => c.id), ['onboarding', 'cx']);
    assert.deepEqual(ops.courses.map(c => c.id), ['onboarding']);
    const ov = (await call('/api/admin/onboarding', {token: adm})).data;
    assert.equal(ov.people.find(p => p.id === ceId).total, 2); assert.equal(ov.programTotal, 2);
    assert.equal((await call('/api/admin/teams/customer-experience/delete', {token: adm, body: {}})).status, 409);
  });

  await t.test('filter laporan & data tim di nilai quiz/penilaian', async () => {
    const all = (await call('/api/admin/report', {token: adm})).data, ce = (await call('/api/admin/report?team=customer-experience', {token: adm})).data;
    assert.ok(ce.users.every(u => u.teams.includes('customer-experience')) && ce.users.length < all.users.length);
    assert.ok(ce.courses.some(c => c.id === 'cx'));
    const ops = (await call('/api/admin/report?team=visa-ops', {token: adm})).data;
    assert.ok(!ops.courses.some(c => c.id === 'cx'));
    assert.equal((await call('/api/admin/report?team=hantu', {token: adm})).status, 422);
    const sc = (await call('/api/admin/scores', {token: adm})).data;
    assert.ok(sc.users.every(u => Array.isArray(u.teams)));
    assert.deepEqual(sc.quizzes.find(q => q.id === 'cx-quiz')?.teams ?? ['customer-experience'], ['customer-experience']);
  });
});
