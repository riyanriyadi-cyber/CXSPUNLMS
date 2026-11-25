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

**Peserta:** dashboard, course & modul (subjudul → video → gambar → isi; video juga bisa disisipkan di tengah teks lewat tombol ▶ di editor), quiz dengan skor dihitung server, Knowledge Center, bookmark, progres per akun. Detail course, modul, quiz, dan artikel tampil sebagai halaman penuh dengan alamat sendiri (bisa di-refresh, di-bookmark, dan memakai tombol Back), contoh: `#course/cx`, `#learn/cx/2`, `#quiz/cx-quiz`, `#knowledge/empathy`. Quiz yang ditautkan ke course muncul sebagai langkah terakhir di daftar modul; setelah modul terakhir, tombolnya menjadi *Tandai selesai & lanjut ke quiz* (course tetap dihitung selesai tanpa harus lulus quiz).

**Admin** (menu *Admin panel* di sidebar, hanya untuk akun ber-role admin):
- **Materi** — buat/edit course, modul, quiz, dan artikel. Kolom *Isi* memakai editor teks lengkap: font, ukuran, bold/italic/underline/coret, warna & highlight, bullet & numbering, rata teks, indent, tabel, link, kutipan, garis pemisah, undo/redo, serta gambar yang bisa di-paste atau di-drag ke tengah teks (otomatis diunggah). Perubahan tersimpan sebagai *draft*; peserta hanya melihat versi yang sudah di-*publish*. Unggah gambar, tempel link YouTube, pratinjau, urutkan, sembunyikan, hapus.
- **Peserta** — undang lewat email (termasuk freelancer dengan email pribadi), jadikan admin/peserta, nonaktifkan/aktifkan, kirim ulang undangan, lihat progres per orang.
- **Nilai Quiz** — matriks skor terbaik semua peserta × semua quiz (✓ = lulus ≥ 80, — = belum mengerjakan), ringkasan per quiz, urutkan per kolom, filter periode/kategori/status/nama, admin disembunyikan secara default, klik judul quiz untuk daftar per quiz (skor terbaik, terakhir, percobaan, status), klik skor untuk membuka raport, unduh CSV.
- **Quiz essay & Penilaian** — soal bisa *Pilihan ganda* (dinilai otomatis) atau *Essay* (dinilai admin), masing-masing dengan poin sendiri (default PG 1, essay 5). Rubrik/contoh jawaban essay hanya terlihat penilai dan tampil ke peserta sebagai pembahasan setelah dinilai. Percobaan berisi essay berstatus *Menunggu penilaian* sampai admin menilainya di menu **Penilaian** (badge jumlah antrean, nilai kelipatan 0,5, komentar, total skor langsung). Skor = total poin ÷ poin maksimal × 100.
- **SOP** — menu admin **SOP**: judul, kategori, ringkasan, slide/dokumen (Google Slides/Docs/Drive/PDF; dokumen pertama tampil besar di halaman SOP), tulisan SOP opsional, audiens tim, dan status *berlaku / tidak berlaku* (SOP tidak berlaku tetap bisa dibuka sebagai arsip dengan peringatan). Peserta melihat menu **SOP** hanya jika ada SOP untuk timnya; daftar per kategori, pencarian, tanggal terakhir diperbarui, tombol layar penuh. SOP tidak terkunci selama onboarding.
- **Menu admin ringkas** — Peserta, Tim, Onboarding, dan Laporan digabung di menu **Kelola peserta** (tab di atas halaman). Link lama (`#users`, `#teams`, `#onboarding`, `#report`) tetap berfungsi.
- **Tim** — menu **Tim**: buat/ubah nama/hapus tim. Peserta bisa masuk lebih dari satu tim (pilih saat undang, atau *Atur tim* di halaman Peserta). Setiap course, artikel, dan quiz punya audiens *Semua tim* atau *Tim tertentu*; quiz yang ditautkan ke course mengikuti course-nya. Peserta hanya menerima materi untuk semua tim + timnya (dibatasi di server; link langsung ke materi tim lain → tidak ditemukan). Admin selalu melihat semua. Filter tim ada di Peserta, Nilai Quiz, Laporan (dihitung ulang per tim), Penilaian, dan semua CSV. Onboarding bisa punya course tambahan per tim. Materi lama otomatis *Semua tim*.
- **Dokumen terkait** — di setiap artikel dan modul course: *+ Link dokumen* (Google Docs/Sheets/Slides/Forms, file atau folder Drive, PDF, link lain) atau *+ Artikel/course LMS* (pilih dari daftar). Peserta mengklik kartu dokumen → file terbuka di **penampil layar penuh** di dalam LMS (file Google; PDF lewat penampil PDF Google). Ikon ↗ tetap tersedia untuk membuka di tab baru. Bila pratinjau terblokir, LMS mencoba alamat cadangan lalu menampilkan pesan yang jelas (pengaturan situs belum diperbarui / Google meminta pilih akun) dengan tombol buka di tab baru. Panel admin menampilkan peringatan merah bila `vercel.json` yang terpasang masih versi lama. Jenis & pratinjau ditentukan server; hanya `https://`. Atur sharing Drive ke "Siapa saja yang memiliki link" agar freelancer bisa membuka.
- **Onboarding karyawan baru** — menu **Onboarding**: pilih course wajib dan tenggat (default 14 hari, dihitung sejak login pertama). Undangan peserta otomatis *Wajib onboarding* (bisa dimatikan; admin tidak pernah). Selama onboarding, peserta hanya bisa membuka course onboarding dan quiz yang ditautkan ke course itu; materi lain tampil terkunci 🔒 dan ditolak juga oleh API. Selesai = semua modul selesai + semua quiz course itu lulus (≥ 80) → akses penuh terbuka otomatis. Lewat tenggat tidak memblokir, hanya ditandai *Terlambat*. Admin bisa assign peserta lama, *Perpanjang* tenggat, *Buka akses* manual (tercatat), atau *Batalkan*. Peserta lama tidak terpengaruh.
- **Impor/ekspor quiz** — di daftar Quiz: *Unduh template* (Excel berisi contoh, petunjuk, dan daftar course), *Ekspor semua quiz*, *Impor Excel/CSV*. Satu file bisa berisi banyak quiz; `quiz_id` terisi = ganti seluruh pertanyaan quiz itu, kosong = quiz baru. File dicek dulu (pratinjau + daftar baris yang salah) dan hasilnya disimpan sebagai **draft**.
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
| `server/teams.mjs` | Tim: CRUD, anggota, audiens materi, penyaringan katalog per peserta |
| `server/onboarding.mjs` | Program onboarding: pengaturan, status per peserta, syarat selesai, aksi admin |
| `server/schema.mjs` | Menerapkan perubahan database versi ini secara otomatis (hanya menambah, aman diulang) |
| `server/raport.mjs` | Perhitungan raport per peserta & periode |
| `public/raport.js` | Tampilan raport (dipakai aplikasi peserta & panel admin) |
| `client/editor.js` | Editor teks panel admin (di-bundle menjadi `public/editor.js`) |
| `client/xlsx-tools.js` | Baca/tulis Excel untuk impor-ekspor quiz (di-bundle menjadi `public/xlsx-tools.js`, dimuat hanya saat dipakai) |
| `server/supabase-admin.mjs` | Operasi dengan secret key (undang, nonaktifkan, URL unggah) |
| `supabase/migrations/` | Migrasi database — jalankan berurutan |
| `supabase/seed/catalog.json` | Materi contoh awal (sudah dimasukkan oleh migrasi 2) |
| `tests/` | Uji API peserta & admin (Postgres in-memory) |

