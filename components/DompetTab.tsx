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

  // Form State
  const [jenis, setJenis] = useState<"masuk" | "keluar">("keluar");
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");

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
    const text = `📊 *Laporan Keuangan Sahabat Mahasiswa*\n💰 Sisa Saldo: ${formatRupiah(
      sisaSaldo
    )}\n📅 Sisa Hari Bulan Ini: ${daysRemaining} hari\n🎯 Batas Belanja Harian Aman: ${formatRupiah(
      dailyLimit
    )}/hari\n🔻 Total Pengeluaran: ${formatRupiah(totalKeluar)}`;
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

  return (
    <div className="space-y-6 pb-24">
      {/* Smart Daily Budget Card */}
      <div className="rounded-3xl bg-linear-to-br from-emerald-600 via-teal-700 to-cyan-800 p-6 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <Wallet className="w-3.5 h-3.5 text-emerald-200" /> Smart Daily Budget
            </span>
            <span className="text-xs text-teal-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Sisa {daysRemaining} hari bulan ini
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-teal-100 font-medium">Sisa Saldo Dompet</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                {formatRupiah(sisaSaldo)}
              </h2>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <p className="text-[11px] text-teal-100 font-medium">Batas Aman Belanja Harian</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                {formatRupiah(dailyLimit)}
                <span className="text-xs text-white/80 font-normal"> / hari</span>
              </h3>
              <p className="text-[10px] text-teal-100/80 mt-1">
                Rumus: Sisa Saldo &divide; Sisa Hari Bulan Ini
              </p>
            </div>
          </div>

          {/* Quick Stats: In vs Out */}
          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-teal-200 text-[10px] block">Pemasukan</span>
                <span className="font-bold">{formatRupiah(totalMasuk)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-teal-200 text-[10px] block">Pengeluaran</span>
                <span className="font-bold">{formatRupiah(totalKeluar)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Add Transaction & Copy Summary */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pengeluaran / Pemasukan</span>
        </button>

        <button
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1.5 py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-sm hover:bg-slate-50 transition-colors"
        >
          {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{copiedSummary ? "Tersalin" : "Salin Laporan"}</span>
        </button>
      </div>

      {/* Transaction History List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Riwayat Transaksi Mahasiswa</span>
          </h3>
          <span className="text-xs text-slate-400">{transaksiList.length} transaksi</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transaksiList.map((tx) => (
            <div
              key={tx.id}
              className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    tx.jenis === "masuk"
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600"
                      : "bg-rose-100 dark:bg-rose-950/50 text-rose-600"
                  }`}
                >
                  {tx.jenis === "masuk" ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {tx.kategori}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {tx.catatan || "Tidak ada catatan"} &bull; {tx.tanggal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-black text-xs sm:text-sm ${
                    tx.jenis === "masuk"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.jenis === "masuk" ? "+" : "-"} {formatRupiah(tx.nominal)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {transaksiList.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">
              Belum ada transaksi tercatat. Mulai catat keuangan Anda hari ini!
            </p>
          )}
        </div>
      </div>

      {/* Modal Tambah Transaksi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Catat Transaksi Baru
            </h3>

            <form onSubmit={handleAddTransaksi} className="space-y-4">
              {/* Jenis Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setJenis("keluar")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    jenis === "keluar"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setJenis("masuk")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    jenis === "masuk"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              {/* Kategori Select */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Kategori
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal Input */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 25000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  required
                  min="1"
                  className="w-full text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Catatan Input */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli makan siang nasi padang"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
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
