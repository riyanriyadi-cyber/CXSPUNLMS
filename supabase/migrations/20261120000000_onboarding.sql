-- v3.7: Program onboarding karyawan baru.
-- Server menjalankan perubahan ini otomatis (server/schema.mjs); file ini untuk referensi/manual, aman diulang.
alter table public.users add column if not exists onboarding_required boolean not null default false;
alter table public.users add column if not exists onboarding_started_at timestamptz;
alter table public.users add column if not exists onboarding_due_at timestamptz;
alter table public.users add column if not exists onboarding_completed_at timestamptz;
alter table public.users add column if not exists onboarding_completed_by uuid references public.users (id) on delete set null;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
