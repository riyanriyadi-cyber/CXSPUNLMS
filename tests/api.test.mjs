// Uji API peserta dengan Postgres sungguhan (PGlite) memakai migrasi Supabase yang sama.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID, webcrypto} from 'node:crypto';
import {supabaseVerifier, profileFromClaims} from '../server/auth.mjs';
import {setupApp} from './helpers.mjs';

test('Learning Hub API on Postgres', async t => {
  const {pg, call, addUser} = await setupApp();
  const A = await addUser('alice', {name: 'Alice Learner', email: 'alice@example.test'});
  const B = await addUser('bob', {name: 'Bob Learner', email: 'bob@example.test'});
  const users = {[A.token]: A, [B.token]: B};
  const alice = A.token, bob = B.token;

  await t.test('config is public and exposes only the publishable key', async () => {
    const c = await call('/api/auth/config');
    assert.equal(c.status, 200);
    assert.deepEqual(c.data, {mode: 'supabase', version: '4.1.0', registration: false, supabaseUrl: 'https://demo.supabase.co', supabaseKey: 'sb_publishable_demo'});
    assert.match(c.headers.get('content-security-policy'), /connect-src 'self' https:\/\/\*\.supabase\.co/);
  });
  await t.test('anonymous, malformed and unknown tokens are rejected', async () => {
    assert.equal((await call('/api/me')).status, 401);
    assert.equal((await call('/api/me', {headers: {Authorization: 'Bearer short'}})).status, 401);
    assert.equal((await call('/api/me', {token: 'token-unknown-00000000000000000000'})).status, 401);
    assert.equal((await call('/api/me', {headers: {'oai-authenticated-user-id': 'forged'}})).status, 401);
  });
  await t.test('first request creates the profile row from the verified token', async () => {
    const me = await call('/api/me', {token: alice});
    assert.equal(me.status, 200); assert.equal(me.data.profile.name, 'Alice Learner'); assert.equal(me.data.profile.role, 'learner'); assert.deepEqual(me.data.state.enrolled, []);
    const row = (await pg.query('select name,email from public.users where id=$1', [users[alice].id])).rows[0];
    assert.deepEqual(row, {name: 'Alice Learner', email: 'alice@example.test'});
  });
  await t.test('catalog never exposes answer keys', async () => {
    const c = await call('/api/catalog', {token: alice});
    assert.equal(c.data.courses.length, 6);
    for (const quiz of c.data.quizzes) for (const q of quiz.questions) {assert.equal(q.answer, undefined); assert.equal(q.why, undefined);}
  });
  await t.test('cross-origin writes and invalid modules are rejected', async () => {
    assert.equal((await call('/api/courses/cx/enroll', {token: alice, body: {}, headers: {Origin: 'https://evil.example'}})).status, 403);
    assert.equal((await call('/api/courses/cx/lessons/99/complete', {token: alice, body: {}})).status, 404);
  });
  await t.test('lesson completion is idempotent and isolated per user', async () => {
    for (let i = 0; i < 2; i++) {
      const p = await call('/api/courses/cx/lessons/0/complete', {token: alice, body: {userId: users[bob].id}});
      assert.equal(p.status, 200); assert.deepEqual(p.data.state.progress.cx, [0]); assert.deepEqual(p.data.state.enrolled, ['cx']);
      assert.equal(p.data.state.activity.length, 1); assert.equal(p.data.state.activity[0].minutes, 8); assert.match(p.data.state.activity[0].date, /^\d{4}-\d{2}-\d{2}$/);
    }
    const b = await call('/api/me', {token: bob});
    assert.deepEqual(b.data.state.progress.cx, []); assert.deepEqual(b.data.state.enrolled, []);
  });
  await t.test('bookmarks and read status per account', async () => {
    assert.deepEqual((await call('/api/bookmarks', {token: alice, body: {kind: 'article', id: 'empathy', saved: true}})).data.state.savedArticles, ['empathy']);
    assert.deepEqual((await call('/api/articles/empathy/read', {token: alice, body: {}})).data.state.readArticles, ['empathy']);
    assert.deepEqual((await call('/api/bookmarks', {token: alice, body: {kind: 'article', id: 'empathy', saved: false}})).data.state.savedArticles, []);
    assert.deepEqual((await call('/api/me', {token: bob})).data.state.readArticles, []);
    assert.equal((await call('/api/bookmarks', {token: alice, body: {kind: 'article', id: 'nope', saved: true}})).status, 404);
  });
  await t.test('server-side scoring, idempotent retries, conflict detection, history', async () => {
    const attemptId = randomUUID(), answers = [0, 0, 0, 0, 0];
    const a = await call('/api/quizzes/cx-quiz/attempts', {token: alice, body: {attemptId, answers, score: 100}});
    assert.equal(a.status, 200); assert.equal(a.data.result.score, 0); assert.equal(a.data.result.review.length, 5);
    const retry = await call('/api/quizzes/cx-quiz/attempts', {token: alice, body: {attemptId, answers}});
    assert.equal(retry.status, 200); assert.equal(retry.data.state.results['cx-quiz'].attempts, 1);
    assert.equal((await call('/api/quizzes/cx-quiz/attempts', {token: alice, body: {attemptId, answers: [1, 2, 1, 2, 1]}})).status, 409);
    const good = await call('/api/quizzes/cx-quiz/attempts', {token: alice, body: {attemptId: randomUUID(), answers: [0, 2, 1, 2, 1]}});
    assert.equal(good.data.result.score, 80); assert.equal(good.data.result.passed, true);
    assert.equal(good.data.state.results['cx-quiz'].score, 80); assert.equal(good.data.state.results['cx-quiz'].attempts, 2);
    assert.equal((await call('/api/quizzes/cx-quiz/attempts', {token: alice, body: {attemptId: randomUUID(), answers: [1]}})).status, 422);
    const history = await call('/api/quizzes/cx-quiz/attempts', {token: alice});
    assert.equal(history.data.attempts.length, 2); assert.equal(history.data.attempts[0].score, 80);
    assert.deepEqual((await call('/api/quizzes/cx-quiz/attempts', {token: bob})).data.attempts, []);
  });
  await t.test('report view aggregates progress', async () => {
    const r = (await pg.query('select name, lessons_completed::int, quizzes_passed::int from public.learning_report order by name')).rows;
    assert.deepEqual(r, [{name: 'Alice Learner', lessons_completed: 1, quizzes_passed: 1}, {name: 'Bob Learner', lessons_completed: 0, quizzes_passed: 0}]);
  });
  await t.test('data API roles have no access to learning tables', async () => {
    const grants = (await pg.query(`select count(*)::int as n from information_schema.role_table_grants where grantee in ('anon','authenticated') and table_schema='public'`)).rows[0].n;
    assert.equal(grants, 0);
    const rls = (await pg.query(`select bool_and(relrowsecurity) as on from pg_class where relnamespace='public'::regnamespace and relkind='r'`)).rows[0].on;
    assert.equal(rls, true);
  });
  await t.test('deleting the auth user cascades all learning data', async () => {
    await pg.query('delete from auth.users where id=$1', [users[alice].id]);
    const n = (await pg.query('select (select count(*) from public.users)::int + (select count(*) from public.quiz_attempts)::int + (select count(*) from public.lesson_progress)::int as n')).rows[0].n;
    assert.equal(n, 1); // tinggal profil Bob
  });
  await pg.close();
});

