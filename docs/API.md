# API SPUN Learning Hub

Base URL lokal: `http://127.0.0.1:4173`. Semua respons API berupa JSON dengan Cache-Control: no-store. Frontend mengirim cookie sesi menggunakan credentials: same-origin.

Mutasi membutuhkan Content-Type: application/json, X-Learning-Hub: 1, dan Origin yang sama dengan aplikasi. Browser mengirim Origin secara otomatis. Maksimum body JSON: 16 KiB. Error berbentuk `{"error":"pesan"}`.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | /api/auth/config | Mode autentikasi dan status pendaftaran |
| POST | /api/auth/register | Daftar, hanya instalasi Node |
| POST | /api/auth/login | Login, hanya instalasi Node |
| POST | /api/auth/logout | Cabut sesi, hanya instalasi Node |
| GET | /api/me | Profil dan state pembelajaran |
| GET | /api/catalog | Materi dan soal, tanpa kunci jawaban |
| POST | /api/courses/:id/enroll | Mengikuti course |
| POST | /api/courses/:id/lessons/:index/complete | Selesai modul; indeks mulai 0 |
| POST | /api/bookmarks | Simpan/hapus simpanan |
| POST | /api/articles/:id/read | Tandai dibaca |
| POST | /api/quizzes/:id/attempts | Kumpulkan jawaban |
| GET | /api/quizzes/:id/attempts | Maksimal 50 percobaan terakhir milik akun aktif |

## Body request

Register:

```json
{"name":"Nama Peserta","email":"peserta@example.com","password":"password-yang-dipilih-pengguna"}
```

Login memakai email dan password. Password register minimal 12, maksimal 128 karakter. Sesi otomatis dibuat setelah login/daftar berhasil. Logout, enroll, complete, dan read menggunakan `{}`.

Bookmark:

```json
{"kind":"article","id":"empathy","saved":true}
```

kind: article atau course. saved:false menghapus simpanan. ID harus ada dalam katalog.

Submit quiz:

```javascript
const attemptId = crypto.randomUUID();
const response = await fetch('/api/quizzes/cx-quiz/attempts', {
  method: 'POST', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json', 'X-Learning-Hub': '1' },
  body: JSON.stringify({ attemptId, answers: [0, 2, 1, 2, 1] })
});
const data = await response.json();
```

Jawaban adalah indeks opsi mulai 0. Pertahankan attemptId saat mengulang request akibat gangguan jaringan. ID dan jawaban sama tidak menambah percobaan; ID sama dengan jawaban/quiz berbeda menghasilkan 409. Percobaan baru memakai UUID baru. Nilai dari klien diabaikan; server menghitungnya sendiri.

Respons quiz: `{result,state}`. result berisi score, correct, total, passed, answers, review. Endpoint mutasi lainnya mengembalikan `{state}`. Skor terbaik berasal dari seluruh percobaan pengguna. Batas lulus latihan 80. Semua query data pembelajaran dibatasi ke identitas pengguna aktif; user ID dari body tidak digunakan.

| Status | Arti |
| --- | --- |
| 400 | JSON/request salah |
| 401 | Belum login, sesi berakhir, atau kredensial salah |
| 403 | Origin/header mutasi tidak sesuai atau pendaftaran ditutup |
| 404 | Endpoint atau materi tidak tersedia |
| 409 | Email sudah terdaftar atau konflik ID percobaan |
| 413 | Body terlalu besar |
| 415 | Content-Type salah |
| 422 | Input tidak valid |
| 429 | Terlalu banyak percobaan login/daftar |
| 500/503 | Kendala server/database |
