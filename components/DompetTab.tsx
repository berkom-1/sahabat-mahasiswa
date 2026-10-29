"use client";

import React, { useState, useEffect } from "react";
import { Transaksi } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Plus,
  Calendar,
  Copy,
  Check,
  Trash2,
  PieChart,
  X,
  ArrowUpDown,
  Utensils,
  Home,
  BookOpen,
  Car,
  Coffee,
  Sparkles,
  DollarSign,
  Tag,
} from "lucide-react";

interface DompetTabProps {
  userId?: string | null;
}

const KATEGORI_OPTIONS = [
  "Makan & Minum",
  "Uang Kos / Tempat Tinggal",
  "Bahan Kuliah & Fotokopi",
  "Transportasi & Bensin",
  "Nongkrong & Hiburan",
  "Kebutuhan Pribadi",
  "Uang Saku / Kiriman Ortu",
  "Gaji Part-Time / Freelance",
  "Lain-lain",
];

const INITIAL_TRANSAKSI: Transaksi[] = [
  {
    id: "tx-1",
    jenis: "masuk",
    kategori: "Uang Saku / Kiriman Ortu",
    nominal: 1500000,
    catatan: "Kiriman bulanan orang tua",
    tanggal: "2026-10-01",
  },
  {
    id: "tx-2",
    jenis: "keluar",
    kategori: "Makan & Minum",
    nominal: 25000,
    catatan: "Makan siang kantin kampus",
    tanggal: "2026-10-15",
  },
  {
    id: "tx-3",
    jenis: "keluar",
    kategori: "Bahan Kuliah & Fotokopi",
    nominal: 15000,
    catatan: "Print modul laporan praktikum",
    tanggal: "2026-10-20",
  },
];

