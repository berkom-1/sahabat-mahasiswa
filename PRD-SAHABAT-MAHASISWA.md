# 🎓 Product Requirements Document (PRD): Sahabat Mahasiswa (Rebuilt Edition)

## 1. Ringkasan Eksekutif & Visi Produk
- **Nama Proyek:** Sahabat Mahasiswa
- **Tagline:** Portal All-in-One Kebutuhan Kehidupan Kampus Mahasiswa Indonesia
- **Target Pengguna:** Mahasiswa aktif D3/S1/S2 di seluruh perguruan tinggi Indonesia (UI, ITB, Unpad, UGM, dll.)
- **Tujuan Utama Rebuild:** Membangun ulang arsitektur monolitik statis (HTML/CSS/JS lama) menjadi aplikasi web modern berbasis **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **MySQL (Laragon / MariaDB RDBMS + Auth + Connection Pooling)** dengan standar arsitektur bersih, performa tinggi, PWA-ready, serta responsif di Mobile, Desktop, dan Tablet.

---

## 2. Tech Stack yang Direkomendasikan
- **Framework Utama:** Next.js 16+ (App Router, Route Handlers, React 19)
- **Bahasa:** TypeScript
- **Styling & UI:** Tailwind CSS (v4) + Lucide React Icons + Glassmorphism Theme (Plus Jakarta Sans font)
- **Basis Data:** MySQL 8.0+ / MariaDB (Laragon Local & Production RDBMS Connection Pooling via `mysql2/promise`)
- **Autentikasi & Keamanan:** NextAuth.js + Bcrypt Password Hashing + Smart Dual-Account Linking (Email Kampus @*.ac.id & Google Account)
- **Deployment & Mobile:** Laragon Local Server / Vercel Web Hosting & PWA (Progressive Web App) / Capacitor / Android APK WebView ready

---

## 3. Fitur Utama & Spesifikasi Fungsional

### Modul 1: 🏠 Cari Kos Mahasiswa (Geolokasi & GPS Haversine)
1. **Pencarian Berbasis Lokasi Kampus / Radius GPS:**
   - Deteksi koordinat GPS pengguna (`navigator.geolocation`).
   - Query fungsi PostgreSQL `get_kosan_terdekat(lat, lng, radius_km)` untuk menghitung jarak akurat (Haversine Formula).
2. **Filter & Sorting Interaktif:**
   - Filter budget maksimal bulanan (misal: Rp300rb, Rp500rb, Rp1jt, Rp2jt+).
   - Filter tipe kos (Putra, Putri, Campur) dan kelengkapan fasilitas (WiFi, AC, Kamar Mandi Dalam, Parkir).
   - Urutkan berdasarkan: Terdekat (jarak GPS) atau Termurah (harga per bulan).
3. **Detail & Interaksi Kos:**
   - Galeri foto kos, deskripsi fasilitas, alamat area kampus.
   - Tombol hubungi pemilik via WhatsApp langsung (format pesan otomatis).

### Modul 2: 🎟️ Voucher & Promo Kuliner Mahasiswa
1. **Aggregator Promo Makanan Ramah Kantong:**
   - Menampilkan promo aktif dari mitra platform: TikTok GO Dining, GrabFood, GoFood, dan ShopeeFood.
   - Filter chip kategori platform (Semua, TikTok, GrabFood, GoFood, ShopeeFood, Diskon Terbesar).
2. **Klaim & Salin Kode Diskon:**
   - Tombol satu klik "Salin Kode Promo" dengan toast notifikasi.
   - Tombol deep-link atau external URL langsung ke aplikasi pemesanan terkait.

### Modul 3: 👛 Dompet Mahasiswa (Smart Daily Limit & Budget Planner)
1. **Smart Daily Limit Virtual Card:**
   - Perhitungan otomatis sisa budget harian aman: `(Saldo Tersedia) / (Sisa Hari dalam Bulan Berjalan)`.
   - Visual progress bar pemakaian anggaran bulanan (persentase terpakai & indikator warna: Hijau, Kuning, Merah).
2. **Pencatatan Transaksi Cepat:**
   - Input jenis transaksi: Pemasukan (uang saku, gaji kerja sampingan) vs Pengeluaran (makan, kos, fotokopi, nongkrong).
   - Kategori transaksi spesifik kebutuhan mahasiswa.
   - Riwayat transaksi real-time dengan kemampuan filter dan tombol "Salin Ringkasan".

### Modul 4: 📅 Tugas Kuliah & Deadline Tracker (Prioritas Cerdas)
1. **Manajemen Tugas & Mata Kuliah:**
   - Input nama tugas, mata kuliah, batas waktu (deadline date picker), dan bobot kesulitan (1: Ringan, 2: Sedang, 3: Berat).
   - Algoritma pengurutan prioritas otomatis berdasarkan selisih hari menuju deadline dan bobot.
2. **Status & Checklist:**
   - Tab pemisah: Tugas Aktif vs Tugas Selesai.
   - Checkbox selesai dengan efek coret dan pembaruan instan ke database MySQL.

### Modul 5: 💼 Lowongan Part-Time & Magang Mahasiswa
1. **Kurasi Lowongan Kerja Fleksibel:**
   - Kategori pekerjaan ramah jadwal kuliah: Barista Kafe, Staff Event Organizer, Tutor/Guru Les, Freelance Content Creator, Admin Online Shop.
   - Filter jam kerja per minggu (Maks 10 jam, 20 jam, 40 jam) dan tipe (Part-time, Freelance, Magang).
2. **Informasi Lamaran:**
   - Gaji/upah transparan per jam/bulan, syarat mahasiswa, dan tombol lamar cepat ke WhatsApp HRD atau link form resmi.

