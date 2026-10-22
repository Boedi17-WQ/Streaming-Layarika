# LayarRika 🎬

> **“Temukan Ceritamu. Nikmati Setiap Episode.”**  
> Platform katalog dan streaming film & serial dengan antarmuka sinematik, modern, responsif, dan performa tinggi.

---

## 📌 Deskripsi Proyek

LayarRika adalah aplikasi full-stack modern yang dikembangkan untuk menyajikan pengalaman eksplorasi katalog sinematik dan pemutaran video legal yang mulus. Menggunakan arsitektur **Next.js 16 App Router** terkini dengan tema warna gelap elegan (*cinematic dark theme*) beraksen emas (*golden primary*).

### Pencapaian Tahap:
- **Tahap 0 (Selesai)**: Audit mendalam repositori referensi Streambert, identifikasi batasan lisensi GPL-3.0 dan inkompatibilitas Electron desktop, serta perancangan cetak biru arsitektur web mandiri.
- **Tahap 1 (Selesai)**: Setup proyek Next.js 16, TypeScript strict mode, Tailwind CSS v4, desain sistem palet hitam & emas, komponen modular reusable, dan fallback visual rasio 2:3.
- **Tahap 2 (Selesai)**: Integrasi penuh TMDB API resmi v3 di sisi server (*server-only client*), 6 kategori katalog beranda, halaman detail film (`/movie/[id]`), halaman detail serial TV (`/tv/[id]`), fitur pencarian multi-katalog (`/search`), optimasi gambar remote TMDB, dan atribusi wajib The Movie Database.
- **Tahap 3 (Selesai)**: Desain arsitektur database Neon PostgreSQL & Prisma ORM v6, skema relasional lengkap (User, Auth.js Account & Session, Watchlist, WatchHistory, PlaybackAsset, SubscriptionPlan), validasi progres tontonan berbasis Zod, singleton PrismaClient aman, dan script migrasi SQL awal.
- **Tahap 4 (Selesai)**: Autentikasi Pengguna menggunakan Auth.js (NextAuth v5), GitHub OAuth 2.0 provider, Prisma Adapter dengan penyimpanan akun/pengguna terverifikasi, halaman `/login` sinematik beraksen emas, proteksi server-side sesi pada `/profile`, dan integrasi dinamis `SiteHeader` (Masuk / Profil / Keluar).
- **Tahap 5 (Selesai)**: Manajemen Playlist & Watchlist personal, pencatatan riwayat tontonan real-time (`watch_history`), integrasi Neon DB.
- **Tahap 6 (Selesai)**: Multi-provider video player (HLS, MP4 legal, VidLink, 2Embed), navigasi episode & season interaktif.
- **Tahap 7 (Selesai)**: Sistem hak akses berjenjang (Free vs VIP), integrasi Midtrans Sandbox Virtual Account (BCA, BNI, BRI), validasi kuota harian Asia/Jakarta, dan modal simulasi transaksi.
- **Tahap 8 (Selesai)**: Portal Admin Sinematik (`/admin`), manajemen aset video legal CRUD (HLS / MP4), player preview test interaktif, manajemen pengguna & promosi wewenang (USER/ADMIN), serta aktivasi manual VIP.
- **Tahap 9 (Selesai)**: Testing menyeluruh 19 skenario akses kuota tontonan, validasi Zod, pencegahan race-condition, dan proteksi role guard.
- **Tahap 10 (Selesai)**: Kesiapan Deployment Publik ke Vercel & Neon Production Database, endpoint monitoring kesehatan server & database (`/api/health`), konfigurasi webhook Midtrans resmi, audit environment variables produksi, pengerasan CSP, dan panduan lengkap ([DEPLOYMENT.md](file:///d:/kuliah/semester5/rpl/ProjectLayarRika/DEPLOYMENT.md)).

---

## 🛠️ Stack Teknologi

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, Server Components by default, Turbopack)
- **Autentikasi**: [Auth.js (NextAuth.js v5)](https://authjs.dev/) & [@auth/prisma-adapter](https://authjs.dev/getting-started/adapters/prisma)
- **Library UI**: [React](https://react.dev/) 19 & [Tailwind CSS](https://tailwindcss.com/) v4
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) dengan Strict Mode aktif (tanpa `any`)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **ORM**: [Prisma ORM](https://www.prisma.io/) v6.19.3
- **Validasi Data**: [Zod](https://zod.dev/) v3
- **Ikon**: [@phosphor-icons/react](https://phosphoricons.com/)
- **Katalog Metadata**: [The Movie Database (TMDB)](https://www.themoviedb.org/) Official REST API v3
- **Keamanan Server**: `server-only` module guard (menjaga kredensial tidak pernah bocor ke client bundle)
- **Target Deployment**: Vercel

---

## 🗄️ Desain Skema Database (Prisma ORM)

Arsitektur database dirancang dengan integritas data tinggi dan indeks teroptimasi:

```mermaid
erDiagram
    User ||--o{ Account : "memiliki"
    User ||--o{ Session : "memiliki"
    User ||--o{ Watchlist : "menyimpan"
    User ||--o{ WatchHistory : "mencatat"
    User ||--o{ UserSubscription : "berlangganan"
    PlaybackAsset ||--o{ WatchHistory : "diputar pada"
    SubscriptionPlan ||--o{ UserSubscription : "paket"

    User {
        string id PK
        string email UK
        string name
        enum role "USER | ADMIN"
        datetime createdAt
    }

    Watchlist {
        string id PK
        string userId FK
        int tmdbId
        enum mediaType "MOVIE | TV"
        string title
        datetime createdAt
    }

    WatchHistory {
        string id PK
        string userId FK
        int tmdbId
        enum mediaType "MOVIE | TV"
        int progressSeconds ">= 0"
        int durationSeconds
        boolean completed
        datetime lastWatchedAt
    }

    PlaybackAsset {
        string id PK
        string title
        string videoUrl "URL Legal"
        enum mediaType "MOVIE | TV"
        string quality "1080p | 4K"
        boolean isPublic
        boolean isPremiumRequired
    }
```

### Model Utama:
1. **User, Account, Session, VerificationToken**: Kompatibel 100% dengan standar adapter Auth.js / NextAuth v5 untuk GitHub OAuth pada Tahap 4.
2. **Watchlist**: Menyimpan koleksi film & serial pengguna dengan unique constraint `[userId, mediaType, tmdbId]` untuk mencegah duplikasi.
3. **WatchHistory**: Mencatat progres detik tontonan pengguna (`progressSeconds`), durasi (`durationSeconds`), dan penanda status selesai (`completed`).
4. **PlaybackAsset**: Pengelolaan katalog aset pemutaran video mandiri yang sah dan legal (seperti open-movie Blender Foundation berlisensi Creative Commons) yang aman tanpa mengekspos token privat.
5. **SubscriptionPlan & UserSubscription**: Skema fondasi hak akses berjenjang Free dan Premium.

---

## 🔑 Konfigurasi Environment Variables

Salin `.env.example` menjadi `.env.local` dan isi nilai yang sesuai:

```env
# ------------------------------------------------------------------------------
# 1. TMDB API (The Movie Database) — Metadata Katalog
# ------------------------------------------------------------------------------
TMDB_API_READ_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiJ9..."

# ------------------------------------------------------------------------------
# 2. Neon PostgreSQL Connection Strings (Server-side Only)
# Dapatkan dari Dashboard Neon (https://console.neon.tech)
# ------------------------------------------------------------------------------
# Pooled URL: Digunakan untuk query aplikasi serverless Next.js
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/layarrika?sslmode=require"

# Direct URL: Digunakan oleh Prisma CLI untuk migrasi skema
DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/layarrika?sslmode=require"

# ------------------------------------------------------------------------------
# 3. Auth.js (NextAuth.js v5) & GitHub OAuth 2.0 — Tahap 4
# ------------------------------------------------------------------------------
# Buat secret acak aman: openssl rand -base64 32
AUTH_SECRET="your_generated_random_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Dapatkan dari GitHub Developer Settings -> OAuth Apps
AUTH_GITHUB_ID="your_github_oauth_client_id"
AUTH_GITHUB_SECRET="your_github_oauth_client_secret"
```

---

## 🔐 Panduan Setup GitHub OAuth App (Lokal)

Untuk mengaktifkan alur login GitHub di lingkungan lokal:

1. Buka akun GitHub Anda, lalu menuju **[Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)**.
2. Klik tombol **New OAuth App**.
3. Isi formulir pendaftaran aplikasi:
   - **Application name**: `LayarRika (Local Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: `Platform Streaming & Katalog Sinematik LayarRika`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Klik **Register application**.
5. Salin **Client ID** dan tempelkan ke variabel `AUTH_GITHUB_ID` pada berkas `.env.local`.
6. Klik **Generate a new client secret**, salin nilainya, dan tempelkan ke variabel `AUTH_GITHUB_SECRET` pada berkas `.env.local`.
7. Pastikan variabel `AUTH_SECRET` sudah terisi dengan string acak kriptografis (misal: `openssl rand -base64 32`).

---

## 🗃️ Alur Migrasi Database (Migration Workflow)

### Menjalankan Migrasi ke Database Neon:

Setelah menghubungkan connection string Neon asli Anda ke `.env.local`:

```bash
# 1. Validasi integritas berkas schema Prisma
npx prisma validate

# 2. Menghasilkan Prisma Client terbaru
npx prisma generate

# 3. Menerapkan migrasi terstruktur ke database Neon (Aman untuk dev & production)
npx prisma migrate deploy

# 4. Menjalankan seed data paket langganan & aset video legal
npm run db:seed
```

---

## 🚀 Panduan Memulai Cepat

```bash
# 1. Instalasi dependensi
npm install

# 2. Jalankan server pengembangan lokal
npm run dev
```

Akses aplikasi di peramban: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Validasi Kualitas Kode & Build

```bash
# 1. Menjalankan ESLint
npm run lint

# 2. Pemeriksaan Typecheck TypeScript Strict Mode
npx tsc --noEmit

# 3. Unit Test Validasi Progres Tontonan
npx tsx src/lib/validations/progress.test.ts

# 4. Pengujian Health Check & Uptime Cloud (Tahap 10)
npm run test:health

# 5. Pengujian Production Build
npm run build
```

---

## 🗺️ Roadmap Pengembangan LayarRika

- [x] **Tahap 0**: Discovery, Audit Repositori Streambert, & Rancangan Arsitektur.
- [x] **Tahap 1**: Project Setup, Fondasi UI Sinematik, Design Tokens, & Mock Data.
- [x] **Tahap 2**: Integrasi TMDB API di sisi Server (Trending, Popular, Detail, Search).
- [x] **Tahap 3**: Desain Database Neon PostgreSQL & Konfigurasi Prisma ORM.
- [x] **Tahap 4**: Autentikasi Pengguna dengan Auth.js v5 & GitHub OAuth.
- [x] **Tahap 5**: Manajemen Playlist & Riwayat Tontonan Pengguna.
- [x] **Tahap 6**: Implementasi Pemutar Video Web HTML5 / HLS & Season Navigation.
- [x] **Tahap 7**: Sistem Hak Akses Free & Premium VIP (Integrasi Midtrans Sandbox & Kuota Tontonan).
- [x] **Tahap 8**: Panel Admin Pengelolaan Aset Video & Episode (`/admin`).
- [x] **Tahap 9**: Testing Menyeluruh (Unit, Integration, E2E) & Security Hardening.
- [x] **Tahap 10**: Deployment Publik ke Vercel & Neon Production Database ([Panduan Deployment](file:///d:/kuliah/semester5/rpl/ProjectLayarRika/DEPLOYMENT.md)).

---
*Proyek Rekayasa Perangkat Lunak (RPL) — LayarRika 2026*