export default function DompetTab({ userId }: DompetTabProps) {
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form State
  const [jenis, setJenis] = useState<"masuk" | "keluar">("keluar");
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");

  // Close modal on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddModal(false);
    };
    if (showAddModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

  // Load transactions from MySQL
  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.getTransaksi(userId || undefined);
        if (data && data.length > 0) {
          setTransaksiList(data);
          return;
        }
      } catch (e) {
        console.warn("Gagal fetch MySQL transaksi:", e);
      }

      // Fallback LocalStorage
      const local = localStorage.getItem("sahabat_mahasiswa_transaksi");
      if (local) {
        try {
          setTransaksiList(JSON.parse(local));
        } catch {
          setTransaksiList(INITIAL_TRANSAKSI);
        }
      } else {
        setTransaksiList(INITIAL_TRANSAKSI);
      }
    }
    loadData();
  }, [userId]);

  // Save to LocalStorage whenever transaksiList changes
  const updateList = (newList: Transaksi[]) => {
    setTransaksiList(newList);
    localStorage.setItem("sahabat_mahasiswa_transaksi", JSON.stringify(newList));
  };

  // Calculations
  const totalMasuk = transaksiList
    .filter((t) => t.jenis === "masuk")
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const totalKeluar = transaksiList
    .filter((t) => t.jenis === "keluar")
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const sisaSaldo = totalMasuk - totalKeluar;

  // Calculate days remaining in current month
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - now.getDate() + 1);

  // Smart Daily Limit
  const dailyLimit = sisaSaldo > 0 ? Math.floor(sisaSaldo / daysRemaining) : 0;

  // Handle Add Transaction to MySQL
  const handleAddTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominalNumber = parseFloat(nominal);
    if (!nominalNumber || nominalNumber <= 0) return;

    let createdId = "tx-" + Date.now();
    const txDate = new Date().toISOString().split("T")[0];

    try {
      const created = await apiClient.addTransaksi({
        user_id: userId || undefined,
        jenis,
        kategori,
        nominal: nominalNumber,
        catatan: catatan.trim() || undefined,
        tanggal: txDate,
      });
      if (created?.id) {
        createdId = created.id;
      }
    } catch (err) {
      console.warn("Gagal simpan ke MySQL:", err);
    }

    const newTx: Transaksi = {
      id: createdId,
      user_id: userId || undefined,
      jenis,
      kategori,
      nominal: nominalNumber,
      catatan: catatan.trim() || undefined,
      tanggal: txDate,
    };

    updateList([newTx, ...transaksiList]);
    setNominal("");
    setCatatan("");
    setShowAddModal(false);
  };

  // Handle Delete in MySQL
  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteTransaksi(id);
    } catch (err) {
      console.warn("Gagal hapus transaksi di MySQL:", err);
    }
    updateList(transaksiList.filter((t) => t.id !== id));
  };

  // Copy Summary
  const handleCopySummary = () => {
    const text = `Laporan Keuangan Sahabat Mahasiswa\nSisa Saldo: ${formatRupiah(
      sisaSaldo
    )}\nSisa Hari Bulan Ini: ${daysRemaining} hari\nBatas Belanja Harian Aman: ${formatRupiah(
      dailyLimit
    )}/hari\nTotal Pengeluaran: ${formatRupiah(totalKeluar)}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredTx = transaksiList.filter((t) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "masuk") return t.jenis === "masuk";
    if (categoryFilter === "keluar") return t.jenis === "keluar";
    return t.kategori.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-24">
      {/* 1. TOP STATS CARDS (Hide.com luxury cards layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Sisa Saldo Dompet</span>
              <Wallet className="w-4 h-4 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatRupiah(sisaSaldo)}
            </h2>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Status keuangan</span>
            <span className={`font-semibold ${sisaSaldo >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {sisaSaldo >= 0 ? "Aman / Surplus" : "Defisit"}
            </span>
          </div>
        </div>

        {/* Card 2: Batas Harian */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Batas Belanja Harian</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {formatRupiah(dailyLimit)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ hari</span>
            </h3>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Sisa hari bulan ini</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {daysRemaining} Hari
            </span>
          </div>
        </div>

        {/* Card 3: In vs Out */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Arus Kas Bulan Ini
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Pemasukan:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatRupiah(totalMasuk)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Pengeluaran:
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatRupiah(totalKeluar)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Transaksi</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {transaksiList.length} Catatan
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB-FILTER PILLS & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "all", label: "Semua Catatan" },
            { id: "keluar", label: "Pengeluaran" },
            { id: "masuk", label: "Pemasukan" },
            { id: "Makan", label: "Makan & Minum" },
            { id: "Kos", label: "Uang Kos" },
            { id: "Kuliah", label: "Bahan Kuliah" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? "border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSummary ? "Tersalin" : "Salin Laporan"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* 3. TRANSACTION LIST CARDS (AirBnB style clean rows) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-500" />
            <span>Riwayat Transaksi Dompet</span>
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {filteredTx.length} dari {transaksiList.length} transaksi
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredTx.map((tx) => (
            <div
              key={tx.id}
              className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    tx.jenis === "masuk"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.jenis === "masuk" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {tx.kategori}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx.catatan || "Tidak ada catatan"} &bull; <span className="tabular-nums">{tx.tanggal}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-bold text-sm tabular-nums ${
                    tx.jenis === "masuk"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.jenis === "masuk" ? "+" : "-"} {formatRupiah(tx.nominal)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-full transition-all cursor-pointer"
                  title="Hapus Transaksi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredTx.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-10">
              Belum ada transaksi di kategori ini.
            </p>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH TRANSAKSI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Catat Transaksi Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTransaksi} className="space-y-4">
              {/* Jenis Transaksi Pills */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJenis("keluar")}
                  className={`py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    jenis === "keluar"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => setJenis("masuk")}
                  className={`py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    jenis === "masuk"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Pemasukan (+)
                </button>
              </div>

              {/* Nominal Input */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="Contoh: 25000"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold outline-none focus:border-rose-500 tabular-nums"
                />
              </div>

              {/* Kategori Select */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Kategori
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-rose-500 cursor-pointer"
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catatan Input */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Nasi padang lauk rendang..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-rose-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
