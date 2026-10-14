"use client";

import React, { useState } from "react";
import { DEFAULT_LOWONGAN } from "@/lib/data";
import { Briefcase, Clock, MapPin, MessageCircle, DollarSign, Sparkles } from "lucide-react";

export default function KerjaTab() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [maxHours, setMaxHours] = useState<number>(40);

  const filteredJobs = DEFAULT_LOWONGAN.filter((j) => {
    if (selectedType !== "all" && j.tipe !== selectedType) return false;
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
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" /> Fleksibel Ramah Jadwal Kuliah
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lowongan Part-Time & Magang
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Cari penghasilan tambahan dan pengalaman kerja tanpa mengorbankan waktu kelas.
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "Part-time", "Freelance", "Magang"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                selectedType === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {t === "all" ? "Semua Tipe" : t}
            </button>
          ))}
        </div>

        <select
          value={maxHours}
          onChange={(e) => setMaxHours(Number(e.target.value))}
          className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={10}>Maks 10 jam / minggu (Sangat Santai)</option>
          <option value={20}>Maks 20 jam / minggu (Standar)</option>
          <option value={40}>Semua Jam Kerja (Hingga 40 jam)</option>
        </select>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                    job.tipe === "Part-time"
                      ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                      : job.tipe === "Freelance"
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                      : "bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  {job.tipe}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {job.jam} jam / minggu
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  {job.posisi}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {job.lokasi}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[11px] text-slate-400 block font-medium">Estimasi Gaji / Upah:</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(job.gaji)}
                  <span className="text-xs font-normal text-slate-400"> / bulan</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/30 p-2.5 rounded-xl leading-relaxed">
                <span className="font-bold text-slate-700 dark:text-slate-200">Kualifikasi: </span>
                {job.syarat}
              </p>
            </div>

            <div className="pt-4">
              <a
                href={`https://wa.me/${job.hrd}?text=${encodeURIComponent(
                  `Halo HRD, saya mahasiswa dan tertarik melamar posisi "${job.posisi}" yang tertera di aplikasi Sahabat Mahasiswa. Apakah posisi ini masih terbuka?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Lamar via WhatsApp HRD</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
