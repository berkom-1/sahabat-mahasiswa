export interface Kosan {
  id: number | string;
  nama: string;
  area: string;
  harga: number;
  tipe?: "putra" | "putri" | "campur";
  jarak?: number;
  lat: number;
  lng: number;
  telp: string;
  fasilitas: string[];
  foto_url?: string;
}

export interface Voucher {
  id: number | string;
  brand: string;
  brandLogo: string;
  brandColor?: string;
  kategori: string;
  platform: "TikTok GO Dining" | "GrabFood" | "GoFood" | "ShopeeFood";
  platformIcon: string;
  namaVoucher: string;
  deskripsi: string;
  hargaAsli: number;
  hargaDiskon: number;
  diskonPersen: number;
  badge?: string;
  kodePromo?: string;
  linkBeli: string;
  catatan?: string;
}

export interface Transaksi {
  id: string;
  user_id?: string;
  jenis: "masuk" | "keluar";
  kategori: string;
  nominal: number;
  catatan?: string;
  tanggal: string;
  created_at?: string;
}

export interface Tugas {
  id: string;
  user_id?: string;
  nama_tugas: string;
  deadline: string;
  bobot: number; // 1: Ringan, 2: Sedang, 3: Berat
  selesai: boolean;
  created_at?: string;
}

export interface LowonganKerja {
  id: number | string;
  posisi: string;
  tipe: "Part-time" | "Freelance" | "Magang";
  gaji: number;
  jam: number;
  lokasi: string;
  hrd: string;
  syarat: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nama: string;
  kampus: string;
  jurusan: string;
  avatar_url?: string;
  telp?: string;
}
