# EduSmart - AI-Powered Quiz Platform

EduSmart adalah platform manajemen kuis cerdas yang didesain untuk merevolusi proses belajar mengajar. Dengan integrasi kecerdasan buatan dari Google Gemini, EduSmart memungkinkan tenaga pengajar untuk membuat puluhan soal hanya dengan sekali klik, serta memberikan _feedback_ otomatis kepada siswa untuk setiap jawaban yang salah.

---

## 📖 Ringkasan Aplikasi (Overview)

Aplikasi ini memiliki 2 peran (_roles_) utama:

1. **Guru (Teacher):** Dapat mengelola materi pelajaran (PDF), mempublikasikan kuis (manual atau AI), dan melihat rekapitulasi nilai siswa secara _real-time_.
2. **Siswa (Student):** Dapat mengunduh materi yang dibagikan guru, mengerjakan kuis dengan sistem pengatur waktu otomatis, dan melihat performa skor serta rangkuman ulasan AI berdasarkan soal yang salah.

---

## 📁 Struktur Direktori

Berikut adalah kerangka arsitektur dari repositori proyek ini:

```text
UAS/
├── backend/            # Aplikasi Backend (Golang + Gin + GORM)
├── frontend/           # Aplikasi Frontend (React.js + Vite + TailwindCSS)
├── k8s/                # Manifest konfigurasi Kubernetes (Deployment, HPA, Service, dll)
├── .env                # Berkas rahasia konfigurasi Environment
├── .env.example        # Referensi kunci struktur konfigurasi .env
├── .gitignore          # Konfigurasi filter GIT
├── docker-compose.yml  # Pengaturan Docker Lokal
└── README.md           # Anda berada di sini
```

---

## 📦 Detail Dependensi & Teknologi

Sistem ini dibangun menggunakan perpaduan teknologi tangguh (Full-stack MERN-like, namun diganti Go):

### Backend:

- **Go / Golang:** Bahasa pemrograman utama (Kinerja sangat tinggi & minim memori).
- **Gin Framework:** Kerangka kerja (_framework_) _routing_ HTTP.
- **GORM:** _Object Relational Mapping_ (ORM) untuk berinteraksi dengan basis data secara efisien.
- **Google GenAI SDK:** _Library_ integrasi resmi untuk memanggil API Gemini.
- **Azure SDK for Go:** Untuk terhubung dengan _Azure Blob Storage_.
- **PostgreSQL Driver:** Untuk menyambungkan Go dengan Azure Database for PostgreSQL.

### Frontend:

- **React 18:** _Library_ pembangunan _User Interface_ (UI).
- **Vite:** Penambal / pembangun (_bundler_) generasi baru yang luar biasa cepat.
- **Tailwind CSS:** _Framework_ utilitas _styling_ untuk menyusun UI secara gesit.
- **React Router Dom:** Sistem navigasi antar-halaman berbasis _Client-Side Routing_.
- **SweetAlert2:** _Library_ dialog peringatan (pop-up) modern interaktif.
- **Lucide React:** Paket ikon ringan dan estetis.

### Infrastruktur (_Cloud_ & Lokal):

- **Docker & Docker Compose:** Sistem kontainerisasi.
- **Azure Database for PostgreSQL (Flexible Server):** Database produksi utama.
- **Azure Blob Storage:** Penyimpanan kontainer _cloud_ (_avatars_ dan _materials_).

---

## 🚀 Cara Menjalankan Aplikasi di Docker Desktop (Lokal)

EduSmart menggunakan `docker-compose.yml` untuk mempermudah eksekusi lingkungan _development_ tanpa harus meng- _install_ Golang atau NodeJS di mesin fisik Anda.

### 1. Persiapan Kredensial (.env)

Buka folder `UAS/` dan gandakan berkas `.env.example` lalu ubah namanya menjadi `.env`.
Pastikan konfigurasi kunci-kunci rahasia telah diisi, khususnya:

- `DATABASE_URL` (Kredensial akses Azure PostgreSQL)
- `GEMINI_API_KEY` (Token Gemini API)
- Konfigurasi `AZURE_STORAGE_ACCOUNT` & `AZURE_STORAGE_KEY`

### 2. Nyalakan Docker Desktop

Pastikan aplikasi **Docker Desktop** di komputer Anda (Windows) sudah menyala dan berwarna hijau.

### 3. Eksekusi Docker Compose

Buka terminal/CMD di dalam folder _root_ proyek ini (`UAS/`), lalu ketik perintah berikut:

```bash
docker compose up -d --build
```

**Penjelasan Perintah:**

- `up`: Menjalankan aplikasi.
- `-d`: Mode _Detached_ (berjalan di _background_ sehingga Anda bisa tetap menggunakan terminal tersebut).
- `--build`: Memaksa Docker untuk merakit (_build_) ulang gambar (_images_) jika ada perubahan kode terbaru di folder frontend/backend.

### 4. Akses Aplikasi

Tunggu hingga proses _build_ selesai dan log di Docker Desktop menunjukkan _Container Started_.
Buka web browser Anda dan akses aplikasi melalui _link_ berikut:
👉 **Frontend App:** [http://localhost:5173](http://localhost:5173)

---
