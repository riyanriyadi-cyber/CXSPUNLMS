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
