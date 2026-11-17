-- SPUN Learning Hub — schema awal untuk Supabase Postgres.
-- Jalankan sekali di Supabase SQL Editor (atau `supabase db push`).
-- Akun & password dikelola Supabase Auth (auth.users); tabel di bawah hanya menyimpan data belajar.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  user_id uuid not null references public.users (id) on delete cascade,
  course_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.users (id) on delete cascade,
  course_id text not null,
  lesson_index integer not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_index)
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in ('course', 'article')),
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, content_id)
);

create table if not exists public.article_reads (
  user_id uuid not null references public.users (id) on delete cascade,
  article_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create table if not exists public.quiz_attempts (
  user_id uuid not null references public.users (id) on delete cascade,
  attempt_id text not null,
  quiz_id text not null,
  score integer not null check (score between 0 and 100),
  answers text not null,   -- JSON array indeks jawaban (teks persis, dipakai cek idempotensi)
  review text not null,    -- JSON snapshot pembahasan saat dikumpulkan
  content_version text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, attempt_id)
);
create index if not exists attempt_user_quiz_idx on public.quiz_attempts (user_id, quiz_id);

-- Keamanan: semua akses data lewat API server (koneksi Postgres langsung, role postgres).
-- Publishable/anon key ada di browser, jadi tabel ini DITUTUP dari Data API (PostgREST):
-- RLS aktif tanpa policy + hak akses anon/authenticated dicabut.
do $$
declare t text;
begin
  foreach t in array array['users','enrollments','lesson_progress','bookmarks','article_reads','quiz_attempts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- View laporan untuk admin/L&D (dibaca dari dashboard/SQL editor, bukan dari browser peserta).
create or replace view public.learning_report
with (security_invoker = true) as
select u.id as user_id, u.name, u.email,
  (select count(*) from public.enrollments e where e.user_id = u.id) as courses_enrolled,
  (select count(*) from public.lesson_progress p where p.user_id = u.id) as lessons_completed,
  (select count(distinct quiz_id) from public.quiz_attempts a where a.user_id = u.id) as quizzes_attempted,
  (select count(distinct quiz_id) from public.quiz_attempts a where a.user_id = u.id and a.score >= 80) as quizzes_passed,
  (select max(x) from (
     select max(completed_at) as x from public.lesson_progress p where p.user_id = u.id
     union all select max(created_at) from public.quiz_attempts a where a.user_id = u.id) s) as last_activity
from public.users u;
revoke all on public.learning_report from anon, authenticated;
