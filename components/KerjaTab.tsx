"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LowonganKerja, AdzunaConfig } from "@/lib/types";
import { DEFAULT_LOWONGAN } from "@/lib/data";
import {
  Briefcase,
  Clock,
  MapPin,
  MessageCircle,
  ExternalLink,
  Sparkles,
  KeyRound,
  Search,
  RefreshCw,
  Building2,
  Database,
} from "lucide-react";
import AdzunaConfigModal from "./AdzunaConfigModal";

export default function KerjaTab() {
  const [jobs, setJobs] = useState<LowonganKerja[]>(DEFAULT_LOWONGAN);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [maxHours, setMaxHours] = useState<number>(40);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isLiveAdzuna, setIsLiveAdzuna] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string>("");

  // Fetch jobs dari API internal (Adzuna / Kaggle fallback)
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let appId = "";
      let appKey = "";
      try {
        const saved = localStorage.getItem("sm_adzuna_config");
        if (saved) {
          const cfg: AdzunaConfig = JSON.parse(saved);
          appId = cfg.appId || "";
          appKey = cfg.appKey || "";
        }
      } catch {}

      const whatParam = searchKeyword.trim() || "magang";
      const whereParam = searchLocation.trim() || "Indonesia";

      const queryParams = new URLSearchParams({
        what: whatParam,
        where: whereParam,
      });

      if (appId && appKey) {
        queryParams.set("app_id", appId);
        queryParams.set("app_key", appKey);
      }

      const res = await fetch(`/api/jobs/adzuna?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setJobs(data.data);
          setIsLiveAdzuna(!!data.isLive);
          setStatusNotice(data.message || "");
          return;
        }
      }
      // Fallback
      setJobs(DEFAULT_LOWONGAN);
      setIsLiveAdzuna(false);
    } catch (err) {
      console.warn("Gagal memuat lowongan:", err);
      setJobs(DEFAULT_LOWONGAN);
      setIsLiveAdzuna(false);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, searchLocation]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchJobs();
    });

    const handleUpdate = () => {
      fetchJobs();
    };

    window.addEventListener("sm_adzuna_updated", handleUpdate);
    return () => window.removeEventListener("sm_adzuna_updated", handleUpdate);
  }, [fetchJobs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const filteredJobs = jobs.filter((j) => {
    if (selectedType !== "all") {
      if (selectedType === "Magang" && !j.tipe.toLowerCase().includes("magang")) return false;
      if (selectedType === "Part-time" && !j.tipe.toLowerCase().includes("part")) return false;
      if (selectedType === "Freelance" && !j.tipe.toLowerCase().includes("free")) return false;
    }
    if (j.jam > maxHours) return false;
    return true;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Banner Utama */}
      <div className="rounded-3xl bg-linear-to-br from-blue-600 via-indigo-700 to-slate-900 p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Pusat Karir Mahasiswa & Magang</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lowongan Magang & Part-Time
          </h1>
          <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
            Dapatkan pengalaman kerja riil dan penghasilan tambahan yang fleksibel dengan jadwal perkuliahan.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 border border-white/20"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>{isLiveAdzuna ? "API Adzuna: Terhubung" : "Atur Kunci API Adzuna"}</span>
            </button>

            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-sm text-blue-100 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-300" />
              <span>Sumber: {isLiveAdzuna ? "Live Adzuna API" : "Dataset Kaggle Jobs"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bar Pencarian Lowongan (Keyword & Lokasi) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari posisi: Magang UI/UX, Barista, Desain, Admin..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
            />
          </div>

          <div className="relative sm:w-56">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lokasi (Tasikmalaya, Bandung, WFA)..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Mencari..." : "Cari Lowongan"}</span>
          </button>
        </form>

        {/* Filter Chips & Jam Kerja */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {["all", "Magang", "Part-time", "Freelance"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedType === t
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {t === "all" ? "Semua Tipe" : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Batas Jam:</span>
            <select
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
              className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>Maks 15 jam/minggu (Santai)</option>
              <option value={25}>Maks 25 jam/minggu (Standar Kuliah)</option>
              <option value={40}>Semua Jam Kerja (s.d. 40 jam)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notice info */}
      {statusNotice && (
        <div className="px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between">
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            {statusNotice}
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredJobs.length} Lowongan Ditemukan
          </span>
        </div>
      )}

      {/* Grid Lowongan Kerja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Badge Tipe & Jam & Sumber */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${
                      job.tipe.toLowerCase().includes("part")
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                        : job.tipe.toLowerCase().includes("free")
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        : "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {job.tipe}
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                    {job.sumber === "adzuna" ? "Live Adzuna" : "Kaggle Dataset"}
                  </span>
                </div>

                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.jam} jam / minggu
                </span>
              </div>

              {/* Posisi & Perusahaan */}
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                  {job.posisi}
                </h3>
                {job.perusahaan && (
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 shrink-0" /> {job.perusahaan}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {job.lokasi}
                </p>
              </div>

              {/* Gaji */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estimasi Gaji / Upah Saku:
                </span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                  {formatRupiah(job.gaji)}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500"> / bulan</span>
                </span>
              </div>

              {/* Syarat / Deskripsi */}
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/40 p-3 rounded-2xl leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-200">Kualifikasi: </span>
                {job.syarat}
              </p>
            </div>

            {/* Tombol Lamar */}
            <div className="pt-4 flex gap-2">
              {job.url_lamar && job.url_lamar.startsWith("http") && !job.url_lamar.includes("wa.me") ? (
                <a
                  href={job.url_lamar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Lamar di Portal Kerja</span>
                </a>
              ) : (
                <a
                  href={`https://wa.me/${job.hrd || "6281234567890"}?text=${encodeURIComponent(
                    `Halo HRD ${job.perusahaan || ""}, saya mahasiswa dan tertarik melamar posisi "${job.posisi}" yang tertera di aplikasi Sahabat Mahasiswa. Apakah posisi ini masih terbuka?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Lamar via WhatsApp HRD</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            Tidak Ada Lowongan yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian, filter jam kerja, atau atur API Adzuna untuk memuat lebih banyak lowongan se-Indonesia.
          </p>
        </div>
      )}

      {/* Adzuna Config Modal */}
      <AdzunaConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSavedSuccess={() => fetchJobs()}
      />
    </div>
  );
}
