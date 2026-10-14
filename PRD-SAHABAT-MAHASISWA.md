# 🎓 Product Requirements Document (PRD): Sahabat Mahasiswa (Rebuilt Edition)

## 1. Ringkasan Eksekutif & Visi Produk
- **Nama Proyek:** Sahabat Mahasiswa
- **Tagline:** Portal All-in-One Kebutuhan Kehidupan Kampus Mahasiswa Indonesia
- **Target Pengguna:** Mahasiswa aktif D3/S1/S2 di seluruh perguruan tinggi Indonesia (UI, ITB, Unpad, UGM, dll.)
- **Tujuan Utama Rebuild:** Membangun ulang arsitektur monolitik statis (HTML/CSS/JS lama) menjadi aplikasi web modern berbasis **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase (PostgreSQL + Auth + Storage)** dengan standar arsitektur bersih, performa tinggi, PWA-ready, serta responsif di Mobile, Desktop, dan Tablet.

---

## 2. Tech Stack yang Direkomendasikan
- **Framework Utama:** Next.js 15+ (App Router, Server Components & Server Actions)
- **Bahasa:** TypeScript
- **Styling & UI:** Tailwind CSS (v4) + Lucide React Icons + Glassmorphism Theme (Plus Jakarta Sans font)
- **Backend as a Service:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime)
- **Autentikasi:** Supabase Auth (Email/Password + Google OAuth) & NextAuth.js (opsional dual support)
- **Deployment & Mobile:** Vercel (Web Hosting) & PWA (Progressive Web App) / Capacitor / Android APK WebView ready

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
   - Checkbox selesai dengan efek coret dan pembaruan instan ke Supabase.

### Modul 5: 💼 Lowongan Part-Time & Magang Mahasiswa
1. **Kurasi Lowongan Kerja Fleksibel:**
   - Kategori pekerjaan ramah jadwal kuliah: Barista Kafe, Staff Event Organizer, Tutor/Guru Les, Freelance Content Creator, Admin Online Shop.
   - Filter jam kerja per minggu (Maks 10 jam, 20 jam, 40 jam) dan tipe (Part-time, Freelance, Magang).
2. **Informasi Lamaran:**
   - Gaji/upah transparan per jam/bulan, syarat mahasiswa, dan tombol lamar cepat ke WhatsApp HRD atau link form resmi.

### Modul 6: 🔐 Profil Pengguna & Autentikasi Supabase
1. **Login & Registrasi:**
   - Email + Password dengan konfirmasi & penanganan error ramah pengguna.
   - Google Sign-In (OAuth) sekali klik.
   - Guest Mode / Fallback jika pengguna ingin melihat katalog kos dan promo tanpa login (fitur personal terkunci dengan gate card elegan).
2. **Manajemen Profil:**
   - Pengaturan biodata (Nama, Kampus, Jurusan, Nomor HP, Avatar).
   - Pengaturan tema antarmuka (Light Mode / Dark Mode) dengan penyimpanan preferensi.

---

## 4. Skema Database Supabase (PostgreSQL)

```sql
-- 1. Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kampus TEXT DEFAULT 'Mahasiswa Indonesia',
  jurusan TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  telp TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Kosan
CREATE TABLE public.kosan (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  area TEXT NOT NULL,
  harga NUMERIC NOT NULL,
  tipe TEXT CHECK (tipe IN ('putra', 'putri', 'campur')),
  fasilitas TEXT[] DEFAULT '{}',
  telp TEXT,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Transaksi (Dompet)
CREATE TABLE public.transaksi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  kategori TEXT NOT NULL,
  nominal NUMERIC NOT NULL CHECK (nominal > 0),
  catatan TEXT,
  tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Tugas Kuliah
CREATE TABLE public.tugas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nama_tugas TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  bobot INT DEFAULT 2 CHECK (bobot BETWEEN 1 AND 3),
  selesai BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Fungsi Jarak Haversine
CREATE OR REPLACE FUNCTION public.get_kosan_terdekat(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km NUMERIC DEFAULT 50
)
RETURNS TABLE (
  id INT,
  nama TEXT,
  area TEXT,
  harga NUMERIC,
  fasilitas TEXT[],
  telp TEXT,
  lat NUMERIC,
  lng NUMERIC,
  foto_url TEXT,
  jarak_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id, k.nama, k.area, k.harga, k.fasilitas, k.telp, k.lat, k.lng, k.foto_url,
    ROUND(
      (6371 * ACOS(
        LEAST(1.0, GREATEST(-1.0,
          COS(RADIANS(user_lat)) * COS(RADIANS(k.lat)) *
          COS(RADIANS(k.lng) - RADIANS(user_lng)) +
          SIN(RADIANS(user_lat)) * SIN(RADIANS(k.lat))
        ))
      ))::numeric, 2
    ) AS jarak_km
  FROM public.kosan k
  WHERE (
    6371 * ACOS(
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(user_lat)) * COS(RADIANS(k.lat)) *
        COS(RADIANS(k.lng) - RADIANS(user_lng)) +
        SIN(RADIANS(user_lat)) * SIN(RADIANS(k.lat))
      ))
    )
  ) <= radius_km
  ORDER BY jarak_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 5. Rencana Tahapan Implementasi (Tasks Roadmap)
1. **Fase 1: Setup & Konfigurasi Fondasi**
   - Inisialisasi struktur Next.js App Router dengan Tailwind CSS & Lucide Icons.
   - Konfigurasi Supabase Client & Server helper (`@supabase/ssr`).
   - Setup Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
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
