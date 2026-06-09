# Dokumentasi Kecerdasan Buatan (AI) EduSmart

Sistem EduSmart mengintegrasikan layanan Google Gemini API (`gemini-2.5-flash`) untuk meringankan beban kerja tenaga pengajar (guru) dan memberikan umpan balik (feedback) yang personal bagi para siswa.

Model yang digunakan: `gemini-2.5-flash`

## Fitur Utama AI

### 1. Pembangkit Soal Otomatis (Auto Quiz Generator)
Bagi guru yang memiliki keterbatasan waktu, AI EduSmart dapat men-*generate* puluhan soal pilihan ganda secara otomatis dalam hitungan detik. 
- **Modul Utilitas:** `backend/utils/gemini.go` (`GenerateQuizQuestions`)
- **Mekanisme Kerja:** Backend akan mengirim *prompt* spesifik menggunakan teknik _Zero-shot prompting_ yang diinstruksikan untuk selalu merespons dalam format `application/json` murni tanpa blok _markdown_.
- **Format Output JSON Paksa:**
  Sistem akan meminta struktur keluaran tetap (deterministic output) dari Gemini:
  ```json
  {
    "questions": [
      {
        "text": "Pertanyaan",
        "option_a": "Opsi A",
        "option_b": "Opsi B",
        "option_c": "Opsi C",
        "option_d": "Opsi D",
        "correct_option": "B"
      }
    ]
  }
  ```
- **Error Handling (Retries):** Menggunakan mekanisme `generateWithRetry` dengan _exponential backoff_ untuk menahan error `HTTP 429 Too Many Requests` (umum pada API *Free Tier* Gemini).

### 2. Analisis & Umpan Balik Siswa (Personalized Feedback)
Sistem ini tidak hanya memberikan label "Benar" atau "Salah". Saat seorang siswa selesai mengerjakan kuis dan menekan tombol _Submit_, *backend* akan menyusun daftar soal-soal yang mereka jawab salah beserta pilihan jawaban mereka, lalu melemparkannya kembali ke Gemini.

- **Modul Utilitas:** `backend/utils/gemini.go` (`GenerateFeedback`)
- **Mekanisme Prompting:** Sistem memberikan konteks: _"Anda adalah seorang tutor ahli dan ramah. Berikut adalah soal yang dijawab salah oleh siswa beserta topik utama kuisnya. Tolong berikan ringkasan materi/pembahasan 1-2 paragraf mengenai konsep yang belum mereka pahami"_.
- **Luaran:** Hasil umpan balik akan disimpan di _database_ tabel `quiz_sessions` pada kolom `ai_feedback` dan akan langsung dirender oleh React _frontend_ sesaat setelah siswa membuka halaman _Result_.

## Strategi Ketahanan Sistem (Resilience)

Dalam memanggil API eksternal pihak ketiga (seperti Google Gemini), seringkali dijumpai kegagalan jaringan atau pembatasan _rate limit_. 
Untuk mengatasi hal ini, modul AI telah dilengkapi fungsi *wrapper* kustom:
```go
func generateWithRetry(ctx context.Context, prompt string) (string, error)
```
**Perilaku _Retry_:**
1. Apabila API mengembalikan error *rate limit* (429) atau *server error* (5xx), fungsi ini menunda (sleep) eksekusi.
2. Waktu tunda ditingkatkan secara eksponensial: `2s`, `4s`, `8s` sebelum percobaan berikutnya.
3. Batas percobaan maksimal: `3 kali retries`.
4. Jika gagal, *backend* akan melanjutkan logika tanpa merusak *database* (misalnya: gagal *generate feedback*, maka skor tetap disimpan tapi teks umpan balik dikembalikan kosong/peringatan generik).
