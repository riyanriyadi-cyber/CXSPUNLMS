// Pengaman skema: menerapkan perubahan database yang dibutuhkan versi ini secara otomatis,
// langsung ke database yang dipakai aplikasi (DATABASE_URL). Hanya menambah, tidak menghapus apa pun,
// dan aman dijalankan berulang. Isinya sama dengan supabase/migrations/20261119000000_essay_grading.sql.
const ESSAY_GRADING = [
  'alter table public.quiz_attempts alter column score drop not null',
  "alter table public.quiz_attempts add column if not exists status text not null default 'graded'",
  'alter table public.quiz_attempts add column if not exists max_points integer',
  'alter table public.quiz_attempts add column if not exists earned_points numeric(8,2)',
  'alter table public.quiz_attempts add column if not exists graded_at timestamptz',
  'alter table public.quiz_attempts add column if not exists graded_by uuid references public.users (id) on delete set null',
  `do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'quiz_attempts_status_check') then
      alter table public.quiz_attempts add constraint quiz_attempts_status_check
        check ((status = 'graded' and score is not null) or (status = 'pending' and score is null));
    end if;
  end $$`,
  "create index if not exists attempt_pending_idx on public.quiz_attempts (created_at) where status = 'pending'"
];

const checked = new WeakMap();

export function ensureSchema(db) {
  let p = checked.get(db);
  if (!p) {
    p = (async () => {
      const has = await db.prepare("SELECT 1 AS x FROM information_schema.columns WHERE table_schema='public' AND table_name='quiz_attempts' AND column_name='status'").first();
      if (has) return false;
      await db.batch(ESSAY_GRADING.map(q => db.prepare(q)));
      console.log('Learning Hub: migrasi essay & penilaian diterapkan otomatis.');
      return true;
    })();
    p.catch(() => checked.delete(db)); // gagal → dicoba lagi pada request berikutnya
    checked.set(db, p);
  }
  return p;
}