// Verifikasi JWT asli: token ES256 ditandatangani kunci uji, JWKS dilayani lewat fetch tiruan.
test('Supabase token verification (getClaims + JWKS)', async t => {
  const supabaseUrl = 'https://proj.supabase.co', kid = 'test-key-1';
  const keys = await webcrypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
  const jwk = {...await webcrypto.subtle.exportKey('jwk', keys.publicKey), kid, alg: 'ES256', use: 'sig'};
  const other = await webcrypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
  const b64 = v => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');
  const sign = async (payload, key = keys.privateKey) => {
    const head = b64({alg: 'ES256', typ: 'JWT', kid}), body = b64(payload);
    const sig = await webcrypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, key, Buffer.from(`${head}.${body}`));
    return `${head}.${body}.${Buffer.from(sig).toString('base64url')}`;
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => String(url) === `${supabaseUrl}/auth/v1/.well-known/jwks.json`
    ? new Response(JSON.stringify({keys: [jwk]}), {headers: {'Content-Type': 'application/json'}})
    : new Response(JSON.stringify({message: 'unexpected'}), {status: 500});
  try {
    const verify = supabaseVerifier({supabaseUrl, supabaseKey: 'sb_publishable_x'});
    const now = Math.floor(Date.now() / 1000), sub = randomUUID();
    const claims = {sub, role: 'authenticated', aud: 'authenticated', email: 'nia@example.test', exp: now + 3600, iat: now, user_metadata: {full_name: 'Nia Concierge'}};
    await t.test('valid token → profile', async () => assert.deepEqual(await verify(await sign(claims)), {id: sub, name: 'Nia Concierge', email: 'nia@example.test', hasName: true}));
    await t.test('wrong signing key → rejected', async () => assert.equal(await verify(await sign(claims, other.privateKey)), null));
    await t.test('expired token → rejected', async () => assert.equal(await verify(await sign({...claims, exp: now - 10})), null));
    await t.test('anon role / anonymous user → rejected', async () => {
      assert.equal(await verify(await sign({...claims, role: 'anon'})), null);
      assert.equal(await verify(await sign({...claims, is_anonymous: true})), null);
    });
  } finally {globalThis.fetch = realFetch;}
  assert.deepEqual(profileFromClaims({sub: 'x', role: 'authenticated', email: 'tri@spun.global'}), {id: 'x', name: 'tri', email: 'tri@spun.global', hasName: false});
});
