# 🚀 Panduan Deployment Publik: LayarRika ke Vercel & Neon Production

> **Dokumen Rekayasa Perangkat Lunak (RPL) — Tahap 10**  
> Panduan komprehensif langkah demi langkah untuk menyebarkan (*deploy*) platform streaming sinematik **LayarRika** ke infrastruktur cloud publik modern menggunakan **Vercel Serverless**, **Neon Serverless PostgreSQL**, **Midtrans Payment Gateway**, dan **GitHub OAuth 2.0**.

---

## 🏛️ 1. Arsitektur & Topologi Deployment Cloud

Platform LayarRika dirancang dengan arsitektur *cloud-native serverless* berkinerja tinggi:

```mermaid
flowchart TD
    subgraph Client["Perangkat Pengguna (Browser / Mobile)"]
        User["Pengguna / Pelanggan LayarRika"]
    end

    subgraph Vercel["Vercel Edge & Serverless Platform"]
        NextApp["Next.js 16 App Router (LayarRika)"]
        HealthEndpoint["/api/health (Health Check)"]
        WebhookEndpoint["/api/midtrans/notification (Webhook)"]
        AdminPortal["/admin (Portal Admin Sinematik)"]
        AuthHandler["/api/auth (Auth.js v5)"]
    end

    subgraph NeonDB["Neon Cloud (Serverless PostgreSQL)"]
        NeonPooler["Connection Pooler (PgBouncer)"]
        NeonDirect["Direct PostgreSQL Engine"]
        NeonStorage["Tabel: User, Subscription, Watchlist, PlaybackAsset"]
    end

    subgraph ExternalServices["Layanan Pihak Ketiga Resmi"]
        TMDB["TMDB REST API v3 (Katalog Sinematik)"]
        Midtrans["Midtrans Payment Gateway (Snap & Core API)"]
        GitHub["GitHub OAuth 2.0 (Autentikasi Pengguna)"]
    end

    User -->|HTTPS| NextApp
    NextApp -->|Query Serverless| NeonPooler
    NeonPooler --> NeonStorage
    NextApp -->|Prisma CLI Migration| NeonDirect
    NeonDirect --> NeonStorage
    NextApp -->|Metadata Film/Serial| TMDB
    NextApp -->|Buat Transaksi Snap / VA| Midtrans
    Midtrans -->|Webhook Callback POST| WebhookEndpoint
    NextApp -->|OAuth Flow| GitHub
    HealthEndpoint -->|Ping Latency SELECT 1| NeonPooler
```

---

## 🗄️ 2. Langkah 1: Persiapan Database Neon Production

LayarRika menggunakan **Neon Serverless PostgreSQL** yang menawarkan *instant auto-scaling* dan *connection pooling* bawaan.

