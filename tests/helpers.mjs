// Postgres in-memory (PGlite) dengan stub minimal skema Supabase (auth.users, storage.buckets, role API),
// lalu kedua migrasi proyek dijalankan apa adanya.
import {readFile, readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createDb} from '../server/db.mjs';
import {createHandler} from '../server/app.mjs';

export async function setupDb() {
  const pg = new PGlite();
  await pg.exec(`create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create role anon; create role authenticated;`);
  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const f of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) await pg.exec(await readFile(new URL(f, dir), 'utf8'));
  const db = createDb({
    query: async (text, params) => (await pg.query(text, params)).rows,
    transaction: fn => pg.transaction(tx => fn(async (text, params) => (await tx.query(text, params)).rows))
  });
  return {pg, db};
}

export const SUPABASE_URL = 'https://demo.supabase.co';

export async function setupApp() {
  const {pg, db} = await setupDb();
  const tokens = {};
  const adminCalls = [];
  const addUser = async (key, {name, email, signedIn = true}) => {
    const id = randomUUID();
    await pg.query('insert into auth.users(id,email,last_sign_in_at,raw_user_meta_data) values($1,$2,$3,$4)', [id, email, signedIn ? new Date().toISOString() : null, JSON.stringify({full_name: name})]);
    tokens[`token-${key}-${'x'.repeat(20)}`] = {id, name, email, hasName: true};
    return {id, token: `token-${key}-${'x'.repeat(20)}`};
  };
  const admin = {
    async invite(email, {name, redirectTo}) {
      adminCalls.push(['invite', email, name, redirectTo]);
      const id = randomUUID();
      await pg.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3) on conflict do nothing', [id, email, JSON.stringify({full_name: name})]);
      return {id};
    },
    async setBanned(id, banned) {adminCalls.push(['ban', id, banned]);},
    async signUpload(path) {adminCalls.push(['sign', path]); return {uploadUrl: `${SUPABASE_URL}/storage/v1/object/upload/sign/lms-media/${path}?token=t`};}
  };
  const handle = createHandler({getDb: async () => db, verifyToken: async t => tokens[t] || null, config: {supabaseUrl: SUPABASE_URL, supabaseKey: 'sb_publishable_demo', allowRegistration: false}, admin});
  const origin = 'https://learning.example.test';
  const call = async (path, {token, body, method = body ? 'POST' : 'GET', headers = {}} = {}) => {
    const res = await handle(new Request(origin + path, {method, headers: {...(token ? {Authorization: `Bearer ${token}`} : {}), ...(body ? {'Content-Type': 'application/json', 'X-Learning-Hub': '1', Origin: origin} : {}), ...headers}, ...(body ? {body: JSON.stringify(body)} : {})}));
    return {status: res.status, data: await res.json(), headers: res.headers};
  };
  return {pg, db, call, addUser, adminCalls, origin};
}
