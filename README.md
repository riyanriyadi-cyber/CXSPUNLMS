# SPUN Learning Hub — HTML + Backend

LMS dengan frontend HTML/CSS/JavaScript dan backend JavaScript. Progres, skor, dan simpanan disimpan per akun dalam database, bukan localStorage. Desain memakai logo dan warna SPUN.

## Mulai di komputer

1. Install **Node.js 24 atau lebih baru**.
2. Ekstrak source, lalu buka terminal di folder `SPUN_Learning_Hub`.
3. Jalankan `npm start`.
4. Buka **http://127.0.0.1:4173**.
5. Klik **Belum punya akun? Daftar**. Password minimal 12 karakter.

Tidak ada akun/password bawaan. Untuk menjalankan Node lokal, tidak perlu mengunduh dependency: SQLite memakai modul bawaan Node. Tidak perlu XAMPP/MySQL. Database dan tabel otomatis dibuat di `data/learning-hub.sqlite`. Jangan membuka HTML langsung menggunakan `file://`; frontend membutuhkan API.

## Fitur

- Login, daftar, dan logout pada instalasi Node.js.
- Dashboard personal, 6 course contoh dengan 22 modul, pencarian, filter, dan bookmark.
- Enrollment dan progres modul yang tetap tersimpan setelah restart.
- 3 quiz × 5 soal, skor dihitung server, pembahasan, pengulangan, dan skor terbaik.
- 5 artikel, filter topik, pencarian, simpan, dan status dibaca.
- Pencarian global, profil, notifikasi belajar, serta desain responsif.

Materi adalah contoh latihan, bukan SOP resmi SPUN. Progres akun baru dimulai dari nol; progres demo lama di browser tidak diimpor. Durasi belajar adalah estimasi jumlah durasi modul selesai. Penyelesaian modul bersifat self-reported. Quiz dengan pembahasan dan pengulangan ini ditujukan untuk latihan, bukan ujian berpengawasan.

## Struktur

| File/folder | Fungsi |
| --- | --- |
| `public/index.html` | Struktur HTML |
| `public/styles.css` | Desain dan responsivitas |
| `public/app.js` | UI, navigasi, dan pemanggilan API |
| `public/auth.js` | Form login/daftar dan bootstrap akun |
| `public/assets/` | Logo dan favicon |
| `server/node.mjs` | Server HTTP Node.js |
| `server/core.mjs` | API pembelajaran dan penilaian quiz |
| `server/auth-local.mjs` | Password hash dan sesi login |
| `server/sqlite.mjs` | Adapter SQLite dan migrasi |
| `server/catalog.json` | Course, soal/kunci jawaban, dan artikel |
| `server/worker.mjs` | Adapter hosted Workers + identitas ChatGPT |
| `db/schema.ts` | Definisi schema |
| `drizzle/` | Migrasi SQL dan metadata |
| `tests/` | Pengujian backend |
| `docs/API.md` | Dokumentasi endpoint |
| `.env.example` | Contoh konfigurasi tanpa secret |

## Konfigurasi

Salin `.env.example` menjadi `.env` jika diperlukan. Default cukup untuk lokal.

| Variabel | Default lokal | Fungsi |
| --- | --- | --- |
| PORT | 4173 | Port server |
| HOST | 127.0.0.1 | Bind address; 0.0.0.0 untuk reverse proxy |
| DB_PATH | ./data/learning-hub.sqlite | Lokasi database |
| NODE_ENV | development | Set production pada hosting |
| APP_ORIGIN | Origin localhost | Origin HTTPS wajib pada produksi, tanpa path |
| ALLOW_REGISTRATION | true di development; false di production | Membuka/menutup pendaftaran |

Hosting Node memerlukan disk persisten, Node 24+, HTTPS reverse proxy, `NODE_ENV=production`, dan `APP_ORIGIN=https://domain-anda`. Aktifkan pendaftaran sementara pada lingkungan dengan akses terbatas untuk membuat akun, lalu tutup dan restart. Email belum diverifikasi; domain email yang diketik bukan bukti keanggotaan perusahaan. Default bind lokal membatasi akses ke komputer yang menjalankan aplikasi.

Password di-hash dengan scrypt dan salt acak. Sesi berupa cookie HttpOnly, SameSite=Lax, 7 hari, dan Secure pada HTTPS. Token sesi disimpan sebagai hash. Mutasi memeriksa origin/header khusus; SQL memakai parameter. Login/daftar dibatasi per alamat IP koneksi (di belakang proxy, beberapa pengguna dapat berbagi limit). Server Node menolak header identitas ChatGPT yang dikirim klien.

Cadangkan melalui SQLite backup atau setelah server dihentikan normal; jangan menyalin hanya file .sqlite ketika WAL aktif. Gunakan satu instance Node untuk satu file database.

## Mengubah materi dan schema

Edit `server/catalog.json`, lalu restart server atau build/deploy ulang. Jangan mengganti ID atau urutan modul yang telah digunakan tanpa migrasi: progres merujuk ID dan indeks modul. Riwayat quiz menyimpan snapshot pembahasan saat pengumpulan.

Untuk perubahan schema:

```bash
npm ci
npm run db:generate
npm test
```

Periksa SQL baru. Jangan edit migrasi yang telah diterapkan. Node menerapkan migrasi yang belum tercatat saat startup. Migrasi awal tidak mengisi akun, password, atau progres contoh.

## Versi hosted

Adapter hosted memakai API yang sama, **Cloudflare D1**, dan login **ChatGPT** milik platform. Login password hanya tersedia pada server Node. Akun/database Node dan hosted adalah lingkungan terpisah; tidak disinkronkan otomatis.

```bash
npm ci
npm run build
```

Build menghasilkan `dist/server/index.js` berisi Worker dan aset HTML. `.openai/hosting.json` mendeklarasikan binding DB; workflow Sites menerapkan migrasi D1. Identitas header hosted hanya dipercaya di gateway Sites. Jangan mengekspos Worker mentah dengan asumsi header dari klien adalah identitas tepercaya.

## Validasi dan batas versi

Jalankan `npm test`. Pengujian mencakup akses anonim, header identitas palsu, hashing, login/logout, CSRF, pemisahan akun, validasi modul, bookmark, skor server, idempotensi percobaan, pembatasan login, serta persistensi setelah restart. Halaman login diperiksa secara visual; sesi ChatGPT pengguna pada produksi tidak dijalankan otomatis.

Belum termasuk editor/admin materi, reset password email, verifikasi email, sertifikat, unggah video, atau SCORM. Materi dapat diganti melalui katalog. Akun dan database pengujian tidak disertakan dalam paket source.

Referensi: [Node.js SQLite](https://nodejs.org/api/sqlite.html), [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/), [D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/).
