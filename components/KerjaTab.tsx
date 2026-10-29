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
  Heart,
  Coffee,
  Code,
  Layout,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import AdzunaConfigModal from "./AdzunaConfigModal";

export default function KerjaTab() {
  const [jobs, setJobs] = useState<LowonganKerja[]>(DEFAULT_LOWONGAN);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isLiveAdzuna, setIsLiveAdzuna] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sm_job_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem("sm_job_favorites", JSON.stringify(updated));
    } catch {}
  };

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
          return;
        }
      }
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

    if (selectedCategory !== "all") {
      const q = selectedCategory.toLowerCase();
      const matchRole = j.posisi.toLowerCase().includes(q) || j.syarat.toLowerCase().includes(q);
      if (!matchRole) return false;
    }

    return true;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const categoryRail = [
    { id: "all", label: "Semua Posisi", icon: Briefcase },
    { id: "developer", label: "IT & Tech", icon: Code },
    { id: "desain", label: "Design & UI/UX", icon: Layout },
    { id: "marketing", label: "Marketing & Sosmed", icon: Flame },
    { id: "barista", label: "FnB & Barista", icon: Coffee },
    { id: "admin", label: "Admin & Data", icon: Database },
  ] as const;

  return (
    <div className="space-y-6 pb-24">
      {/* 1. HORIZONTAL ICON CATEGORY RAIL (Hide.com style) */}
      <div className="pt-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-7 sm:gap-9 overflow-x-auto no-scrollbar pb-3">
          {categoryRail.map((item) => {
            const Icon = item.icon;
            const isActive = selectedCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedCategory(item.id)}
                className={`flex flex-col items-center gap-1.5 shrink-0 transition-all cursor-pointer relative py-1 group ${
                  isActive
                    ? "text-rose-500 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`w-6 h-6 stroke-[1.6] transition-transform group-hover:scale-110 ${
                    isActive ? "stroke-rose-500" : "stroke-current"
                  }`}
                />
                <span className="text-xs whitespace-nowrap tracking-tight">
                  {item.label}
                </span>

                {/* Active Indicator Underline */}
                {isActive && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-FILTER PILLS & SEARCH TOOLBAR (Hide.com style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {["all", "Magang", "Part-time", "Freelance"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === t
                  ? "border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t === "all" ? "Semua Tipe" : t}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>{isLiveAdzuna ? "API Aktif" : "API Adzuna"}</span>
          </button>
        </div>

        {/* Right: Search Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari UI/UX, Barista..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none w-36 sm:w-48 focus:border-rose-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Cari"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </form>
      </div>

      {/* 3. 4-COLUMN LUXURY OPPORTUNITY CARD GRID (Hide.com style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredJobs.map((j) => {
          const isFav = favorites.includes(String(j.id));
          const waUrl = j.hrd
            ? formatWhatsAppUrl(
                j.hrd,
                `Halo ${j.perusahaan || "HRD"}, saya mahasiswa yang tertarik melamar lowongan ${j.posisi} (${j.tipe}) yang tercantum di aplikasi Sahabat Mahasiswa. Apakah posisi ini masih terbuka?`
              )
            : "";

          // Elegant visual image representation for each industry
          const jobBanner =
            j.tipe.toLowerCase().includes("magang")
              ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
              : j.posisi.toLowerCase().includes("barista") || j.posisi.toLowerCase().includes("cafe")
              ? "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80"
              : "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80";

          return (
            <div
              key={j.id}
              className="group flex flex-col cursor-pointer transition-all duration-300"
            >
              {/* Image Container (4:3 rounded) */}
              <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xs mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={jobBanner}
                  alt={j.perusahaan}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Top-Left Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-xs">
                    {j.tipe}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white shadow-xs">
                    {j.jam} Jam/mgg
                  </span>
                </div>

                {/* Top-Right Heart */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, String(j.id))}
                  title={isFav ? "Hapus dari favorit" : "Simpan ke favorit"}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-500 transition-transform active:scale-90 shadow-xs cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isFav ? "fill-rose-500 text-rose-500" : "text-slate-700 dark:text-slate-300"
                    }`}
                  />
                </button>
              </div>

              {/* Details Below Image */}
              <div className="flex-1 flex flex-col justify-between space-y-1.5">
                {/* Company Name */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {j.perusahaan}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{j.lokasi}</span>
                  </span>
                </div>

                {/* Job Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-rose-500 transition-colors">
                  {j.posisi}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {j.syarat}
                </p>

                {/* Price (Stipend) & Action Row */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                  <div>
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatRupiah(j.gaji)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/ bln</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {j.url_lamar ? (
                      <a
                        href={j.url_lamar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>Adzuna</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Lamar WA</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-400 max-w-md mx-auto shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <div className="font-bold text-slate-900 dark:text-white text-base">
            Tidak Ada Lowongan Ditemukan
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coba ganti filter tipe pekerjaan atau gunakan kata kunci lain.
          </p>
        </div>
      )}

      {/* Adzuna API Config Modal */}
      <AdzunaConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSavedSuccess={fetchJobs}
      />
    </div>
  );
}
