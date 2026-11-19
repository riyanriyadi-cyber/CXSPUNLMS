// Pengaman skema: menerapkan perubahan database yang dibutuhkan versi ini secara otomatis,
// langsung ke database yang dipakai aplikasi (DATABASE_URL). Hanya menambah, tidak menghapus apa pun,
// dan aman dijalankan berulang. Isinya sama dengan supabase/migrations/20261119000000_essay_grading.sql.
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

const checked = new WeakMap();

export function ensureSchema(db) {
  let p = checked.get(db);
  if (!p) {
    p = (async () => {
      // Cek tabel yang benar-benar dipakai query aplikasi (mengikuti search_path, tidak harus schema public).
      const has = await db.prepare("SELECT 1 AS x FROM pg_attribute WHERE attrelid = to_regclass('quiz_attempts') AND attname = 'status' AND NOT attisdropped").first();
      if (has) return false;
      await db.batch(ESSAY_GRADING.map(q => db.prepare(q)));
      console.warn('Learning Hub: migrasi essay & penilaian diterapkan otomatis.');
      return true;
    })();
    p.catch(e => {checked.delete(db); console.error('Learning Hub: migrasi otomatis gagal:', e?.message);}); // gagal → dicoba lagi pada request berikutnya
    checked.set(db, p);
  }
  return p;
}
