-- SPUN Learning Hub — migrasi 3: soal essay, poin per soal, dan penilaian manual.
-- Jalankan SEKALI di Supabase SQL Editor setelah migrasi 1 & 2. Aman dijalankan ulang.

-- Percobaan quiz yang berisi essay berstatus 'pending' (skor kosong) sampai dinilai admin.
alter table public.quiz_attempts alter column score drop not null;
alter table public.quiz_attempts add column if not exists status text not null default 'graded';
alter table public.quiz_attempts add column if not exists max_points integer;
alter table public.quiz_attempts add column if not exists earned_points numeric(8,2);
alter table public.quiz_attempts add column if not exists graded_at timestamptz;
alter table public.quiz_attempts add column if not exists graded_by uuid references public.users (id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quiz_attempts_status_check') then
    alter table public.quiz_attempts add constraint quiz_attempts_status_check
      check ((status = 'graded' and score is not null) or (status = 'pending' and score is null));
  end if;
end $$;
create index if not exists attempt_pending_idx on public.quiz_attempts (created_at) where status = 'pending';