## Upgrade ke v4.1 (SOP & Kelola peserta)

Upload isi ZIP, tunggu deploy, cek `"version":"4.1.0"`. Jenis konten SOP diaktifkan **otomatis** di database (referensi: `supabase/migrations/20261125000000_sop.sql`).

## Upgrade ke v4.0 (tim)

Upload isi ZIP (termasuk `vercel.json`, sekarang halaman utama selalu dicek ulang ke server sehingga update langsung berlaku tanpa hapus cache), tunggu deploy, cek `"version":"4.0.0"` di `/api/auth/config`. Tabel tim dibuat **otomatis** (referensi: `supabase/migrations/20261123000000_teams.sql`). Semua materi lama tetap untuk semua tim sampai Anda mengubah audiensnya.

## Upgrade ke v3.9 (penampil dokumen)

Upload isi ZIP (termasuk `vercel.json`), tunggu deploy, cek `"version":"3.9.0"` di `/api/auth/config`. Buka panel admin: jika muncul banner merah *Pratinjau dokumen Google belum aktif*, berarti `vercel.json` di GitHub belum versi baru.

## Upgrade ke v3.8 (dokumen terkait)

Upload isi ZIP ke GitHub, tunggu Vercel deploy, cek `https://DOMAIN/api/auth/config` → `"version":"3.8.0"`. Tidak ada perubahan database. `vercel.json` ikut berubah (CSP `frame-src` untuk pratinjau Google), jadi pastikan file itu ikut ter-upload.

