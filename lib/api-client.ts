// lib/api-client.ts
// Client helper for interacting with MySQL-backed Next.js API endpoints

import { Tugas, Transaksi, Kosan, Voucher, LowonganKerja, UserProfile } from "./types";

export const apiClient = {
  // --- AUTH ---
  async login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal masuk");
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    nama?: string;
    kampus?: string;
    jurusan?: string;
    student_email?: string | null;
    student_verified?: boolean;
  }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mendaftar");
    return data;
  },

  // --- PROFIL ---
  async getProfile(userId?: string, email?: string): Promise<UserProfile | null> {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (email) params.set("email", email);

    const res = await fetch(`/api/profile?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.profile || null;
  },

  async updateProfile(payload: Partial<UserProfile> & { id?: string; email?: string }) {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal update profil");
    return data;
  },

  // --- TUGAS ---
  async getTugas(userId?: string): Promise<Tugas[]> {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);

    const res = await fetch(`/api/tugas?${params.toString()}`);
    if (!res.ok) throw new Error("Gagal mengambil data tugas");
    const json = await res.json();
    return json.data || [];
  },

  async addTugas(tugas: {
    user_id?: string;
    nama_tugas: string;
    deadline: string;
    bobot: number;
    selesai?: boolean;
  }): Promise<Tugas> {
    const res = await fetch("/api/tugas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tugas),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menambah tugas");
    return json.task;
  },

  async updateTugas(id: string, updates: Partial<Tugas>) {
    const res = await fetch("/api/tugas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal update status tugas");
    return json;
  },

  async deleteTugas(id: string) {
    const res = await fetch(`/api/tugas?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menghapus tugas");
    return json;
  },

  // --- TRANSAKSI (DOMPET) ---
  async getTransaksi(userId?: string): Promise<Transaksi[]> {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);

    const res = await fetch(`/api/transaksi?${params.toString()}`);
    if (!res.ok) throw new Error("Gagal mengambil transaksi");
    const json = await res.json();
    return json.data || [];
  },

  async addTransaksi(transaksi: {
    user_id?: string;
    jenis: "masuk" | "keluar";
    kategori: string;
    nominal: number;
    catatan?: string;
    tanggal?: string;
  }): Promise<Transaksi> {
    const res = await fetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaksi),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menambah transaksi");
    return json.transaction;
  },

  async deleteTransaksi(id: string) {
    const res = await fetch(`/api/transaksi?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menghapus transaksi");
    return json;
  },

  // --- KOSAN ---
  async getKosan(filters?: {
    lat?: number;
    lng?: number;
    tipe?: string;
    maxHarga?: number;
    search?: string;
  }): Promise<Kosan[]> {
    const params = new URLSearchParams();
    if (filters?.lat !== undefined) params.set("lat", String(filters.lat));
    if (filters?.lng !== undefined) params.set("lng", String(filters.lng));
    if (filters?.tipe && filters.tipe !== "all") params.set("tipe", filters.tipe);
    if (filters?.maxHarga) params.set("maxHarga", String(filters.maxHarga));
    if (filters?.search) params.set("search", filters.search);

    const res = await fetch(`/api/kosan?${params.toString()}`);
    if (!res.ok) throw new Error("Gagal mengambil kosan");
    const json = await res.json();
    return json.data || [];
  },

  // --- VOUCHERS ---
  async getVouchers(): Promise<Voucher[]> {
    const res = await fetch("/api/vouchers");
    if (!res.ok) throw new Error("Gagal mengambil voucher");
    const json = await res.json();
    return json.data || [];
  },

  // --- LOWONGAN KERJA ---
  async getJobs(): Promise<LowonganKerja[]> {
    const res = await fetch("/api/jobs");
    if (!res.ok) throw new Error("Gagal mengambil lowongan kerja");
    const json = await res.json();
    return json.data || [];
  },
};