### A. Membuat Proyek Database di Neon
1. Buka [Neon Console](https://console.neon.tech/) dan masuk ke akun Anda.
2. Klik tombol **New Project**:
   - **Project Name**: `layarrika-production`
   - **Postgres Version**: `16` (Direkomendasikan)
   - **Region**: Pilih region terdekat dengan target pengguna (misal: `AWS ap-southeast-1 Singapore` untuk akses tercepat dari Indonesia).
3. Klik **Create Project**.

### B. Memperoleh Connection Strings
Neon menyediakan dua jenis string koneksi:
1. **Pooled Connection String (`DATABASE_URL`)**:
   - Menggunakan PgBouncer (nama host berakhiran `-pooler`).
   - Wajib digunakan oleh aplikasi serverless Vercel agar koneksi database tidak habis saat *traffic spike*.
   - Contoh: `postgresql://layarrika_owner:PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
2. **Direct Connection String (`DIRECT_URL`)**:
   - Menghubungkan langsung ke engine Postgres (tanpa `-pooler`).
   - Wajib digunakan oleh Prisma CLI untuk eksekusi migrasi DDL (`npx prisma migrate deploy`).
   - Contoh: `postgresql://layarrika_owner:PASSWORD@ep-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

### C. Menjalankan Migrasi Skema ke Database Produksi
Sebelum aplikasi dijalankan di Vercel, terapkan seluruh migrasi tabel dan lakukan seed paket langganan:

```bash
# Set connection string database produksi secara lokal di terminal:
export DATABASE_URL="postgresql://user:pass@ep-pooler...neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://user:pass@ep...neon.tech/neondb?sslmode=require"

# 1. Validasi skema Prisma
npx prisma validate

# 2. Deploy migrasi tabel ke Neon Production
npx prisma migrate deploy

# 3. Jalankan seed data paket langganan VIP & aset video legal awal
npm run db:seed
```

---

## 🐙 3. Langkah 2: Setup GitHub OAuth App untuk Produksi

Agar fitur login dengan GitHub bekerja di domain publik Vercel:

1. Buka [GitHub Developer Settings -> OAuth Apps](https://github.com/settings/developers).
2. Klik **New OAuth App**:
   - **Application name**: `LayarRika Production`
   - **Homepage URL**: `https://layarrika.vercel.app` *(Ganti dengan domain Vercel Anda)*
   - **Application description**: `Platform Streaming Sinematik LayarRika`
   - **Authorization callback URL**: `https://layarrika.vercel.app/api/auth/callback/github`
3. Klik **Register application**.
4. Salin **Client ID** (ini adalah `AUTH_GITHUB_ID`).
5. Klik **Generate a new client secret**, salin nilainya (ini adalah `AUTH_GITHUB_SECRET`).

---

## 💳 4. Langkah 3: Konfigurasi Midtrans Payment Gateway & Webhook

### A. Mendapatkan Kunci Akses (Access Keys)
1. Masuk ke [Midtrans Dashboard](https://dashboard.midtrans.com/) (atau [Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)).
2. Navigasi ke menu **Settings** > **Access Keys**.
3. Salin:
   - **Server Key** (contoh: `Mid-server-xxxxxxxx` atau `SB-Mid-server-xxxxxxxx`)
   - **Client Key** (contoh: `Mid-client-xxxxxxxx` atau `SB-Mid-client-xxxxxxxx`)

### B. Konfigurasi Webhook Notification URL Resmi
Webhook memastikan bahwa ketika pengguna menyelesaikan pembayaran (misal melalui Virtual Account BCA/BNI/BRI atau QRIS), akun pengguna langsung berstatus **VIP** secara otomatis dari server-ke-server:

1. Di Dashboard Midtrans, navigasi ke menu **Settings** > **Configuration**.
2. Pada bagian **Payment Notification URL**, masukkan URL publik berikut:
   ```text
   https://layarrika.vercel.app/api/midtrans/notification
   ```
   *(Ganti `layarrika.vercel.app` dengan domain Vercel aktual Anda)*.
3. Pada bagian **Finish Redirect URL**, masukkan:
   ```text
   https://layarrika.vercel.app/profile?payment=success
   ```
4. Pada bagian **Unfinish Redirect URL**, masukkan:
   ```text
   https://layarrika.vercel.app/pricing?payment=pending
   ```
5. Pada bagian **Error Redirect URL**, masukkan:
   ```text
   https://layarrika.vercel.app/pricing?payment=error
   ```
6. Klik **Save Changes**.

> 💡 **Verifikasi Endpoint Webhook**:  
> Endpoint Webhook LayarRika dilengkapi dengan pemeriksaan GET diagnosis. Kunjungi `https://domain-anda.vercel.app/api/midtrans/notification` di browser; Anda akan menerima status JSON aktif dan petunjuk konfigurasi.

---

## 🌐 5. Langkah 4: Menghubungkan Repositori GitHub ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New...** > **Project**.
2. Pilih repositori GitHub Anda: `Boedi17-WQ/Streaming-Layarika`.
3. Pada panel **Configure Project**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `npx prisma generate && next build` *(atau biarkan default `npm run build`)*
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

---

## 🔐 6. Langkah 5: Audit & Pemasangan Environment Variables di Vercel

Pada panel **Environment Variables** di Vercel Dashboard (atau di **Project Settings** > **Environment Variables**), pasang daftar variabel produksi berikut:

| Nama Variabel | Wajib? | Contoh Nilai Produksi | Penjelasan |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Ya** | `postgresql://user:pass@ep-pooler...neon.tech/neondb?sslmode=require` | Connection string Neon dengan PgBouncer pooling untuk serverless. |
| `DIRECT_URL` | **Ya** | `postgresql://user:pass@ep...neon.tech/neondb?sslmode=require` | Connection string Neon direct untuk migrasi skema Prisma. |
| `AUTH_SECRET` | **Ya** | `a1b2c3d4e5...` (32 karakter random) | Token rahasia enkripsi sesi Auth.js (Generate via `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | **Ya** | `https://layarrika.vercel.app` | URL domain produksi utama aplikasi. |
| `NEXT_PUBLIC_APP_URL` | **Ya** | `https://layarrika.vercel.app` | Digunakan untuk sitemap, metadata OpenGraph, dan robots.txt. |
| `AUTH_GITHUB_ID` | **Ya** | `Ov23li...` | Client ID GitHub OAuth App produksi. |
| `AUTH_GITHUB_SECRET` | **Ya** | `7d8e9f...` | Client Secret GitHub OAuth App produksi. |
| `TMDB_API_READ_ACCESS_TOKEN` | **Ya** | `eyJhbGciOi...` | Bearer Token v4 resmi The Movie Database (TMDB). |
| `MIDTRANS_SERVER_KEY` | **Ya** | `Mid-server-...` (atau `SB-Mid-server-...`) | Kunci rahasia server Midtrans untuk verifikasi transaksi & webhook. |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | **Ya** | `Mid-client-...` (atau `SB-Mid-client-...`) | Kunci publik Midtrans untuk membuka dialog pembayaran Snap. |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | **Ya** | `false` *(jika Sandbox)* atau `true` *(jika Live)* | Menentukan gateway Midtrans (Sandbox vs Production). |
| `ENABLE_SIMULATED_PAYMENTS` | **Ya** | `false` | **Wajib `false` di Vercel** agar transaksi memanggil gateway Midtrans riil. |
| `SIMULATED_BILLING_ENABLED` | **Ya** | `false` | **Wajib `false` di Vercel** untuk menonaktifkan bypass kuota lokal. |

> ⚠️ **Catatan Penting Security**:  
> Pilih environment scope **Production** dan **Preview** untuk variabel di atas. Jangan pernah membagikan nilai `AUTH_SECRET`, `DATABASE_URL`, dan `MIDTRANS_SERVER_KEY` ke publik.

---

## 🩺 7. Langkah 6: Monitoring Uptime & Endpoint Health Check

LayarRika menyediakan endpoint health check terstandarisasi cloud pada:

```http
GET /api/health
HEAD /api/health
```

### Karakteristik Endpoint `/api/health`:
- **Query Ping Database**: Menjalankan query ringan `SELECT 1 as ping` ke Neon DB dan mengukur latency round-trip dalam milidetik (`latencyMs`).
- **Audit Variabel Lingkungan**: Memvalidasi ketersediaan `DATABASE_URL`, `AUTH_SECRET`, `TMDB`, dan `MIDTRANS` secara dinamis tanpa mengekspos nilai rahasianya (*Secret Redaction*).
- **HTTP Status Codes**:
  - `200 OK`: Sistem sehat (`status: "ok"`) atau degradasi non-kritis (`status: "degraded"`).
  - `503 Service Unavailable`: Database tidak terjangkau atau kredensial kritis hilang (`status: "unhealthy"`).
- **Header Anti-Cache**: Memiliki header `Cache-Control: no-store, no-cache, must-revalidate` sehingga selalu menghasilkan status *real-time*.

### Contoh Respons JSON Sehat:
```json
{
  "status": "ok",
  "timestamp": "2026-10-22T15:45:00.000Z",
  "uptimeSeconds": 1284,
  "version": "0.1.0",
  "nodeVersion": "v20.18.0",
  "checks": {
    "database": {
      "status": "ok",
      "latencyMs": 38
    },
    "environment": {
      "status": "ok",
      "databaseConfigured": true,
      "directUrlConfigured": true,
      "authConfigured": true,
      "githubOAuthConfigured": true,
      "tmdbConfigured": true,
      "midtransConfigured": true,
      "midtransMode": "sandbox",
      "simulatedPaymentsEnabled": false,
      "nodeEnv": "production",
      "appUrlConfigured": true
    }
  }
}
```

### Integrasi dengan Layanan Pemantauan Uptime:
Anda dapat menghubungkan endpoint `/api/health` ke layanan monitoring eksternal gratis seperti:
- **BetterStack (Better Uptime)**: Tambahkan monitor HTTP/HEAD dengan interval 3 menit ke `https://layarrika.vercel.app/api/health`.
- **UptimeRobot**: Tambahkan HTTP Monitor dengan expected response `200`.

---

## 👑 8. Langkah 7: Menetapkan Akun Administrator Pertama di Cloud

Setelah deployment selesai dan Anda berhasil login pertama kali menggunakan akun GitHub Anda:

1. Buka terminal lokal dengan koneksi ke database produksi:
   ```bash
   npx tsx scripts/set-admin.ts email-github-anda@example.com
   ```
2. Atau jalankan query SQL langsung di **Neon SQL Editor**:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'email-github-anda@example.com';
   ```
3. Segarkan browser pada halaman `https://layarrika.vercel.app/admin` untuk mengakses **Portal Admin Sinematik**.

---

## ✅ 9. Checklist Pasca-Deployment (Go-Live Checklist)

Gunakan daftar periksa berikut sebelum meresmikan peluncuran publik:

- [ ] **Database Connection**: Uji `/api/health` dan pastikan `database.status == "ok"` dengan latency < 150ms.
- [ ] **Autentikasi GitHub**: Klik tombol "Masuk", lakukan otorisasi di GitHub, dan pastikan dialihkan kembali ke profil pengguna dengan benar.
- [ ] **Katalog Sinematik**: Periksa beranda (`/`) dan detail film (`/movie/550`); pastikan poster TMDB termuat sempurna.
- [ ] **Midtrans Snap / Virtual Account**:
  - Buka halaman `/pricing`.
  - Pilih paket VIP Bulanan atau Tahunan.
  - Selesaikan simulasi pembayaran menggunakan [Midtrans Payment Simulator](https://simulator.sandbox.midtrans.com/).
  - Pastikan status langganan di halaman `/profile` berubah menjadi **VIP Aktif** secara otomatis.
- [ ] **Hak Akses & Kuota**: Pastikan pengguna VIP dapat menonton episode 6+ tanpa batas dan tanpa batasan 60 menit kuota harian.
- [ ] **Panel Admin**: Akses `/admin` dan verifikasi pemutaran player preview aset legal (HLS / MP4).
- [ ] **Keamanan & CSP**: Pastikan tidak ada pesan eror CSP (Content Security Policy) di konsol pengembang peramban (DevTools Console).

---

*Dokumentasi resmi Rekayasa Perangkat Lunak (RPL) — Proyek LayarRika 2026*