## Upgrade ke v3.7 (onboarding)

Upload isi ZIP ke GitHub dan tunggu Vercel deploy. Kolom & tabel onboarding ditambahkan **otomatis** oleh server pada request pertama (file referensi: `supabase/migrations/20261120000000_onboarding.sql`). Cek versi aktif di `https://DOMAIN/api/auth/config` → `"version":"3.7.0"`. Lalu buka admin → **Onboarding**, centang course wajib, Simpan. Tanpa course yang dipilih, tidak ada peserta yang dikunci.

## Upgrade ke v3.6 (dari v3.x yang sudah live)

1. Ganti file di GitHub dengan isi ZIP ini, commit.
2. Tunggu Vercel selesai deploy. Sejak v3.6.1 perubahan database (`20261119000000_essay_grading.sql`: status penilaian pada `quiz_attempts`) diterapkan **otomatis** oleh server pada request pertama, langsung ke database di `DATABASE_URL`; data lama berstatus *dinilai*. Menjalankan file itu manual di SQL Editor tetap boleh (aman diulang).
3. Buka Learning Hub. Menu **Penilaian** dan tombol impor/ekspor di daftar Quiz langsung tersedia.

## Upgrade dari versi tanpa admin (sudah live)

1. **Ganti file di GitHub** dengan isi ZIP ini (upload, timpa file lama, commit). File lama `server/catalog.json` boleh dihapus.
2. **Supabase → SQL Editor**: jalankan `supabase/migrations/20261117020000_admin_cms.sql`, lalu `20261119000000_essay_grading.sql`. Isi migrasi admin: tabel materi, role & status akun, bucket gambar `lms-media`, konversi progres lama, dan 14 materi contoh.
3. **Jadikan akun Anda admin** (akun harus sudah pernah login):
   ```sql
   update public.users set role = 'admin' where email = 'email-anda@spun.global';
   ```
4. **Vercel → Environment Variables**: tambahkan `SUPABASE_SECRET_KEY` = *Secret key* (`sb_secret_…`) dari Supabase → Project Settings → API Keys. Hanya di variabel ini — jangan di `SUPABASE_PUBLISHABLE_KEY`.
5. **Redeploy**, lalu login: menu **Admin panel** muncul di sidebar.

## Setup baru dari nol

1. Supabase: buat project (region Singapore), jalankan **ketiga** file migrasi berurutan, atur Auth (matikan sign-up publik, password min. 12, Site URL & Redirect URLs, SMTP sendiri).
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
- Quiz berisi essay: peserta melihat status *Menunggu penilaian* sampai dinilai. Percobaan yang belum dinilai tidak dihitung di skor terbaik, Nilai Quiz (⏳), raport, maupun laporan.
- Impor quiz yang sedang tayang hanya mengubah draft; peserta tetap melihat versi lama sampai Anda klik **Publish perubahan**.
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
