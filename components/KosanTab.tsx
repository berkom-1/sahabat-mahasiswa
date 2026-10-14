"use client";

import React, { useState, useEffect } from "react";
import { Kosan } from "@/lib/types";
import { DEFAULT_KOSAN, calculateDistance, LOKASI_PRESETS, detectClosestAreaName } from "@/lib/data";
import {
  MapPin,
  Navigation,
  MessageCircle,
  Filter,
  Check,
  Sparkles,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  ArrowUpDown,
  Search,
} from "lucide-react";

export default function KosanTab() {
  const [userLocation, setUserLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>("Memuat lokasi...");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<string>("all");
  const [maxHarga, setMaxHarga] = useState<number>(2500000);
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance");

  // PENGATURAN RADIUS JARAK (Default 10 KM, opsi: 10, 20, 30, atau all)
  const [maxRadius, setMaxRadius] = useState<number | "all">(10);

  // Set default initial location: Cipedes (Tasikmalaya) atau dari localStorage
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem("sm_last_location");
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        setUserLocation(parsed);
        setGpsStatus(`📍 Titik acuan: ${parsed.name}`);
        return;
      }
    } catch (_) {}

    // Default ke Cipedes (Tasikmalaya) sesuai kebutuhan pengguna
    const defaultPreset = LOKASI_PRESETS[0]; // Cipedes
    setUserLocation(defaultPreset);
    setGpsStatus(`📍 Titik acuan: ${defaultPreset.name}`);
  }, []);

  // Geolocation handler (GPS Real-time)
  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("Browser tidak mendukung sensor GPS.");
      return;
    }
    setGpsLoading(true);
    setGpsStatus("Mendeteksi satelit GPS perangkat Anda...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const areaName = detectClosestAreaName(lat, lng);
        const locObj = { name: areaName, lat, lng };

        setUserLocation(locObj);
        setGpsLoading(false);
        setGpsStatus(`📍 GPS Akurat: ${areaName}`);
        try {
          localStorage.setItem("sm_last_location", JSON.stringify(locObj));
        } catch (_) {}
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus("GPS tidak aktif / diblokir. Menggunakan acuan wilayah terdekat.");
        console.warn("GPS Error:", err.message);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setUserLocation(preset);
    setGpsStatus(`📍 Titik acuan: ${preset.name}`);
    try {
      localStorage.setItem("sm_last_location", JSON.stringify(preset));
    } catch (_) {}
  };

  // Hitung jarak Haversine untuk seluruh data kosan
  const kosanWithDistance = DEFAULT_KOSAN.map((k) => {
    const jarak = userLocation
      ? calculateDistance(userLocation.lat, userLocation.lng, k.lat, k.lng)
      : undefined;
    return { ...k, jarak };
  });

  // Filter: Tipe, Budget, Pencarian Text, dan STRICT RADIUS FILTER (Default <= 10 km)
  const filteredKosan = kosanWithDistance
    .filter((k) => {
      // Filter tipe kamar (putra/putri/campur)
      if (selectedTipe !== "all" && k.tipe !== selectedTipe) return false;

      // Filter harga maksimal
      if (k.harga > maxHarga) return false;

      // Filter teks pencarian (nama atau area)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = k.nama.toLowerCase().includes(q);
        const matchArea = k.area.toLowerCase().includes(q);
        const matchFasilitas = k.fasilitas.some((f) => f.toLowerCase().includes(q));
        if (!matchNama && !matchArea && !matchFasilitas) return false;
      }

      // FILTER RADIUS JARAK (10KM, 20KM, 30KM, atau SEMUA)
      if (maxRadius !== "all" && k.jarak !== undefined) {
        if (k.jarak > maxRadius) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        return (a.jarak ?? 9999) - (b.jarak ?? 9999);
      }
      return a.harga - b.harga;
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
      {/* 1. HERO BANNER GPS & TITIK PUSAT ACUAN */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 p-6 sm:p-7 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Radius Terdekat Akurat (Haversine Formula)
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Cari Kosan Terdekat di Sekitarmu
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Filter otomatis kosan dalam radius <strong>maksimal {maxRadius === "all" ? "Semua Jarak" : `${maxRadius} KM`}</strong> dari titik posisimu saat ini.
          </p>

          {/* Quick Location Pills & GPS Detection */}
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-indigo-700 font-extrabold text-xs shadow-md hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-75"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                {gpsLoading ? "Mencari Sinyal GPS..." : "Deteksi GPS Otomatis"}
              </button>

              {/* Area Presets (Cipedes, Sukamanah, UNSIL, dll.) */}
              {LOKASI_PRESETS.map((preset) => {
                const isActive =
                  userLocation?.lat === preset.lat && userLocation?.lng === preset.lng;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all ${
                      isActive
                        ? "bg-amber-400 text-slate-950 shadow-md ring-2 ring-white/80 scale-105"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    📍 {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Status Lokasi Terpilih */}
            <div className="p-2.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 flex items-center justify-between gap-2 text-xs text-indigo-100">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-semibold truncate">{gpsStatus}</span>
              </div>
              <span className="text-[11px] font-mono opacity-80 shrink-0">
                {userLocation ? `${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}` : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PENGATURAN JARAK RADIUS (10KM, 20KM, 30KM, SEMUA) & SEARCH */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kos, jalan, atau fasilitas (misal: Cipedes, Sukamanah, AC, WiFi)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-slate-700"
          />
        </div>

        {/* PENGATURAN RADIUS JARAK & URUTAN */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* RADIUS BUTTONS: 10 KM, 20 KM, 30 KM, SEMUA */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mr-1">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Radius Jarak:
            </span>

            {[
              { val: 10, label: "10 KM (Default)" },
              { val: 20, label: "20 KM" },
              { val: 30, label: "30 KM" },
              { val: "all", label: "Semua Jarak" },
            ].map((r) => {
              const isSelected = maxRadius === r.val;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setMaxRadius(r.val as number | "all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Sorter & Budget */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "distance" | "price")}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="distance">Terdekat (GPS)</option>
                <option value="price">Termurah</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={maxHarga}
                onChange={(e) => setMaxHarga(Number(e.target.value))}
                className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value={700000}>Maks Rp700 rb/bln</option>
                <option value={1000000}>Maks Rp1.0 jt/bln</option>
                <option value={1500000}>Maks Rp1.5 jt/bln</option>
                <option value={2500000}>Semua Budget</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tipe Kamar Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Tipe:
          </span>
          {[
            { id: "all", label: "Semua Kosan" },
            { id: "putra", label: "Khusus Putra" },
            { id: "putri", label: "Khusus Putri" },
            { id: "campur", label: "Campur" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTipe(t.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                selectedTipe === t.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Indicator Info Total Temuan */}
          <div className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Ditemukan: {filteredKosan.length} Kosan
          </div>
        </div>
      </div>

      {/* 3. GRID DAFTAR KOSAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredKosan.map((kos) => (
          <div
            key={kos.id}
            className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Photo & Badges */}
              <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kos.foto_url}
                  alt={kos.nama}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Tipe Badge */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span
                    className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full text-white shadow-md ${
                      kos.tipe === "putri"
                        ? "bg-rose-500"
                        : kos.tipe === "putra"
                        ? "bg-blue-600"
                        : "bg-emerald-600"
                    }`}
                  >
                    Kos {kos.tipe}
                  </span>
                </div>

                {/* Jarak GPS Badge */}
                {kos.jarak !== undefined && (
                  <div
                    className={`absolute bottom-3 right-3 backdrop-blur-md text-white text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg ${
                      kos.jarak <= 1.5
                        ? "bg-emerald-600/90 ring-1 ring-emerald-300"
                        : kos.jarak <= 5.0
                        ? "bg-indigo-600/90"
                        : "bg-slate-900/85"
                    }`}
                  >
                    <Navigation className="w-3 h-3 text-amber-300" />
                    <span>{kos.jarak} km</span>
                  </div>
                )}
              </div>

              {/* Body Details */}
              <div className="p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(kos.harga)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ bulan</span>
                </div>

                <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {kos.nama}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">{kos.area}</span>
                </p>

                {/* Fasilitas */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {kos.fasilitas.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <Check className="w-2.5 h-2.5 text-emerald-500" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* WA Button */}
            <div className="p-4 pt-0">
              <a
                href={`https://wa.me/${kos.telp}?text=${encodeURIComponent(
                  `Halo pengelola ${kos.nama}, saya melihat info kosan ini di aplikasi Sahabat Mahasiswa (posisi terdekat: ${kos.jarak ?? 0} km). Apakah saat ini masih ada kamar yang tersedia?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp Pemilik</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 4. EMPTY STATE DENGAN QUICK ACTION PERBESAR RADIUS */}
      {filteredKosan.length === 0 && (
        <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-2xl">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-base text-slate-800 dark:text-white">
              Tidak Ada Kosan dalam Radius {maxRadius === "all" ? "": `${maxRadius} KM`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Kosan terdekat dari <strong>{userLocation?.name || "lokasimu"}</strong> belum ditemukan dalam jarak maksimal {maxRadius} KM. Coba perbesar jangkauan radius di bawah ini:
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMaxRadius(20)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition"
            >
              Perluas Radius ke 20 KM
            </button>
            <button
              type="button"
              onClick={() => setMaxRadius(30)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Perluas ke 30 KM
            </button>
            <button
              type="button"
              onClick={() => setMaxRadius("all")}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Tampilkan Semua Jarak
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
