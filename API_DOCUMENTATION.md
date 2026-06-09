# Dokumentasi API EduSmart

_Base URL: `/api/v1`_

## Autentikasi

### 1. Registrasi Pengguna
- **Method:** `POST`
- **Endpoint:** `/auth/register`
- **Body:**
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@gmail.com",
    "password": "password123",
    "role": "student" // "student" atau "teacher"
  }
  ```
- **Response (200):** Pesan registrasi berhasil.

### 2. Login Pengguna
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Body:**
  ```json
  {
    "email": "budi@gmail.com",
    "password": "password123"
  }
  ```
- **Response (200):** Token JWT yang harus disertakan di header `Authorization: Bearer <token>` pada seluruh rute terlindungi (_Protected Routes_).

---

## Modul Profil & Pengguna (_Protected_)

### 1. Lihat Profil
- **Method:** `GET`
- **Endpoint:** `/profile`
- **Response (200):** Detail ID, nama, email, role, dan URL foto _avatar_.

### 2. Unggah Foto Profil (Avatar)
- **Method:** `POST`
- **Endpoint:** `/profile/avatar`
- **Format Content-Type:** `multipart/form-data`
- **Key Body:** `avatar` (File gambar maks 2MB).
- **Response (200):** URL Azure Blob Storage untuk _avatar_.

---

## Modul Guru / Teacher (_Teacher Protected_)

### Kuis
- **Buat Kuis Baru:** `POST /teacher/quizzes` (Body: title, description, subject).
- **Lihat Semua Kuis Guru:** `GET /teacher/quizzes`
- **Lihat Detail Kuis:** `GET /teacher/quizzes/:id`
- **Lihat Hasil Nilai Kuis (Siswa):** `GET /teacher/quizzes/:id/results`
- **Hapus Kuis:** `DELETE /teacher/quizzes/:id`
- **Publikasi Kuis:** `POST /teacher/quizzes/:id/publish`
- **Cabut Publikasi Kuis:** `POST /teacher/quizzes/:id/unpublish`

### Manajemen Soal & AI
- **Tambah Soal Manual:** `POST /teacher/quizzes/:id/questions` (Body: text, options A-D, correct_option).
- **Buat Soal via AI (Gemini):** `POST /teacher/quizzes/:id/ai-generate` (Body: topic, count).

### Manajemen Materi PDF
- **Upload Materi:** `POST /teacher/materials` (Multipart Form: `title`, `subject`, `file` maks 20MB).
- **Daftar Materi:** `GET /teacher/materials`
- **Hapus Materi:** `DELETE /teacher/materials/:id`

---

## Modul Siswa / Student (_Student Protected_)

### Pengerjaan Kuis
- **Daftar Kuis yang Dipublikasi:** `GET /student/quizzes`
- **Mulai Sesi Kuis:** `POST /student/quizzes/:id/start` (Membuat _Quiz Session_ baru dan mencatat waktu mulai).
- **Ambil Pertanyaan Kuis:** `GET /student/sessions/:sessionId/questions` (Menyembunyikan kunci jawaban _correct_option_ dari frontend).
- **Kirim/Submit Jawaban:** `POST /student/sessions/:sessionId/submit` (Body list of `question_id` dan `selected_option`).
- **Lihat Evaluasi & Feedback AI:** `GET /student/sessions/:sessionId/result` (Mengembalikan skor total, grade, dan teks analisa dari AI Google Gemini atas kesalahan yang dilakukan siswa).
- **Riwayat Kuis Siswa:** `GET /student/history`

### Pembelajaran Materi
- **Daftar Materi (Semua Guru):** `GET /student/materials` (Bisa difilter via *query* `?subject=Math`).
- **Akses Detail Materi:** `GET /materials/:id` (Global)

---

## Standar *Error Response*
Aplikasi menggunakan pola format JSON standar untuk merespons kegagalan:
```json
{
  "error": "Pesan deskripsi kesalahan"
}
```
Atau `message` sesuai konteks *controller*.
