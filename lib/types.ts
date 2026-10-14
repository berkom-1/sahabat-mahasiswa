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

export interface Outlet {
  brandKey: string;
  brand: string;
  namaOutlet: string;
  tagline: string;
  brandLogo: string;
  kategori: string;
  rating: string;
  ulasan: number;
  dispan?: string;
  disimpan: string;
  terjualOutlet: string;
  jamBuka: string;
  alamat: string;
  jarak: string;
  mapQuery: string;
  platform: "TikTok GO Dining" | "GrabFood" | "GoFood" | "ShopeeFood";
  platformColor: string;
  tiktokUsername: string;
}

export interface Voucher {
  id: number | string;
  brand: string;
  brandKey?: string;
  brandLogo: string;
  brandColor?: string;
  kategori: string;
  platform: "TikTok GO Dining" | "GrabFood" | "GoFood" | "ShopeeFood";
  platformColor?: string;
  platformIcon: string;
  namaVoucher: string;
  deskripsi: string;
  hargaAsli: number;
  hargaDiskon: number;
  diskonPersen: number;
  pax?: number | "all";
  rating?: string;
  terjual?: number | string;
  badge?: string;
  badgeTerlaris?: string;
  kodePromo?: string;
  serialVoucher?: string;
  linkBeli: string;
  mapQuery?: string;
  tiktokUsername?: string;
  catatan?: string;
}

export interface TikTokConfig {
  clientKey: string;
  accessToken: string;
  shopId?: string;
  merchantId?: string;
  active: boolean;
  updatedAt?: string;
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
  fakultas?: string;
  jurusan: string;
  avatar_url?: string;
  telp?: string;
  tiktok_client_key?: string;
  tiktok_access_token?: string;
}
