// Uji SOP: buat, validasi publish, audiens tim, tidak terkunci onboarding, status tidak berlaku.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setupApp} from './helpers.mjs';

test('SOP per tim', async t => {
  const {pg, call, addUser} = await setupApp();
  const ADM = await addUser('admin', {name: 'Nia Admin', email: 'nia@spun.global'});
  await call('/api/me', {token: ADM.token});
  await pg.query("update public.users set role='admin' where email='nia@spun.global'");
  const adm = ADM.token;
  const C = await addUser('c', {name: 'Cia Concierge', email: 'c@spun.global'}), O = await addUser('o', {name: 'Oki', email: 'o@spun.global'});
  for (const u of [C, O]) await call('/api/me', {token: u.token});
  const cid = (await pg.query("select id from public.users where email='c@spun.global'")).rows[0].id;
  await call('/api/admin/teams', {token: adm, body: {name: 'Concierge'}});
  await call(`/api/admin/users/${cid}/teams`, {token: adm, body: {teams: ['concierge']}});

  let id;
  await t.test('buat SOP slide + publish', async () => {
    const r = await call('/api/admin/content/sop', {token: adm, body: {draft: {title: 'SOP Pengajuan Visa Jepang', category: 'Pengajuan', teams: ['concierge'], docs: [{title: 'Deck SOP', url: 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQ/edit'}]}}});
    assert.equal(r.status, 201, JSON.stringify(r.data)); id = r.data.item.id;
    const empty = await call('/api/admin/content/sop', {token: adm, body: {draft: {title: 'Kosong', category: 'X'}}});
    assert.equal((await call(`/api/admin/content/sop/${empty.data.item.id}/publish`, {token: adm, body: {}})).status, 422);
    assert.equal((await call(`/api/admin/content/sop/${id}/publish`, {token: adm, body: {}})).status, 200);
  });

  await t.test('hanya tim Concierge yang menerima SOP', async () => {
    const c = (await call('/api/catalog', {token: C.token})).data, o = (await call('/api/catalog', {token: O.token})).data;
    assert.equal(c.sops.length, 1); assert.equal(c.sops[0].docs[0].type, 'slides'); assert.equal(c.sops[0].active, true); assert.ok(c.sops[0].publishedAt);
    assert.equal(o.sops.length, 0);
    assert.equal((await call('/api/catalog', {token: adm})).data.sops.length, 1);
  });

  await t.test('SOP tidak terkunci selama onboarding', async () => {
    await call('/api/admin/onboarding/settings', {token: adm, body: {courses: ['onboarding'], days: 14}});
    await call(`/api/admin/users/${cid}/onboarding`, {token: adm, body: {action: 'assign'}});
    const c = (await call('/api/catalog', {token: C.token})).data;
    assert.ok(c.courses.some(x => x.locked)); assert.equal(c.sops.length, 1); assert.ok(!c.sops[0].locked);
  });

  await t.test('tandai tidak berlaku', async () => {
    const it = (await call(`/api/admin/content/sop/${id}`, {token: adm})).data.item;
    await call(`/api/admin/content/sop/${id}`, {token: adm, body: {draft: {...it.draft, active: false}, baseRevision: it.revision}});
    await call(`/api/admin/content/sop/${id}/publish`, {token: adm, body: {}});
    assert.equal((await call('/api/catalog', {token: C.token})).data.sops[0].active, false);
    assert.ok((await call('/api/admin/content', {token: adm})).data.items.some(i => i.kind === 'sop' && i.id === id));
  });
});
