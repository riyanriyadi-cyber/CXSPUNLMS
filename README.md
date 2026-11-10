# SPUN Learning Hub — versi Supabase + halaman admin

Karyawan login dengan akun Google apa saja (Gmail atau akun kerja). Data disimpan di **Supabase (Postgres)**. Admin non-teknis mengelola course, lesson, penugasan, dan orang langsung dari web app, tanpa Google Sheets dan tanpa Apps Script.

```
Browser ──Google Sign-In──► Vercel (halaman + /api/session + /api/rpc) ──kunci rahasia, server saja──► Supabase (Postgres)
```

## Yang berubah dibanding versi Apps Script
| | Sebelumnya | Sekarang |
|---|---|---|
| Database | Google Sheets | Supabase Postgres (relasi, constraint, backup) |
| Backend | Apps Script + tanda tangan HMAC | Fungsi server di Vercel (`api/`, `lib/`) |
| Isi konten | Mengetik di sheet | **Halaman Administration**: formulir, dropdown, pesan error yang jelas, pratinjau |
| Environment variable | `BACKEND_URL`, `SHARED_SECRET` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (dua yang lama dihapus) |
| Login, tampilan karyawan, aturan akses | — | **Tetap sama** |

Apps Script dan Google Sheet lama tidak dipakai lagi dan boleh dimatikan setelah semuanya berjalan.

