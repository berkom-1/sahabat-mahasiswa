# Sahabat Mahasiswa - Platform Terintegrasi Mahasiswa Indonesia

Sahabat Mahasiswa adalah platform all-in-one berbasis web dan desktop yang dirancang khusus untuk memenuhi kebutuhan harian mahasiswa Indonesia. Aplikasi ini mencakup pencarian hunian kos berbasis radius kampus, pencatatan keuangan dompet mahasiswa, manajemen tugas dan deadline perkuliahan, direktori voucher makan hemat, hingga agregasi lowongan kerja paruh waktu dan magang.

Proyek ini dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **MySQL (Laragon)** dengan koneksi pooling `mysql2/promise` serta proteksi sandi berbasis `bcryptjs`.

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Arsitektur dan Teknologi](#arsitektur-dan-teknologi)
3. [Arsitektur Basis Data (MySQL)](#arsitektur-basis-data-mysql)
4. [Prasyarat Sistem](#prasyarat-sistem)
5. [Instalasi dan Konfigurasi](#instalasi-dan-konfigurasi)
6. [Migrasi dan Seed Basis Data](#migrasi-dan-seed-basis-data)
7. [Akun Uji Coba (Demo Credentials)](#akun-uji-coba-demo-credentials)
8. [Menjalankan Aplikasi](#menjalankan-aplikasi)
9. [Dokumentasi API](#dokumentasi-api)
10. [Struktur Direktori](#struktur-direktori)
11. [Integrasi Desktop Launcher](#integrasi-desktop-launcher)
12. [Lisensi](#lisensi)

---

## Fitur Utama

### 1. Pencarian Kos Kampus (Kosan)
- Katalog data kos terintegrasi langsung dengan database MySQL.
- Algoritma perhitungan jarak **Haversine formula** berdasarkan koordinat GPS kampus (default: Universitas Siliwangi / UNSIL Tasikmalaya).
- Filter pencarian berdasarkan tipe kos (Putra, Putri, Campur), batas harga sewa maksimal, fasilitas, serta pencarian kata kunci nama/area.
- Tautan langsung ke WhatsApp pengelola/pemilik kos.

### 2. Manajemen Dompet Mahasiswa (Keuangan)
- Pencatatan transaksi pemasukan (*income*) dan pengeluaran (*expense*).
- Kategorisasi otomatis (Uang Saku, Makanan, Transportasi, Kuliah, Belanja, Hiburan, dll.).
- Kalkulasi saldo sisa, total pemasukan, dan total pengeluaran secara real-time.
- Riwayat transaksi tersimpan persisten di MySQL per identitas pengguna.

### 3. Manajemen Tugas dan Deadline Kuliah
- Tambah, tinjau, ubah, dan hapus tugas kuliah (*CRUD*).
- Indikator bobot kepentingan tugas (Rendah, Sedang, Tinggi).
- Penghitungan sisa hari menuju tenggat waktu pengumpulan (deadline).
- Fitur centang selesai yang langsung memperbarui status dan waktu penyelesaian di database.

### 4. Voucher Makan dan Promo Mahasiswa
- Katalog voucher diskon makanan dan minuman dari merchant/outlet di sekitar lingkungan kampus.
- Modal detail outlet yang menampilkan alamat lengkap, jam operasional, menu andalan, dan tautan Google Maps.
- Generator serial voucher deterministik yang dapat diklaim mahasiswa untuk ditukarkan di merchant.

### 5. Lowongan Kerja & Magang (Kerja)
- Daftar lowongan kerja paruh waktu (*part-time*), magang (*internship*), dan pekerjaan lepas (*freelance*).
- Integrasi ganda: data lowongan lokal dari MySQL serta integrasi eksternal ke Adzuna Jobs API.
- Filter pencarian berbasis bidang pekerjaan, jenis kontrak, dan lokasi.

### 6. Profil dan Autentikasi Pengguna
- Registrasi dan login pengguna aman dengan password terenkripsi `bcryptjs`.
- Dukungan NextAuth.js untuk autentikasi sesi.
- Manajemen profil mahasiswa (nama, kampus, fakultas, jurusan, semester, no. telp, avatar).
- Verifikasi identitas email akademik kampus (`.ac.id`).
- Penghubung akun pihak ketiga (Google & TikTok Access Token).

---

## Arsitektur dan Teknologi

| Lapisan | Komponen / Pustaka |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router, Turbopack) |
| **Bahasa Pemrograman** | TypeScript (Strict Mode) |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide React Icons |
| **Basis Data** | MySQL 8.0+ / MariaDB (Laragon Environment) |
| **Database Driver** | `mysql2/promise` (Connection Pooling Singleton) |
| **Autentikasi & Keamanan** | NextAuth.js v4, `bcryptjs` (kompatibel format hash `$2a$` dan `$2y$`) |
| **API Architecture** | Next.js REST Route Handlers (`app/api/*`) |
| **Integrasi Eksternal** | Adzuna Job Search API, TikTok Developers API, Google OAuth |

---

## Arsitektur Basis Data (MySQL)

Seluruh data aplikasi telah dimigrasikan dari PostgreSQL/Supabase ke MySQL lokal pada port 3306.

### Tabel Utama:
1. `users`: Menyimpan identitas akun, kredensial password hash, data akademik mahasiswa, dan token integrasi.
2. `assignment_deadlines`: Menyimpan data tugas kuliah, tanggal deadline, tingkat kesulitan, bobot, dan status penyelesaian.
3. `wallet_transactions`: Menyimpan mutasi keuangan mahasiswa (pemasukan, pengeluaran, kategori, nominal, catatan).
4. `kos`: Menyimpan data induk kosan, koordinat lat/lng, nomor telepon pemilik, harga, tipe, dan fasilitas.
5. `vouchers`: Menyimpan master data voucher promo, potongan harga, minimal transaksi, dan masa berlaku.
6. `job_vacancies`: Menyimpan lowongan kerja mahasiswa, nama perusahaan, tipe pekerjaan, rentang gaji, dan persyaratan.
7. `outlets`: Menyimpan data merchant/outlet mitra sekitar kampus.

### Compatibility Views:
Untuk memfasilitasi kemudahan query dan interoperabilitas dengan komponen warisan, dibuat views berikut:
- `profiles` &rarr; `SELECT ... FROM users`
- `tugas` &rarr; `SELECT ... FROM assignment_deadlines`
- `transaksi` &rarr; `SELECT ... FROM wallet_transactions`
- `kosan` &rarr; `SELECT ... FROM kos`

---

## Prasyarat Sistem

Sebelum menjalankan proyek, pastikan sistem Anda telah terpasang:
- **Node.js**: Versi 20.x atau 22.x LTS (disarankan)
- **NPM**: Versi 10.x+
- **Laragon**: Versi 6.0+ (Apache/Nginx + MySQL 8.0 / MariaDB)

---

## Instalasi dan Konfigurasi

### 1. Klon Repositori
```bash
git clone https://github.com/berkom-1/SAHABAT-MAHASISWA.git
cd SAHABAT-MAHASISWA
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin berkas template environment:
```bash
cp .env.example .env
```

Pastikan variabel pada berkas `.env` sesuai dengan konfigurasi Laragon lokal Anda:
```ini
# Koneksi Basis Data MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sahabat_mahasiswa

# NextAuth Secret
NEXTAUTH_SECRET=sahabat-mahasiswa-secret-fallback-key-2026
NEXTAUTH_URL=http://localhost:3000

# Konfigurasi Eksternal (Opsional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
```

---

## Migrasi dan Seed Basis Data

Pastikan service MySQL di Laragon telah aktif (**Start All** pada Laragon).

Jalankan perintah migrasi otomatis:
```bash
node scripts/migrate.mjs
```

Skrip migrasi ini akan mengeksekusi:
1. Pembuatan database `sahabat_mahasiswa` jika belum tersedia.
2. Pembuatan seluruh tabel inti dengan tipe data yang optimal.
3. Penambahan kolom-kolom profil dan geolokasi (`lat`, `lng`, `rating`).
4. Penyusunan *compatibility views*.
5. Inisialisasi akun demo terverifikasi (`mahasiswa@unsil.ac.id`).

*Catatan: Anda juga dapat mengimpor file `database/schema.sql` secara langsung melalui phpMyAdmin atau HeidiSQL bawaan Laragon.*

---

## Akun Uji Coba (Demo Credentials)

Gunakan akun berikut untuk menguji seluruh fitur aplikasi tanpa harus mendaftar dari awal:

| Parameter | Keterangan Akun Demo |
|---|---|
| **Email** | `mahasiswa@unsil.ac.id` |
| **Password** | `password123` |
| **Nama** | Budi Santoso |
| **Kampus** | Universitas Siliwangi (UNSIL) |
| **Status Mahasiswa** | Terverifikasi |

Anda juga dapat membuat akun baru melalui formulir registrasi pada aplikasi.

---

## Menjalankan Aplikasi

### Mode Pengembangan (Development)
```bash
npm run dev
```
Aplikasi akan aktif pada [http://localhost:3000](http://localhost:3000).

### Build Produksi
Untuk memastikan tidak ada galat tipe data dan menguji kompilasi Turbopack:
```bash
npm run build
```

### Menjalankan Build Produksi
```bash
npm run start
```

### Pemeriksaan Linter (ESLint)
Untuk memverifikasi kebersihan kode dari galat TypeScript dan linter:
```bash
npm run lint
```

---

## Dokumentasi API

Seluruh endpoint API berada di bawah jalur `/api/*` dan mengembalikan respons berformat JSON standar:

### Autentikasi
- `POST /api/auth/login`: Autentikasi pengguna dengan email dan password.
- `POST /api/auth/register`: Pendaftaran pengguna baru ke tabel `users`.
- `GET / POST /api/auth/[...nextauth]`: Handler session NextAuth.

### Profil Pengguna
- `GET /api/profile?email={email}` atau `GET /api/profile?id={id}`: Mengambil data profil lengkap pengguna.
- `PUT /api/profile`: Memperbarui data profil, identitas kampus, atau token pihak ketiga.

### Manajemen Tugas
- `GET /api/tugas?userId={id}`: Mengambil daftar tugas milik pengguna urut berdasarkan deadline.
- `POST /api/tugas`: Menambahkan tugas baru.
- `PUT /api/tugas`: Mengubah data atau status penyelesaian tugas.
- `DELETE /api/tugas?id={id}`: Menghapus tugas berdasarkan ID.

### Transaksi Keuangan
- `GET /api/transaksi?userId={id}`: Mengambil seluruh riwayat transaksi dompet pengguna.
- `POST /api/transaksi`: Mencatat transaksi baru (pemasukan atau pengeluaran).
- `DELETE /api/transaksi?id={id}`: Menghapus catatan transaksi.

### Kosan
- `GET /api/kosan`: Mengambil katalog kos dengan parameter opsional `lat`, `lng`, `tipe`, `maxHarga`, dan `search`.

### Voucher
- `GET /api/vouchers`: Mengambil daftar voucher diskon yang tersedia.

### Lowongan Kerja
- `GET /api/jobs`: Mengambil daftar lowongan kerja mahasiswa dari database lokal.
- `GET /api/jobs/adzuna`: Agregasi lowongan kerja dari Adzuna Jobs API dengan fallback lokal.

---

## Struktur Direktori

```
SAHABAT-MAHASISWA/
├── app/
│   ├── api/                      # REST API Route Handlers
│   │   ├── auth/                 # Login, Register, dan NextAuth
│   │   ├── jobs/                 # Lowongan kerja (MySQL & Adzuna)
│   │   ├── kosan/                # Katalog kosan & Haversine formula
│   │   ├── profile/              # Pengelolaan data profil pengguna
│   │   ├── transaksi/            # Mutasi dompet mahasiswa
│   │   ├── tugas/                # Manajemen tugas kuliah
│   │   └── vouchers/             # Direktori voucher promo
│   ├── globals.css               # Styling global Tailwind CSS v4
│   ├── layout.tsx                # Root layout Next.js
│   └── page.tsx                  # Halaman utama aplikasi
├── components/                   # Komponen antarmuka (UI)
│   ├── AdzunaConfigModal.tsx     # Pengaturan API Adzuna
│   ├── AuthModal.tsx             # Modal login dan registrasi
│   ├── ClaimVoucherModal.tsx     # Modal kode serial klaim voucher
│   ├── DompetTab.tsx             # Tab manajemen keuangan
│   ├── KerjaTab.tsx              # Tab pencarian lowongan kerja
│   ├── KosanTab.tsx              # Tab pencarian kosan
│   ├── Navbar.tsx                # Navigasi utama & profil switcher
│   ├── OutletModal.tsx           # Modal informasi merchant outlet
│   ├── ProfileModal.tsx          # Modal pengaturan profil mahasiswa
│   ├── TikTokConfigModal.tsx     # Pengaturan integrasi TikTok
│   ├── TugasTab.tsx              # Tab daftar tugas kuliah
│   └── VoucherTab.tsx            # Tab direktori voucher makanan
├── database/
│   └── schema.sql                # Skema DDL, tabel, views, dan data seed
├── lib/
│   ├── api-client.ts             # Klien fetch API untuk integrasi frontend-backend
│   ├── auth.ts                   # Konfigurasi NextAuth
│   ├── data.ts                   # Data katalog default dan merchant
│   ├── db.ts                     # MySQL2 connection pool singleton
│   ├── launcher.ts               # Handler integrasi desktop & deeplink
│   ├── supabase.ts               # Adapter kompatibilitas legacy client
│   └── types.ts                  # Definisi antarmuka TypeScript
├── public/                       # Aset publik statis (logo, favicon)
├── scripts/
│   └── migrate.mjs               # Skrip migrasi database otomatis
├── .env.example                  # Template variabel lingkungan
├── eslint.config.mjs             # Konfigurasi ESLint
├── next.config.ts                # Konfigurasi Next.js
├── package.json                  # Dependensi dan script NPM
├── tsconfig.json                 # Konfigurasi TypeScript
└── PRD-SAHABAT-MAHASISWA.md      # Product Requirement Document
```

---

## Integrasi Desktop Launcher

Aplikasi mendukung interaksi dengan executable desktop wrapper (Electron) melalui protokol custom URI dan API window bridge pada `lib/launcher.ts`. Saat aplikasi dijalankan dalam konteks launcher desktop, pengguna dapat membuka aplikasi eksternal (seperti Google Maps, WhatsApp, atau browser bawaan sistem) secara terintegrasi.

---

## Lisensi

Proyek ini dikembangkan untuk keperluan akademik dan pengembangan aplikasi mahasiswa Indonesia. Seluruh hak cipta dilindungi di bawah lisensi institusi pengembang.
