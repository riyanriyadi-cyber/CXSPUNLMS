# SPUN Learning Hub — Supabase + Vercel

LMS SPUN dengan frontend HTML/CSS/JS statis, API di **Vercel Functions**, data di **Supabase Postgres**, dan akun di **Supabase Auth** (email + password, undangan, reset password).

```
Browser ──(Supabase Auth: login, undangan, reset)──▶ Supabase Auth
   │
   └─ /api/*  + Bearer access token ──▶ Vercel Function (api/handler.js)
                                          ├─ verifikasi JWT (JWKS Supabase)
                                          └─ SQL ──▶ Supabase Postgres (pooler)
```

Penilaian quiz tetap di server: kunci jawaban ada di `server/catalog.json` dan tidak pernah dikirim ke browser. Browser hanya memegang *publishable key*; tabel data belajar tertutup dari Data API Supabase (RLS aktif, hak `anon`/`authenticated` dicabut).

## Struktur

| File/folder | Fungsi |
| --- | --- |
| `public/` | Frontend (HTML, CSS, `app.js`, aset). `public/auth.js` dihasilkan saat build |
| `client/auth.js` | Sumber UI login/daftar/undangan/reset + klien Supabase Auth |
| `api/handler.js` | Vercel Function untuk semua `/api/*` |
| `server/app.mjs` | Handler API: verifikasi token, sinkron profil, routing ke `core.mjs` |
| `server/core.mjs` | Logika belajar & penilaian quiz (tidak berubah dari versi sebelumnya) |
| `server/auth.mjs` | Verifikasi access token Supabase |
| `server/db.mjs` | Adapter Postgres (postgres.js) |
| `server/catalog.json` | Course, modul, soal + kunci jawaban, artikel |
| `supabase/migrations/` | Schema database (jalankan sekali) |
| `scripts/dev.mjs` | Server lokal yang meniru Vercel |
| `tests/` | Uji API dengan Postgres (PGlite) + verifikasi JWT |

## Setup 1 — Supabase

1. Buat project di [supabase.com](https://supabase.com). Pilih region **Southeast Asia (Singapore)** agar dekat dengan fungsi Vercel (`sin1`).
2. **SQL Editor** → tempel isi `supabase/migrations/20261117000000_learning_hub_init.sql` → Run.
3. **Authentication → Sign In / Providers**
   - Matikan **Allow new users to sign up** (rekomendasi: akun hanya lewat undangan).
   - Biarkan **Confirm email** aktif.
   - Set **Minimum password length** = 12.
4. **Authentication → URL Configuration**: isi **Site URL** dengan domain Vercel (mis. `https://learning.spun.global`) dan tambahkan domain itu + `http://localhost:4173` ke **Redirect URLs**.
5. **Authentication → SMTP Settings**: pasang SMTP sendiri (Google Workspace SMTP relay, Brevo, Resend, dll.). **Wajib** untuk undangan dan reset password: tanpa SMTP sendiri, Supabase hanya mengirim email ke anggota tim project Supabase dan dibatasi ±2 email/jam.
6. Catat dari **Project Settings**:
   - **API Keys** → *Publishable key* (`sb_publishable_…`; boleh juga legacy *anon key*).
   - **Connect → Transaction pooler** → connection string port **6543** (ganti `[YOUR-PASSWORD]`).

## Setup 2 — Vercel

1. Push folder ini ke repo GitHub (private), lalu **Vercel → Add New Project** → import repo. Framework preset: **Other** (pengaturan build sudah ada di `vercel.json`).
2. **Environment Variables** (Production + Preview):

   | Variabel | Isi |
   | --- | --- |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | publishable/anon key |
   | `DATABASE_URL` | connection string transaction pooler (port 6543) |
   | `ALLOW_REGISTRATION` | `false` (hanya mengatur tampilan tombol Daftar) |

3. Deploy. Pasang custom domain bila perlu, lalu samakan dengan Site URL di Supabase.

## Mengelola akun

- **Undang peserta** (termasuk freelancer/kontrak dengan email non-spun.global): Supabase → Authentication → Users → **Invite user**. Peserta klik link di email → isi nama + password → langsung masuk.
- **Tanpa SMTP (sementara)**: Users → **Add user → Create new user**, centang *Auto Confirm*, lalu berikan password awal secara aman. Lupa password tidak akan berfungsi sampai SMTP dipasang.
- **Nonaktifkan/hapus akun**: hapus user di Authentication → Users. Seluruh progres, bookmark, dan riwayat quiz ikut terhapus (cascade).
- **Pendaftaran terbuka**: hanya jika *Allow new users to sign up* di Supabase dinyalakan. `ALLOW_REGISTRATION=true` sekadar memunculkan tombol Daftar; gerbang sebenarnya ada di Supabase.

## Laporan progres

View `learning_report` (SQL Editor atau Table Editor): nama, email, jumlah course diikuti, modul selesai, quiz dicoba/lulus (≥80), aktivitas terakhir. Contoh:

```sql
select * from learning_report order by last_activity desc nulls last;
```

## Pengembangan lokal

```bash
npm install
cp .env.example .env   # isi SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DATABASE_URL
npm run dev            # http://localhost:4173
npm test               # tidak butuh Supabase; memakai Postgres in-memory
```

Alternatif: `vercel dev` (Vercel CLI) memakai `vercel.json` yang sama.

## Mengubah materi

Edit `server/catalog.json`, commit, deploy. Jangan mengganti ID course/quiz/artikel atau urutan modul yang sudah dipakai: progres merujuk ID dan indeks modul. Riwayat quiz menyimpan snapshot pembahasan saat dikumpulkan.

## Catatan & batas versi

- Materi adalah contoh latihan, bukan SOP resmi. Penyelesaian modul bersifat self-reported; quiz untuk latihan, bukan ujian berpengawasan.
- Data dari versi SQLite/Cloudflare lama tidak dimigrasikan; akun dimulai dari nol.
- Belum ada editor materi/admin di dalam aplikasi, sertifikat, unggah video, atau SCORM.
- Biaya: Vercel Hobby dibatasi untuk penggunaan non-komersial (aplikasi internal perusahaan perlu Pro). Project Supabase Free di-pause setelah 1 minggu tanpa aktivitas; Pro tidak.
