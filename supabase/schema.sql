-- SPUN Learning Hub — Supabase (Postgres) schema.
-- Run once in: Supabase dashboard → SQL Editor → New query → paste → Run. Safe to re-run (IF NOT EXISTS).
-- Access model: ONLY the Vercel server touches the database, using the service-role key.
-- Row Level Security is enabled with NO policies and anon/authenticated are revoked, so the public API key can read nothing.

create table if not exists public.users (
  user_id       text primary key default gen_random_uuid()::text,
  email         text not null,
  email_key     text not null unique,              -- canonical form (Gmail ignores dots / +tags); prevents duplicates
  full_name     text not null check (char_length(full_name) between 1 and 120),
  department    text not null default '' check (char_length(department) <= 80),
  role          text not null default 'EMPLOYEE' check (role in ('EMPLOYEE','TEAM_LEAD','LMS_ADMIN','SUPER_ADMIN')),
  manager_email text not null default '',
  manager_key   text not null default '',          -- canonical manager email; Team Leads see rows where this = their own key
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists users_manager_key_idx on public.users (manager_key);

create table if not exists public.courses (
  course_id        text primary key default gen_random_uuid()::text,
  title            text not null check (char_length(title) between 1 and 150),
  description      text not null default '' check (char_length(description) <= 2000),
  category         text not null default '' check (char_length(category) <= 60),
  content_url      text not null default '',        -- optional https link to extra course materials
  duration_minutes integer not null default 0 check (duration_minutes between 0 and 10000),
  passing_score    integer check (passing_score between 0 and 100),   -- reserved for Phase 2 (quizzes); unused now
  is_published     boolean not null default false,
  created_by       text references public.users(user_id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.lessons (
  lesson_id    text primary key default gen_random_uuid()::text,
  course_id    text not null references public.courses(course_id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 150),
  lesson_type  text not null check (lesson_type in ('TEXT','IMAGE','VIDEO','DRIVE')),
  content_text text not null default '' check (char_length(content_text) <= 20000),
  content_url  text not null default '' check (char_length(content_url) <= 2000),
  sort_order   integer not null default 1,
  is_required  boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists lessons_course_order_idx on public.lessons (course_id, sort_order);

create table if not exists public.enrollments (
  enrollment_id text primary key default gen_random_uuid()::text,
  user_id       text not null references public.users(user_id) on delete cascade,
  course_id     text not null references public.courses(course_id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  due_date      date,
  assigned_by   text references public.users(user_id) on delete set null,
  status        text not null default 'ASSIGNED' check (status in ('ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'))
);
-- One ACTIVE enrollment per (user, course). Cancel it to allow assigning again.
create unique index if not exists enrollments_one_active_idx on public.enrollments (user_id, course_id) where status <> 'CANCELLED';
create index if not exists enrollments_user_idx on public.enrollments (user_id);

create table if not exists public.lesson_progress (
  user_id          text not null references public.users(user_id) on delete cascade,
  course_id        text not null references public.courses(course_id) on delete cascade,
  lesson_id        text not null references public.lessons(lesson_id) on delete cascade,
  status           text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
  started_at       timestamptz,
  completed_at     timestamptz,
  last_accessed_at timestamptz,
  primary key (user_id, course_id, lesson_id)      -- guarantees no duplicate progress rows
);

alter table public.users           enable row level security;
alter table public.courses         enable row level security;
alter table public.lessons         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;

revoke all on public.users, public.courses, public.lessons, public.enrollments, public.lesson_progress from anon, authenticated;
