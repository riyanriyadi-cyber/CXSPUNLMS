// Menghasilkan supabase/migrations/20261117020000_admin_cms.sql dari supabase/seed/catalog.json.
// Jalankan: node scripts/gen-migration.mjs  (hanya perlu jika katalog awal diubah sebelum migrasi pertama kali dijalankan)
import {readFile, writeFile} from 'node:fs/promises';
import {normalize, forPublish} from '../server/content.mjs';

const catalog = JSON.parse(await readFile(new URL('../supabase/seed/catalog.json', import.meta.url), 'utf8'));
const ctx = {supabaseUrl: 'https://seed.invalid'};
const rows = [];
const add = (kind, item, order) => {
  const {id, ...raw} = item;
  if (kind === 'course') raw.lessons = raw.lessons.map((l, i) => ({...l, id: `${id}-m${i + 1}`})); // ID modul stabil untuk konversi progres lama
  const draft = normalize(kind, raw, ctx);
  const published = forPublish(kind, structuredClone(draft));
  const lit = v => {const s = JSON.stringify(v); if (s.includes('$json$')) throw new Error('konten berisi $json$'); return `$json$${s}$json$::jsonb`;};
  rows.push(`  ('${kind}', '${id}', ${lit(draft)}, ${lit(published)}, ${order}, now(), 1)`);
};
catalog.courses.forEach((c, i) => add('course', c, (i + 1) * 10));
catalog.quizzes.forEach((q, i) => add('quiz', q, (i + 1) * 10));
catalog.articles.forEach((a, i) => add('article', a, (i + 1) * 10));

const sqlText = `-- SPUN Learning Hub — migrasi 2: panel admin & materi di database.
-- Jalankan SEKALI di Supabase SQL Editor setelah migrasi 1 (20261117000000_learning_hub_init.sql).
-- Aman dijalankan ulang: setiap langkah memeriksa kondisi sebelum mengubah.

-- 1) Role & status akun
alter table public.users add column if not exists role text not null default 'learner';
alter table public.users add column if not exists status text not null default 'active';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'users_role_check') then
    alter table public.users add constraint users_role_check check (role in ('learner', 'admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'users_status_check') then
    alter table public.users add constraint users_status_check check (status in ('active', 'disabled'));
  end if;
end $$;

-- 2) Materi: draft (sedang diedit admin) dan published (yang dilihat peserta)
create table if not exists public.content_items (
  kind text not null check (kind in ('course', 'quiz', 'article')),
  id text not null check (id ~ '^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$'),
  draft jsonb not null,
  published jsonb,
  sort_order integer not null default 0,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null,
  published_at timestamptz,
  published_revision integer,
  primary key (kind, id)
);
alter table public.content_items enable row level security;
revoke all on table public.content_items from anon, authenticated;

-- 3) Progres modul memakai ID modul (bukan nomor urut), supaya aman saat modul disisipkan/diurutkan ulang
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_progress' and column_name = 'lesson_index') then
    alter table public.lesson_progress add column if not exists lesson_id text;
    update public.lesson_progress set lesson_id = course_id || '-m' || (lesson_index + 1) where lesson_id is null;
    alter table public.lesson_progress alter column lesson_id set not null;
    alter table public.lesson_progress drop constraint if exists lesson_progress_pkey;
    alter table public.lesson_progress add primary key (user_id, course_id, lesson_id);
    alter table public.lesson_progress drop column lesson_index;
  end if;
end $$;

-- 4) Isi awal materi (dari katalog contoh). Tidak menimpa materi yang sudah ada.
insert into public.content_items (kind, id, draft, published, sort_order, published_at, published_revision) values
${rows.join(',\n')}
on conflict (kind, id) do nothing;

-- 5) Tempat gambar materi (publik untuk dibaca; unggah hanya lewat API admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lms-media', 'lms-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- 6) Laporan ringkas (dibaca lewat SQL Editor; panel admin punya laporan sendiri)
drop view if exists public.learning_report;
create view public.learning_report with (security_invoker = true) as
select u.id as user_id, u.name, u.email, u.role, u.status,
  (select count(*) from public.enrollments e where e.user_id = u.id) as courses_enrolled,
  (select count(*) from public.lesson_progress p where p.user_id = u.id) as lessons_completed,
  (select count(distinct quiz_id) from public.quiz_attempts a where a.user_id = u.id) as quizzes_attempted,
  (select count(distinct quiz_id) from public.quiz_attempts a where a.user_id = u.id and a.score >= 80) as quizzes_passed,
  (select max(x) from (
     select max(completed_at) as x from public.lesson_progress p where p.user_id = u.id
     union all select max(created_at) from public.quiz_attempts a where a.user_id = u.id) s) as last_activity
from public.users u;
revoke all on public.learning_report from anon, authenticated;

-- 7) Jadikan akun Anda admin pertama: login sekali ke aplikasi, lalu jalankan (ganti emailnya):
-- update public.users set role = 'admin' where email = 'nama@spun.global';
`;
await writeFile(new URL('../supabase/migrations/20261117020000_admin_cms.sql', import.meta.url), sqlText);
console.log(`Wrote migration with ${rows.length} content items`);
