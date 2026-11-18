# SPUN Learning Hub — Supabase + Vercel

LMS SPUN dengan frontend HTML/CSS/JS statis, API di **Vercel Functions**, data di **Supabase Postgres**, akun di **Supabase Auth**, gambar materi di **Supabase Storage**, dan **panel admin** di `/admin.html`.

```
Browser ──(login, undangan, reset)──▶ Supabase Auth
   │
   ├─ /api/*        + Bearer token ──▶ Vercel Function ──▶ Supabase Postgres
   ├─ /api/admin/*  (role admin)   ──┘    └─ secret key (server saja): undang, nonaktifkan, URL unggah
   └─ unggah gambar (signed URL) ──▶ Supabase Storage (bucket lms-media)
```

## Fitur

**Raport:** setiap peserta punya raport pembelajaran (menu *Raport saya*); admin bisa membuka raport siapa pun dari menu Peserta. Filter periode (bulan ini, bulan lalu, 3 bulan, tahun ini, rentang tanggal), grafik aktivitas mingguan, tabel course & quiz, artikel dibaca, dan tombol **Unduh PDF** (cetak A4). Tanpa predikat; status lulus quiz = skor terbaik ≥ 80.

**Peserta:** dashboard, course & modul (teks, gambar, video YouTube), quiz dengan skor dihitung server, Knowledge Center, bookmark, progres per akun. Detail course, modul, quiz, dan artikel tampil sebagai halaman penuh dengan alamat sendiri (bisa di-refresh, di-bookmark, dan memakai tombol Back), contoh: `#course/cx`, `#learn/cx/2`, `#quiz/cx-quiz`, `#knowledge/empathy`.

**Admin** (menu *Admin panel* di sidebar, hanya untuk akun ber-role admin):
- **Materi** — buat/edit course, modul, quiz, dan artikel. Kolom *Isi* memakai editor teks lengkap: font, ukuran, bold/italic/underline/coret, warna & highlight, bullet & numbering, rata teks, indent, tabel, link, kutipan, garis pemisah, undo/redo, serta gambar yang bisa di-paste atau di-drag ke tengah teks (otomatis diunggah). Perubahan tersimpan sebagai *draft*; peserta hanya melihat versi yang sudah di-*publish*. Unggah gambar, tempel link YouTube, pratinjau, urutkan, sembunyikan, hapus.
- **Peserta** — undang lewat email (termasuk freelancer dengan email pribadi), jadikan admin/peserta, nonaktifkan/aktifkan, kirim ulang undangan, lihat progres per orang.
- **Laporan** — progres per course, hasil per quiz, unduh CSV peserta.

Keamanan: HTML dari editor disaring ketat di server (`server/rich.mjs`, daftar izin tag/atribut/style; gambar hanya dari bucket proyek); role dan status dicek di database setiap request; kunci jawaban quiz tidak pernah dikirim ke browser; semua teks materi di-escape; tabel tertutup dari Data API Supabase (RLS); secret key hanya di server. Dua admin yang mengedit konten yang sama tidak saling menimpa (deteksi revisi).

## Struktur

| File/folder | Fungsi |
| --- | --- |
| `public/index.html`, `app.js`, `styles.css` | Aplikasi peserta |
| `public/admin.html`, `admin.js`, `admin.css` | Panel admin |
| `client/auth.js` | Login/undangan/reset (di-bundle menjadi `public/auth.js` saat build) |
| `api/handler.js` | Vercel Function untuk semua `/api/*` — **file hasil build** (bundle satu file dari `server/`). Setelah mengubah apa pun di `server/`, jalankan `npm run build:api` lalu commit file ini |
| `server/vercel-entry.mjs` | Sumber Vercel Function sebelum di-bundle |
| `server/app.mjs` | Verifikasi token, role & status, routing |
| `server/core.mjs` | API peserta |
| `server/admin.mjs` | API admin |
| `server/content.mjs` | Model, validasi, dan escape materi |
| `server/rich.mjs` | Penyaring HTML kolom Isi |
| `server/raport.mjs` | Perhitungan raport per peserta & periode |
| `public/raport.js` | Tampilan raport (dipakai aplikasi peserta & panel admin) |
| `client/editor.js` | Editor teks panel admin (di-bundle menjadi `public/editor.js`) |
| `server/supabase-admin.mjs` | Operasi dengan secret key (undang, nonaktifkan, URL unggah) |
| `supabase/migrations/` | Migrasi database — jalankan berurutan |
| `supabase/seed/catalog.json` | Materi contoh awal (sudah dimasukkan oleh migrasi 2) |
| `tests/` | Uji API peserta & admin (Postgres in-memory) |

## Upgrade dari versi tanpa admin (sudah live)

1. **Ganti file di GitHub** dengan isi ZIP ini (upload, timpa file lama, commit). File lama `server/catalog.json` boleh dihapus.
2. **Supabase → SQL Editor**: jalankan `supabase/migrations/20261117020000_admin_cms.sql`. Isinya: tabel materi, role & status akun, bucket gambar `lms-media`, konversi progres lama, dan 14 materi contoh.
3. **Jadikan akun Anda admin** (akun harus sudah pernah login):
   ```sql
   update public.users set role = 'admin' where email = 'email-anda@spun.global';
   ```
4. **Vercel → Environment Variables**: tambahkan `SUPABASE_SECRET_KEY` = *Secret key* (`sb_secret_…`) dari Supabase → Project Settings → API Keys. Hanya di variabel ini — jangan di `SUPABASE_PUBLISHABLE_KEY`.
5. **Redeploy**, lalu login: menu **Admin panel** muncul di sidebar.

## Setup baru dari nol

1. Supabase: buat project (region Singapore), jalankan **kedua** file migrasi berurutan, atur Auth (matikan sign-up publik, password min. 12, Site URL & Redirect URLs, SMTP sendiri).
2. Vercel: import repo, Framework **Other**, isi env var:

   | Variabel | Isi |
   | --- | --- |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) atau legacy anon key |
   | `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`) atau legacy service_role — **rahasia, server saja** |
   | `DATABASE_URL` | Transaction pooler, port 6543 |
   | `ALLOW_REGISTRATION` | `false` |

3. Login sekali, jadikan akun Anda admin (SQL di atas), lalu kelola sisanya dari panel admin.

## Catatan pemakaian admin

- **Draft vs tayang**: “Simpan draft” tidak mengubah apa yang dilihat peserta. Klik **Publish** / **Publish perubahan** untuk menayangkan.
- **Sembunyikan** menarik konten dari peserta tanpa menghapus progres. **Hapus** hanya untuk konten yang tidak tayang dan bersifat permanen.
- Menyisipkan, mengurutkan, atau menghapus modul aman: progres peserta tercatat per ID modul.
- Gambar maks. 5 MB (PNG/JPG/WEBP/GIF). Video lewat link YouTube (bisa *unlisted*).
- Durasi course dihitung otomatis dari durasi modul. Nilai lulus quiz tetap 80.
- Undangan dan reset password butuh SMTP sendiri di Supabase.
- Admin tidak bisa mengubah role/status akunnya sendiri, jadi selalu tersisa minimal satu admin.

## Pengembangan lokal

```bash
npm install
cp .env.example .env   # isi variabel Supabase
npm run dev            # http://localhost:4173
npm run build:api      # wajib setelah mengubah folder server/
npm test               # tidak butuh Supabase
```

## Batas versi

Belum ada sertifikat, unggah video langsung (pakai YouTube), SCORM, atau riwayat versi materi. Hapus akun permanen dilakukan di Supabase → Authentication → Users.
