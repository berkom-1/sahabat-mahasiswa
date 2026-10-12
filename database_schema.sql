-- ============================================================================
-- SKEMA DATABASE SUPABASE: SAHABAT MAHASISWA
-- ============================================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- (Buka Dashboard Supabase -> Project Anda -> SQL Editor -> Tempel & Run)
-- ============================================================================

-- Aktifkan ekstensi UUID jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABEL PROFILES (Biodata & Akun Mahasiswa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kampus TEXT DEFAULT 'Mahasiswa Indonesia',
  jurusan TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  telp TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) untuk profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profil dapat dibaca oleh publik atau pengguna terautentikasi"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Pengguna dapat mengupdate profil miliknya sendiri"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Pengguna dapat menyisipkan profil miliknya sendiri"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger otomatis untuk membuat baris profile saat user baru mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama, kampus, jurusan, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'kampus', 'Mahasiswa Indonesia'),
    COALESCE(NEW.raw_user_meta_data->>'jurusan', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 2. TABEL KOSAN (Daftar Kosan Mahasiswa & Titik GPS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kosan (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  area TEXT NOT NULL,
  harga NUMERIC NOT NULL,
  fasilitas TEXT[] DEFAULT '{}',
  telp TEXT,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS untuk kosan
ALTER TABLE public.kosan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kosan dapat dilihat oleh semua orang"
  ON public.kosan FOR SELECT
  USING (true);

CREATE POLICY "Hanya admin/authenticated yang dapat mengelola kosan"
  ON public.kosan FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 3. TABEL TRANSAKSI (Dompet Keuangan Mahasiswa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transaksi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  kategori TEXT NOT NULL,
  nominal NUMERIC NOT NULL CHECK (nominal > 0),
  catatan TEXT,
  tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS untuk transaksi
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna hanya dapat melihat transaksinya sendiri"
  ON public.transaksi FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menambah transaksinya sendiri"
  ON public.transaksi FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus transaksinya sendiri"
  ON public.transaksi FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- 4. TABEL TUGAS (Pengingat Tugas & Deadline Kuliah)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tugas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nama_tugas TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  bobot INT DEFAULT 1 CHECK (bobot >= 1 AND bobot <= 5),
  selesai BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS untuk tugas
ALTER TABLE public.tugas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna hanya dapat melihat tugasnya sendiri"
  ON public.tugas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat membuat tugasnya sendiri"
  ON public.tugas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat memperbarui tugasnya sendiri"
  ON public.tugas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus tugasnya sendiri"
  ON public.tugas FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- 5. FUNGSI POSTGRESQL: PERHITUNGAN RADIUS & JARAK KOSAN (HAVERSINE)
-- ============================================================================
-- Menghitung jarak antara koordinat pengguna dan semua kosan di database
-- Menghasilkan data kosan terurut dari yang paling dekat
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
    k.id,
    k.nama,
    k.area,
    k.harga,
    k.fasilitas,
    k.telp,
    k.lat,
    k.lng,
    k.foto_url,
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


-- ============================================================================
-- 6. DATA AWAL (SEED DATA REALISTIS) UNTUK TABEL KOSAN
-- ============================================================================
INSERT INTO public.kosan (nama, area, harga, fasilitas, telp, lat, lng, foto_url)
VALUES 
  (
    'Kos Melati Eksklusif',
    'Dekat Gerbang Utama Kampus UI Depok',
    450000,
    ARRAY['Kamar mandi luar', 'Wi-Fi', 'Parkir'],
    '6281234567891',
    -6.3627000,
    106.8271000,
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80'
  ),
  (
    'Kos Putra Mandiri',
    'Jl. Gelap Nyawang (Dekat ITB Bandung)',
    600000,
    ARRAY['Kamar mandi dalam', 'Kasur', 'Wi-Fi'],
    '6281234567892',
    -6.8915000,
    107.6106000,
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&auto=format&fit=crop&q=80'
  ),
  (
    'Kos Asri Kampus 2',
    'Jatinangor (Belakang Rektorat Unpad)',
    850000,
    ARRAY['AC', 'Kamar mandi dalam', 'Wi-Fi'],
    '6281234567893',
    -6.9278000,
    107.7735000,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=80'
  ),
  (
    'Kos Harmoni Pelajar',
    'Kukusan Teknik UI Depok',
    350000,
    ARRAY['Kamar mandi luar', 'Kasur'],
    '6281234567894',
    -6.3685000,
    106.8219000,
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&auto=format&fit=crop&q=80'
  ),
  (
    'Kos Premiere Residence',
    'Jl. Dago Asri No. 88 (Dekat ITB)',
    1400000,
    ARRAY['AC', 'Laundry', 'Wi-Fi', 'Parkir'],
    '6281234567895',
    -6.8845000,
    107.6185000,
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80'
  )
ON CONFLICT DO NOTHING;