### Modul 6: 🔐 Profil Pengguna & Autentikasi MySQL
1. **Login & Registrasi:**
   - Email + Password dengan konfirmasi & penanganan error ramah pengguna.
   - Google Sign-In (OAuth) sekali klik.
   - Guest Mode / Fallback jika pengguna ingin melihat katalog kos dan promo tanpa login (fitur personal terkunci dengan gate card elegan).
2. **Manajemen Profil:**
   - Pengaturan biodata (Nama, Kampus, Jurusan, Nomor HP, Avatar).
   - Pengaturan tema antarmuka (Light Mode / Dark Mode) dengan penyimpanan preferensi.

---

## 4. Skema Database MySQL (Laragon / MariaDB)

```sql
-- 1. Users & Profil Mahasiswa
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  kampus VARCHAR(255) DEFAULT 'Universitas Siliwangi (UNSIL)',
  fakultas VARCHAR(255) DEFAULT '',
  jurusan VARCHAR(255) DEFAULT 'Informatika',
  semester INT DEFAULT 1,
  telp VARCHAR(50) DEFAULT '',
  avatar_url LONGTEXT,
  student_email VARCHAR(255),
  student_verified TINYINT(1) DEFAULT 0,
  google_email VARCHAR(255),
  google_linked TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Kosan Mahasiswa
CREATE TABLE kos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  gender_type ENUM('putra', 'putri', 'campur') DEFAULT 'campur',
  price_per_month INT UNSIGNED NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) DEFAULT 'Tasikmalaya',
  campus_name VARCHAR(255) DEFAULT 'Universitas Siliwangi (UNSIL)',
  distance_km DECIMAL(4,1) DEFAULT 1.0,
  lat DECIMAL(10, 7) DEFAULT -7.3512,
  lng DECIMAL(10, 7) DEFAULT 108.2234,
  rating DECIMAL(2, 1) DEFAULT 4.8,
  sisa_kamar INT DEFAULT 3,
  contact_phone VARCHAR(255) NOT NULL,
  image_url VARCHAR(255),
  facilities JSON,
  is_available TINYINT(1) DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Transaksi Dompet Mahasiswa
CREATE TABLE wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(255) NOT NULL,
  amount INT UNSIGNED NOT NULL,
  description VARCHAR(255),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tugas Kuliah (Assignment Deadlines)
CREATE TABLE assignment_deadlines (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATETIME NOT NULL,
  weight ENUM('rendah', 'sedang', 'tinggi') DEFAULT 'sedang',
  difficulty ENUM('mudah', 'sedang', 'sulit') DEFAULT 'sedang',
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Compatibility Views (profiles, kosan, transaksi, tugas)
CREATE OR REPLACE VIEW profiles AS SELECT id, email, name AS nama, kampus, fakultas, jurusan, semester, telp, avatar_url, student_email, student_verified, google_email, google_linked, created_at, updated_at FROM users;
CREATE OR REPLACE VIEW tugas AS SELECT id, user_id, title AS nama_tugas, due_date AS deadline, CASE WHEN weight = 'rendah' THEN 1 WHEN weight = 'tinggi' THEN 3 ELSE 2 END AS bobot, (status = 'completed') AS selesai, created_at, updated_at FROM assignment_deadlines;
CREATE OR REPLACE VIEW transaksi AS SELECT id, user_id, CASE WHEN type = 'income' THEN 'masuk' ELSE 'keluar' END AS jenis, category AS kategori, amount AS nominal, description AS catatan, transaction_date AS tanggal, created_at, updated_at FROM wallet_transactions;
CREATE OR REPLACE VIEW kosan AS SELECT id, name AS nama, slug, gender_type AS tipe, price_per_month AS harga, address AS alamat, city AS kota, campus_name AS area, distance_km AS jarak, contact_phone AS telp, image_url AS foto_url, facilities AS fasilitas, is_available, description AS deskripsi, lat, lng, rating, sisa_kamar, created_at, updated_at FROM kos;
```

---

## 5. Rencana Tahapan Implementasi (Tasks Roadmap)
1. **Fase 1: Setup & Konfigurasi Fondasi**
   - Inisialisasi struktur Next.js App Router dengan Tailwind CSS & Lucide Icons.
   - Konfigurasi MySQL Connection Pool (`mysql2/promise`) & helper API Route handlers.
   - Setup Environment Variables (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`).
2. **Fase 2: Autentikasi & Navigasi Mobile-First**
   - Halaman Login & Registrasi dengan tab peralihan halus serta tombol Login Google.
   - Navbar atas (Logo & Avatar Profil) dan Floating Dock Bottom Navigation di mobile.
3. **Fase 3: Modul Kosan & Geolokasi**
   - Komponen katalog kosan dengan filter harga & urutan terdekat.
   - Integrasi navigator geolocation dan fallback dummy GPS kampus.
4. **Fase 4: Modul Diskon & Promo Makanan**
   - Grid voucher hemat dengan filter chip platform (TikTok Dining, GrabFood, GoFood, ShopeeFood).
   - Fitur copy kode promo dan tombol klaim link eksternal.
5. **Fase 5: Modul Dompet Cerdas & Tugas Kuliah**
   - Smart daily budget limit card & form catat pemasukan/pengeluaran.
   - Task manager dengan deadline picker dan indikator prioritas.
6. **Fase 6: Modul Lowongan & Profil Pengguna**
   - List part-time/magang dengan filter jam kerja dan tombol hubungi HRD.
   - Halaman profil dengan edit biodata dan switch tema Gelap/Terang.
