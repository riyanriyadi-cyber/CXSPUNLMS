-- v4.0: Tim peserta & audiens materi. Server menjalankan ini otomatis (server/schema.mjs); aman diulang.
create table if not exists public.teams (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.user_teams (
  user_id uuid not null references public.users (id) on delete cascade,
  team_id text not null references public.teams (id) on delete cascade,
  primary key (user_id, team_id)
);
create index if not exists user_teams_team_idx on public.user_teams (team_id);
alter table public.teams enable row level security;
alter table public.user_teams enable row level security;
revoke all on public.teams, public.user_teams from anon, authenticated;