---
## Langkah 1 — Siapkan Supabase
1. Buka supabase.com → **New project**. Pilih region terdekat (mis. Singapore), buat password database dan simpan.
2. Tunggu proyek siap. Buka **SQL Editor → New query**, tempel **seluruh isi `supabase/schema.sql`**, lalu **Run**. Harus sukses tanpa error. (Aman dijalankan ulang.)
3. Buka **Table Editor**. Harus ada 5 tabel: `users`, `courses`, `lessons`, `enrollments`, `lesson_progress`.
4. Buka **Project Settings → API** (nama menu bisa sedikit berbeda). Salin:
   - **Project URL** → untuk `SUPABASE_URL`
   - kunci rahasia **`service_role`** (di tampilan baru bernama *secret key*) → untuk `SUPABASE_SERVICE_ROLE_KEY`

   > Kunci `service_role` memberi akses penuh ke database. Simpan hanya di Vercel. Jangan tempel di chat, kode, atau GitHub. Jangan pakai kunci `anon`/*publishable*.

## Langkah 2 — Daftarkan diri Anda sebagai Super Admin
Di **SQL Editor**, jalankan (ganti email dan nama):
```sql
insert into public.users (email, email_key, full_name, role)
values ('riyan.riyadi@gmail.com', 'riyanriyadi@gmail.com', 'Riyan Riyadi', 'SUPER_ADMIN');
```
`email_key` adalah email dalam huruf kecil. **Khusus Gmail**: hapus titik dan semua setelah `+` pada bagian sebelum `@` (dan `googlemail.com` jadi `gmail.com`). Untuk email non-Gmail (mis. `nama@spun.global`) cukup huruf kecil, titik tetap. Contoh akun kerja:
```sql
insert into public.users (email, email_key, full_name, role)
values ('riyan.riyadi@spun.global', 'riyan.riyadi@spun.global', 'Riyan Riyadi', 'SUPER_ADMIN');
```
Orang lain nanti ditambahkan lewat web app (tab People), `email_key` terisi otomatis.

## Langkah 3 — Vercel
1. Ganti kode di repositori GitHub dengan isi folder ini (lihat bagian "Mengunggah" di bawah).
2. Vercel → proyek → **Settings → Environment Variables**. Pastikan ada:

   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | tetap yang lama |
   | `SESSION_SECRET` | tetap yang lama |
   | `SUPABASE_URL` | dari Langkah 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | dari Langkah 1 |

   Hapus `BACKEND_URL` dan `SHARED_SECRET` (tidak dipakai lagi).
3. **Deployments → Redeploy** (hilangkan centang build cache). Tunggu **Ready**. Pengaturan Google Cloud (Client ID, Authorized JavaScript origins) tidak berubah.

## Langkah 4 — Uji
1. Buka situs dan login dengan akun yang Anda daftarkan di Langkah 2 → dashboard muncul, menu **Administration** ada.
2. Administration → **Courses → New course** → isi → **Create course** → **Add lesson** beberapa kali → centang **Published** → **Save course**.
3. Tab **Assign courses** → pilih course dan karyawan → **Assign course**.
4. Login sebagai karyawan itu (jendela incognito) → course muncul, selesaikan satu lesson, muat ulang, progres tetap.
5. Login dengan akun yang tidak terdaftar → halaman "You can't open the Learning Hub".

---
## Panduan admin (non-teknis)
- **Membuat course:** Administration → Courses → *New course*. Course baru berstatus *Draft*, jadi tidak terlihat siapa pun.
- **Menambah lesson:** di halaman course, klik *Add lesson*. Pilih tipe: **Text**, **Image**, **Video** (YouTube/Vimeo/Google Drive), atau **Google Drive / Docs file**. Tempel link. Kalau link tidak didukung, aplikasi langsung menjelaskan alasannya dan tidak menyimpan.
- **Required vs Optional:** hanya lesson *Required* yang dihitung untuk progres course. Course butuh minimal satu lesson wajib sebelum bisa di-*Publish*.
- **Mengurutkan:** tombol ↑ ↓ di tiap lesson. **Preview** menunjukkan tampilan karyawan tanpa mencatat progres.
- **Menugaskan:** tab *Assign courses*. Bisa banyak karyawan sekaligus, dengan tanggal jatuh tempo opsional. Yang sudah punya course itu dilewati otomatis.
- **Menambah orang (Super Admin):** tab *People*. Satu per satu, atau banyak sekaligus (tempel satu baris per orang: `email, nama, departemen, email manajer`). Isi *Manager's email* supaya Team Lead melihat progres anggotanya.
- **Menghentikan akses karyawan:** People → Edit → Status *Inactive*. Aksesnya langsung berhenti.
- **Menghapus course:** hanya bisa jika belum pernah ditugaskan. Kalau sudah, gunakan *Unpublish* supaya riwayat tetap ada.
- **File Google Drive:** karyawan hanya bisa melihat file yang sudah dibagikan ke akun Google mereka (atau "Anyone with the link").

## Memindahkan data dari Google Sheets (opsional)
Kalau konten dan progres lama ingin dipakai (atau cukup input ulang lewat halaman admin):
1. Di Google Sheets, untuk tiap tab: **File → Download → CSV**. Taruh kelima file (`USERS`, `COURSES`, `LESSONS`, `ENROLLMENTS`, `LESSON_PROGRESS`) dalam satu folder, mis. `export/`. Nama file harus mengandung nama tab.
2. Di komputer yang punya Node.js: `npm install`, buat file `.env` berisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (jangan di-commit).
3. Uji tanpa menulis apa pun: `node scripts/import-from-sheets.js ./export`. Baca baris yang dilaporkan bermasalah.
4. Jika sudah sesuai: `node --env-file=.env scripts/import-from-sheets.js ./export --apply`.

ID lama dipertahankan, aman dijalankan ulang (data yang sudah ada dilewati).

## Keamanan
- Browser tidak pernah memegang kunci database. Hanya fungsi server di Vercel yang mengaksesnya.
- Semua tabel memakai Row Level Security tanpa kebijakan dan hak `anon`/`authenticated` dicabut, jadi kunci publik Supabase tidak bisa membaca apa pun.
- Identitas berasal dari token Google yang diverifikasi server (tanda tangan, audience, `email_verified`) lalu cookie sesi bertanda tangan (HttpOnly, Secure, SameSite). Email, role, dan ID dari browser tidak pernah dipercaya.
- Setiap fungsi server memeriksa role. Karyawan hanya mengakses course yang ditugaskan kepadanya. Team Lead hanya melihat anggotanya.
- Database menegakkan keunikan: tidak ada penugasan aktif ganda dan tidak ada baris progres ganda, walau dua permintaan datang bersamaan.
- Link konten hanya `https://` dan hanya YouTube, Vimeo, Google Drive/Docs (atau gambar https). Teks lesson tampil sebagai teks biasa, tidak pernah HTML.
- Akun Gmail pribadi tidak bisa dikontrol perusahaan (tanpa MFA wajib). Saat karyawan keluar, ubah status menjadi *Inactive*.

## Hasil pengujian
`npm test` menjalankan **55 tes, semuanya lolos**: logika inti 22 (akses, role, visibilitas, progres, isolasi, Gmail, validasi), kelola course dan lesson 12, lapisan data 4, HTTP/sesi 7, impor CSV 2, dan antarmuka 6 (kode `public/app.js` yang asli dijalankan pada DOM tiruan: login, dashboard, alur admin dari membuat course sampai karyawan melihatnya).

**Belum pernah dijalankan di sini** karena lingkungan saya tidak punya Postgres, akses internet, atau browser:
- `supabase/schema.sql` di Postgres/Supabase asli. Tes memakai database simulasi yang meniru constraint-nya, bukan database sungguhan.
- Klien `@supabase/supabase-js` asli. Pemakaian API-nya diuji pada tiruan.
- Login Google sungguhan, deploy Vercel, dan tampilan di browser/ponsel sungguhan.

Karena itu, lakukan **Langkah 4** dengan teliti. Jika ada error, kirim pesannya.

## Pemecahan masalah
| Gejala | Penyebab / solusi |
|---|---|
| SQL schema error | Salin ulang seluruh `schema.sql`, jalankan satu kali di SQL Editor, lalu kirim pesan errornya |
| "The service is not configured correctly" | `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` salah/kosong, atau belum Redeploy. Cek Vercel → Logs |
| "You can't open…" untuk akun Anda | Baris di `users` belum ada, `is_active` bukan true, atau `email_key` salah (lihat aturan Langkah 2) |
| Course tidak muncul untuk karyawan | Belum ditugaskan, atau belum *Published* |
| Tombol Publish ditolak | Course butuh minimal satu lesson *Required* |
| Proyek Supabase "paused" | Paket gratis menjeda proyek yang lama tidak aktif. Buka dashboard dan *Restore* |
| Build Vercel gagal | Pastikan `package.json` di akar repositori dan Node 24.x |

## Struktur file
```
api/rpc.js, api/session.js          pintu masuk HTTP
lib/ (store, auth, courses, progress, team, admin, authoring, content, routes, ...)
public/ (index.html, styles.css, app.js)
supabase/schema.sql                 skema database
scripts/import-from-sheets.js       migrasi opsional
test/                               55 tes
package.json, vercel.json, .env.example
```
**Mengunggah ke GitHub:** struktur folder harus utuh (`api`, `lib`, `public`, ...). Di Chrome/Edge seret **folder**-nya ke halaman *Upload files*, atau tekan `.` di repositori untuk membuka editor web lalu seret folder ke panel Explorer, atau pakai Vercel CLI (`vercel --prod` dari folder proyek). Tidak ada dua file bernama sama, jadi tidak ada yang saling menimpa.
