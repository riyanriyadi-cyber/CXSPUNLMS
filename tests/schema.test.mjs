import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createDb} from '../server/db.mjs';
import {ensureSchema} from '../server/schema.mjs';

test('migrasi essay diterapkan otomatis pada database v3.5 dan aman diulang', async () => {
  const pg = new PGlite();
  await pg.exec(`create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create role anon; create role authenticated;`);
  for (const f of ['20261117000000_learning_hub_init.sql', '20261117020000_admin_cms.sql']) await pg.exec(await readFile(new URL('../supabase/migrations/' + f, import.meta.url), 'utf8'));
  const uid = '11111111-1111-4111-8111-111111111111';
  await pg.query("insert into auth.users(id,email) values($1,'a@b.c')", [uid]);
  await pg.query("insert into public.users(id,name,email) values($1,'A','a@b.c')", [uid]);
  await pg.query("insert into public.quiz_attempts(user_id,attempt_id,quiz_id,score,answers,review,content_version) values($1,'a1','cx-quiz',80,'[]','[]','v1')", [uid]);
  const db = createDb({query: async (t, p) => (await pg.query(t, p)).rows, transaction: fn => pg.transaction(tx => fn(async (t, p) => (await tx.query(t, p)).rows))});
  assert.equal(await ensureSchema(db), true);
  const row = (await pg.query('select status, score from public.quiz_attempts')).rows[0];
  assert.deepEqual(row, {status: 'graded', score: 80});
  const db2 = createDb({query: async (t, p) => (await pg.query(t, p)).rows, transaction: fn => pg.transaction(tx => fn(async (t, p) => (await tx.query(t, p)).rows))});
  assert.equal(await ensureSchema(db2), false);
  await pg.exec(await readFile(new URL('../supabase/migrations/20261119000000_essay_grading.sql', import.meta.url), 'utf8')); // file manual tetap aman setelahnya
});
