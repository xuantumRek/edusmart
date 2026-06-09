# edusmart
AI-Powered Adaptive Learning Platform

# EduSmart

AI-Powered Adaptive Learning Platform

> Tugas Evaluasi Akhir Semester IFB-452 Komputasi Awan 2025/2026

---

## Arsitektur

- **AWS** — EKS, ALB, ECR, VPC (Compute)
- **Azure** — PostgreSQL, Blob Storage (Database & Storage)
- **Cloudflare** — CDN
- **Gemini API** — AI Generate Soal

---


## Setup Local Development

### 1. Clone repo

```bash
git clone https://github.com/xuantumRek/edusmart.git
cd edusmart
```

### 2. Buat file `.env` di root

```env
# Database lokal
POSTGRES_USER=edusmart
POSTGRES_PASSWORD=edusmart123
POSTGRES_DB=edusmart

# Akan diisi Ikhsan setelah Azure siap
DATABASE_URL=postgresql://edusmart:edusmart123@db:5432/edusmart

# Akan diisi Ikhsan setelah Azure Blob siap
AZURE_STORAGE_CONNECTION_STRING=

# Akan diisi Ikhsan setelah dapat Gemini API key
GEMINI_API_KEY=

# Bebas, untuk JWT signing
JWT_SECRET=changeme_local
```

### 3. Jalankan semua service

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

---

## GitHub Secrets (diisi oleh Hafiz)

| Secret | Keterangan |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user untuk CI/CD |
| `AWS_SECRET_ACCESS_KEY` | IAM user untuk CI/CD |
| `AWS_REGION` | Region AWS yang dipakai |
| `EKS_CLUSTER_NAME` | Nama EKS cluster |

---

## Pembagian Tugas

| Anggota | Tanggung Jawab |
|---|---|
| Hafiz | AWS infra — EKS, ALB, ECR, VPC, CI/CD |
| Ikhsan | Azure — PostgreSQL, Blob Storage, Gemini API |
| Agum | Frontend, Backend, Cloudflare CDN |

---

## Branch Strategy

| Branch | Fungsi |
|---|---|
| `main` | Production — trigger CI/CD otomatis |
| `dev` | Integrasi bersama sebelum merge ke main |
| `feat/frontend` | Development frontend |
| `feat/backend` | Development backend |
| `feat/azure` | Setup Azure |

---

## Environment Variables Reference

| Variable | Siapa yang isi | Kapan |
|---|---|---|
| `DATABASE_URL` | Ikhsan | Setelah Azure PostgreSQL siap |
| `AZURE_STORAGE_CONNECTION_STRING` | Ikhsan | Setelah Azure Blob siap |
| `GEMINI_API_KEY` | Ikhsan | Setelah dapat API key |
| `JWT_SECRET` | Hafiz | Sebelum deploy |