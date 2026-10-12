# 🎓 Sahabat Mahasiswa

**Sahabat Mahasiswa** adalah platform terintegrasi (*all-in-one portal*) yang dirancang khusus untuk mempermudah kehidupan sehari-hari mahasiswa di Indonesia. Mulai dari mencari tempat tinggal (kos), berburu promo dan voucher makanan hemat, hingga menemukan pekerjaan paruh waktu (*part-time*).

---

## 📥 Unduh Aplikasi (Download)

Aplikasi telah dibundle dan siap digunakan untuk perangkat Android maupun Windows:

| Platform | Tipe File | Tautan Unduhan | Keterangan |
| :--- | :--- | :--- | :--- |
| **Android** | `.apk` | [📲 Unduh Sahabat-Mahasiswa.apk (dist)](dist/Sahabat-Mahasiswa.apk) <br> [🚀 Unduh via GitHub Release](https://github.com/NnoeeL/SAHABAT-MAHASISWA/releases/download/v1.0.0/Sahabat-Mahasiswa.apk) | Aplikasi Android Mobile (1.2 MB) |
| **Windows** | `.exe` | [💻 Unduh Sahabat-Mahasiswa-Setup.exe (GitHub Release)](https://github.com/NnoeeL/SAHABAT-MAHASISWA/releases/download/v1.0.0/Sahabat-Mahasiswa-Setup.exe) <br> Path lokal: `dist/Sahabat-Mahasiswa-Setup.exe` | Installer Setup Windows x64 (150 MB) |
| **Windows Portable** | `.zip` | Path lokal: `dist/Sahabat-Mahasiswa-Windows-x64.zip` | Versi Portable langsung ekstrak |

---

## ✨ Fitur Utama

### 1. 🏠 Cari Kos Terdekat
- **Pencarian Berbasis Lokasi & Peta:** Menampilkan rekomendasi kosan di sekitar kampus atau lokasi pengguna secara langsung.
- **Filter Fleksibel:** Filter menurut rentang harga bulanan, tipe kos (Putra, Putri, Campur), dan kelengkapan fasilitas (WiFi, AC, kamar mandi dalam).
- **Detail Lengkap:** Informasi kontak pemilik kos, alamat akurat, estimasi jarak, dan galeri foto.

### 2. 🍔 Voucher & Promo Makanan Mahasiswa
- **Promo Kuliner Terverifikasi:** Kumpulan diskon dan promo makanan hemat harian (GrabFood, GoFood, ShopeeFood).
- **Voucher Khusus:** Promo TikTok Shop kuliner (seperti voucher diskon Mixue), promo Kopi Kenangan, dan outlet makanan favorit mahasiswa lainnya.
- **Salin Kode Instan:** Salin kode voucher atau langsung buka aplikasi terkait dengan satu sentuhan.

### 3. 💼 Lowongan Part-Time & Magang
- **Peluang Kerja Fleksibel:** Info lowongan kerja paruh waktu ramah mahasiswa (Barista Kafe, Staff Event, Tutor Les, Content Creator, dll).
- **Filter Lokasi & Bidang:** Temukan pekerjaan yang dekat dengan kampus dengan jam kerja yang tidak mengganggu jadwal kuliah.
- **Lamaran Mudah:** Akses langsung ke kontak HRD atau link pendaftaran resmi.

### 4. 🔐 Login & Personalisasi Akun
- **Dukungan Akun Google:** Masuk dengan akun Google untuk sinkronisasi profil yang mulus.
- **Profil Pengguna:** Simpan kos favorit, pantau voucher yang sudah digunakan, dan kelola preferensi informasi.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** HTML5, CSS3 Modern, Vanilla JavaScript (PWA Ready)
- **Backend & Database:** Supabase (Auth, Realtime & PostgreSQL Database)
- **Desktop Runtime:** Electron (Windows x64)
- **Mobile Container:** Android WebView Wrapper (APK)

---

## 📂 Struktur Proyek

```plaintext
SAHABAT MAHASISWA/
├── dist/                          # File installer & executable siap pakai
│   ├── Sahabat-Mahasiswa-Setup.exe
│   ├── Sahabat-Mahasiswa.apk
│   └── Sahabat-Mahasiswa-Windows-x64.zip
├── assets/                        # Logo, icon, dan aset gambar
├── index.html                     # Halaman utama aplikasi
├── login.html                     # Halaman login & otentikasi
├── pengaturan.html                # Halaman pengaturan & profil
├── supabase-client.js             # Integrasi database & auth Supabase
├── database_schema.sql            # Skema tabel database
├── main.js                        # Konfigurasi Electron desktop
├── manifest.json                  # PWA Manifest
└── README.md                      # Dokumentasi aplikasi
```

---

## 🚀 Menjalankan Secara Lokal (Development)

1. Clone repositori ini:
   ```bash
   git clone https://github.com/NnoeeL/SAHABAT-MAHASISWA.git
   cd SAHABAT-MAHASISWA
   ```
2. Jalankan secara langsung di browser:
   - Buka file `index.html` menggunakan browser modern (Chrome, Edge, Firefox), atau gunakan ekstensi **Live Server**.
3. Menjalankan versi Desktop (Electron):
   ```bash
   npm install
   npm start
   ```

---

<div align="center">
  <sub>Dibuat dengan ❤️ untuk seluruh mahasiswa Indonesia</sub>
</div>
