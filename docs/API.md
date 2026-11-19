# API SPUN Learning Hub

Base URL: domain Vercel (lokal `http://localhost:4173`). Semua respons berupa JSON dengan Cache-Control: no-store. Error berbentuk `{"error":"pesan"}`.

Autentikasi memakai Supabase Auth. Setiap request (kecuali `/api/auth/config`) wajib membawa `Authorization: Bearer <access_token>` dari sesi Supabase. Login, daftar, undangan, reset password, dan logout dilakukan langsung ke Supabase Auth oleh `client/auth.js`, bukan lewat API ini. Profil (`users`) dibuat/diperbarui otomatis dari token pada request pertama.

Mutasi juga membutuhkan Content-Type: application/json, X-Learning-Hub: 1, dan Origin yang sama dengan aplikasi. Maksimum body JSON: 16 KiB.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | /api/auth/config | Publik: URL Supabase, publishable key, status tombol daftar |
| GET | /api/me | Profil dan state pembelajaran |
| GET | /api/catalog | Materi dan soal, tanpa kunci jawaban |
| POST | /api/courses/:id/enroll | Mengikuti course |
| POST | /api/courses/:id/lessons/:index/complete | Selesai modul; indeks mulai 0 |
| POST | /api/bookmarks | Simpan/hapus simpanan |
| POST | /api/articles/:id/read | Tandai dibaca |
| POST | /api/quizzes/:id/attempts | Kumpulkan jawaban |
| GET | /api/quizzes/:id/attempts | Maksimal 50 percobaan terakhir milik akun aktif |
| GET | /api/me/raport?from=YYYY-MM-DD&to=YYYY-MM-DD | Raport akun sendiri (parameter opsional; tanpa parameter = seluruh waktu, zona WIB) |

## Body request

Enroll, complete, dan read menggunakan `{}`.

Bookmark:

```json
{"kind":"article","id":"empathy","saved":true}
```

kind: article atau course. saved:false menghapus simpanan. ID harus ada dalam katalog.

Submit quiz:

```javascript
const attemptId = crypto.randomUUID();
const response = await fetch('/api/quizzes/cx-quiz/attempts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Learning-Hub': '1', Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({ attemptId, answers: [0, 2, 1, 2, 1] })
});
const data = await response.json();
```

Jawaban adalah indeks opsi mulai 0. Pertahankan attemptId saat mengulang request akibat gangguan jaringan. ID dan jawaban sama tidak menambah percobaan; ID sama dengan jawaban/quiz berbeda menghasilkan 409. Percobaan baru memakai UUID baru. Nilai dari klien diabaikan; server menghitungnya sendiri.

Respons quiz: `{result,state}`. result berisi score, correct, total, passed, answers, review. Endpoint mutasi lainnya mengembalikan `{state}`. Skor terbaik berasal dari seluruh percobaan pengguna. Batas lulus latihan 80. Semua query data pembelajaran dibatasi ke identitas pengguna aktif; user ID dari body tidak digunakan.

| Status | Arti |
| --- | --- |
| 400 | JSON/request salah |
| 401 | Token tidak ada, tidak valid, atau kedaluwarsa |
| 403 | Origin/header mutasi tidak sesuai |
| 404 | Endpoint atau materi tidak tersedia |
| 409 | Konflik ID percobaan |
| 413 | Body terlalu besar |
| 415 | Content-Type salah |
| 422 | Input tidak valid |
| 500/503 | Kendala server/database atau konfigurasi Supabase belum lengkap |

## API admin

Semua endpoint `/api/admin/*` butuh akun dengan `role = 'admin'` (dicek di database setiap request; selain admin → 403). Akun berstatus `disabled` ditolak di semua endpoint (403, `code: "disabled"`). `kind` = `course` | `quiz` | `article`.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | /api/admin/content | Ringkasan semua materi + status (`draft`, `published`, `changed`) |
| GET | /api/admin/content/:kind/:id | Draft lengkap untuk editor |
| POST | /api/admin/content/:kind | Buat materi baru `{draft}` (ID dibuat dari judul) |
| POST | /api/admin/content/:kind/:id | Simpan draft `{draft, baseRevision}`; 409 jika sudah diubah admin lain |
| POST | /api/admin/content/:kind/:id/publish | Tayangkan draft (validasi ketat) |
| POST | /api/admin/content/:kind/:id/unpublish | Sembunyikan dari peserta |
| POST | /api/admin/content/:kind/:id/delete | Hapus permanen (hanya jika tidak tayang) |
| POST | /api/admin/content/:kind/reorder | `{ids: [...]}` urutan tampil |
| POST | /api/admin/media/upload-url | `{contentType, size}` → `{uploadUrl, publicUrl}` (PNG/JPG/WEBP/GIF, ≤ 5 MB) |
| GET | /api/admin/users | Semua akun (termasuk yang belum aktivasi) + ringkasan progres |
| POST | /api/admin/users/invite | `{name, email, role}` kirim undangan |
| GET | /api/admin/users/:id | Progres per course & quiz |
| GET | /api/admin/users/:id/raport?from&to | Raport peserta mana pun (format sama dengan /api/me/raport) |
| POST | /api/admin/users/:id/role | `{role: "admin" | "learner"}` |
| POST | /api/admin/users/:id/status | `{status: "active" | "disabled"}` (juga ban/unban di Supabase Auth) |
| POST | /api/admin/users/:id/resend | Kirim ulang undangan (hanya untuk yang belum pernah masuk) |
| GET | /api/admin/report | Statistik per course & quiz + daftar peserta |
| GET | /api/admin/scores?from&to | Matriks nilai: `quizzes`, `users`, `cells[userId][quizId] = {best, last, attempts, lastAt}` (hanya quiz tayang; percobaan dalam periode) |

Format bagian (section) modul/artikel: `{heading, html, image?: {url, alt, caption}, video?: {youtubeId, title}}`. `html` disaring server (tag: p, br, strong, em, u, s, span, a, ul, ol, li, blockquote, hr, table, img; style: text-align, font-family terbatas, font-size 13/18/22px, color, background-color). Format lama `body` (teks biasa) tetap diterima dan dikonversi otomatis. Saat menyimpan, `video` boleh dikirim sebagai `{url: "<link YouTube>"}`. URL gambar harus dari bucket `lms-media` proyek ini.

Endpoint peserta `POST /api/courses/:id/lessons/:index/complete` menerima `{lessonId}` (disarankan) agar progres tetap tepat walau modul diurutkan ulang.
