// Pengaman skema: menerapkan perubahan database yang dibutuhkan versi ini secara otomatis,
// langsung ke database yang dipakai aplikasi (DATABASE_URL). Hanya menambah, tidak menghapus apa pun,
// dan aman dijalankan berulang. Isinya sama dengan file di supabase/migrations/ (essay_grading, onboarding).
const ESSAY_GRADING = [
  'alter table quiz_attempts alter column score drop not null',
  "alter table quiz_attempts add column if not exists status text not null default 'graded'",
  'alter table quiz_attempts add column if not exists max_points integer',
  'alter table quiz_attempts add column if not exists earned_points numeric(8,2)',
  'alter table quiz_attempts add column if not exists graded_at timestamptz',
  'alter table quiz_attempts add column if not exists graded_by uuid references users (id) on delete set null',
  `do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'quiz_attempts_status_check') then
      alter table quiz_attempts add constraint quiz_attempts_status_check
        check ((status = 'graded' and score is not null) or (status = 'pending' and score is null));
    end if;
  end $$`,
  "create index if not exists attempt_pending_idx on quiz_attempts (created_at) where status = 'pending'"
];

const ONBOARDING = [
  'alter table users add column if not exists onboarding_required boolean not null default false',
  'alter table users add column if not exists onboarding_started_at timestamptz',
  'alter table users add column if not exists onboarding_due_at timestamptz',
  'alter table users add column if not exists onboarding_completed_at timestamptz',
  'alter table users add column if not exists onboarding_completed_by uuid references users (id) on delete set null',
  `create table if not exists app_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now(), updated_by uuid references users (id) on delete set null)`,
  'alter table app_settings enable row level security',
  `do $$ begin
    if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on app_settings from anon, authenticated'; end if;
  end $$`
];

// Cek kolom pada tabel yang benar-benar dipakai query aplikasi (mengikuti search_path, tidak harus schema public).
const hasColumn = (table, column) => `SELECT 1 AS x FROM pg_attribute WHERE attrelid = to_regclass('${table}') AND attname = '${column}' AND NOT attisdropped`;
const MIGRATIONS = [
  {name: 'essay & penilaian', check: hasColumn('quiz_attempts', 'status'), statements: ESSAY_GRADING},
  {name: 'onboarding', check: hasColumn('users', 'onboarding_completed_by') + " AND to_regclass('app_settings') IS NOT NULL", statements: ONBOARDING}
];

const checked = new WeakMap();

export function ensureSchema(db) {
  let p = checked.get(db);
  if (!p) {
    p = (async () => {
      let applied = 0;
      for (const m of MIGRATIONS) {
        if (await db.prepare(m.check).first()) continue;
        await db.batch(m.statements.map(q => db.prepare(q)));
        console.warn(`Learning Hub: migrasi ${m.name} diterapkan otomatis.`);
        applied++;
      }
      return applied > 0;
    })();
    p.catch(e => {checked.delete(db); console.error('Learning Hub: migrasi otomatis gagal:', e?.message);}); // gagal → dicoba lagi pada request berikutnya
    checked.set(db, p);
  }
  return p;
}
