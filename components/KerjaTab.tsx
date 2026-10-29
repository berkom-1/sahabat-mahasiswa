"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LowonganKerja, AdzunaConfig } from "@/lib/types";
import { DEFAULT_LOWONGAN } from "@/lib/data";
import { formatWhatsAppUrl } from "@/lib/launcher";
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
    <div className="space-y-4 pb-20">
      {/* Banner Utama: Grounded Resting Dark Card */}
      <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-5 sm:p-6 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span>Pusat Karir Mahasiswa & Magang</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Lowongan Magang & Part-Time
        </h1>
        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
          Temukan pengalaman kerja nyata dan penghasilan tambahan yang fleksibel dengan jadwal perkuliahan.
        </p>

        <div className="pt-1 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-white flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{isLiveAdzuna ? "API Adzuna: Terhubung" : "Atur Kunci API Adzuna"}</span>
          </button>

          <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-950/80 text-slate-300 flex items-center gap-1.5 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sumber: {isLiveAdzuna ? "Live Adzuna API" : "Dataset Kaggle Jobs"}</span>
          </span>
        </div>
      </div>

      {/* Bar Pencarian Lowongan (Keyword & Lokasi) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari posisi: Magang UI/UX, Barista, Desain, Admin..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:border-slate-400 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="relative sm:w-56">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Lokasi (Tasikmalaya, Bandung, WFA)..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:border-slate-400 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedType === t
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {t === "all" ? "Semua Tipe" : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Batas Jam:</span>
            <select
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
              className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer"
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
        <div className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {statusNotice}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredJobs.length} Lowongan Ditemukan
          </span>
        </div>
      )}

      {/* Grid Lowongan Kerja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredJobs.map((job) => {
          const waUrl = formatWhatsAppUrl(
            job.hrd || "6281234567890",
            `Halo HRD ${job.perusahaan || ""}, saya mahasiswa dan tertarik melamar posisi "${job.posisi}" yang tertera di aplikasi Sahabat Mahasiswa. Apakah posisi ini masih terbuka?`
          );

          return (
            <div
              key={job.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Badge Tipe & Jam & Sumber */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                        job.tipe.toLowerCase().includes("part")
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          : job.tipe.toLowerCase().includes("free")
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                          : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                      }`}
                    >
                      {job.tipe}
                    </span>

                    <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {job.sumber === "adzuna" ? "Live Adzuna" : "Kaggle Dataset"}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> <span className="tabular-nums">{job.jam} jam</span> / minggu
                  </span>
                </div>

                {/* Posisi & Perusahaan */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {job.posisi}
                  </h3>
                  {job.perusahaan && (
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {job.perusahaan}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {job.lokasi}
                  </p>
                </div>

                {/* Gaji */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                    Estimasi Gaji / Upah Saku:
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatRupiah(job.gaji)}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/ bulan</span>
                  </span>
                </div>

                {/* Syarat / Deskripsi */}
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/40 p-3 rounded-xl leading-relaxed border border-slate-200/60 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">Kualifikasi: </strong>
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
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Lamar di Portal Kerja</span>
                  </a>
                ) : (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Lamar via WhatsApp HRD</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto">
          <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Tidak Ada Lowongan yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
