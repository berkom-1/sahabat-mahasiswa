"use client";

import React, { useState, useEffect } from "react";
import { Kosan } from "@/lib/types";
import {
  DEFAULT_KOSAN,
  calculateDistance,
  getCoordinatesForLocation,
  UNIVERSITAS_LIST,
} from "@/lib/data";
import { bukaUrlAman } from "@/lib/launcher";
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
  School,
  Settings,
  Star,
  Database,
  Map,
  ExternalLink,
} from "lucide-react";

export default function KosanTab() {
  // State profil kampus pengguna dari Pengaturan / Profil
  const [userProfileCampus, setUserProfileCampus] = useState<string>("Universitas Siliwangi (UNSIL)");
  const [activeLocationMode, setActiveLocationMode] = useState<"campus" | "gps" | "custom">("campus");

  // State koordinat titik acuan aktif
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    area: string;
  }>({
    name: "Universitas Siliwangi (UNSIL)",
    lat: -7.3512,
    lng: 108.2234,
    area: "Tasikmalaya",
  });

  const [customCampusInput, setCustomCampusInput] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<string>("all");
  const [maxHarga, setMaxHarga] = useState<number>(2500000);
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance");

  // PENGATURAN RADIUS JARAK (Default 10 KM, opsi: 10, 20, 30, atau all)
  const [maxRadius, setMaxRadius] = useState<number | "all">(10);

  // 1. Ambil kampus yang telah di-setting di Pengaturan / Profil pengguna
  useEffect(() => {
    try {
      const cachedProfile = localStorage.getItem("sm_user_profile_cache");
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.kampus && parsed.kampus.trim()) {
          setUserProfileCampus(parsed.kampus.trim());
          const coords = getCoordinatesForLocation(parsed.kampus);
          setCurrentLocation(coords);
          return;
        }
      }
    } catch (_) {}

    // Default jika belum ada pengaturan: UNSIL
    const defaultCoords = getCoordinatesForLocation("Universitas Siliwangi (UNSIL)");
    setCurrentLocation(defaultCoords);
  }, []);

  // Handler: Gunakan Lokasi Kampus yang sudah disetting di Pengaturan
  const handleUseProfileCampus = () => {
    setActiveLocationMode("campus");
    const coords = getCoordinatesForLocation(userProfileCampus);
    setCurrentLocation(coords);
    setCustomCampusInput("");
  };

  // Handler: Input nama kampus manual (contohnya: UNSIL, ITB, UI, Cipedes, Sukamanah)
  const handleSelectCustomCampus = (nama: string) => {
    setCustomCampusInput(nama);
    if (!nama.trim()) return;

    setActiveLocationMode("custom");
    const coords = getCoordinatesForLocation(nama);
    setCurrentLocation(coords);
  };

  // Handler: Geolocation GPS Real-time perangkat
  const handleGetLiveGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Perangkat Anda tidak mendukung sensor GPS.");
      return;
    }
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({
          name: "Lokasi GPS Saya Saat Ini",
          lat,
          lng,
          area: "GPS Real-time",
        });
        setActiveLocationMode("gps");
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        console.warn("GPS Error:", err.message);
        alert("Gagal mendeteksi GPS. Tetap menggunakan lokasi kampus acuan.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Hitung jarak Haversine ke titik acuan aktif
  const kosanWithDistance = DEFAULT_KOSAN.map((k) => {
    const jarak = calculateDistance(currentLocation.lat, currentLocation.lng, k.lat, k.lng);
    return { ...k, jarak };
  });

  // Filter: Tipe, Budget, Pencarian Text, dan RADIUS JARAK (Default <= 10 km)
  const filteredKosan = kosanWithDistance
    .filter((k) => {
      if (selectedTipe !== "all" && k.tipe !== selectedTipe) return false;
      if (k.harga > maxHarga) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = k.nama.toLowerCase().includes(q);
        const matchArea = k.area.toLowerCase().includes(q);
        const matchFasilitas = k.fasilitas.some((f) => f.toLowerCase().includes(q));
        if (!matchNama && !matchArea && !matchFasilitas) return false;
      }

      // STRICT RADIUS FILTER
      if (maxRadius !== "all" && k.jarak !== undefined) {
        if (k.jarak > maxRadius) return false;
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
      {/* 1. HERO BANNER: PILIHAN LOKASI KAMPUS PENGATURAN / INPUT KAMPUS */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 p-6 sm:p-7 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-2.5 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Radius Kosan Terdekat Berdasarkan Kampus
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Cari Kos Dekat Kampus Anda
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
              Menampilkan kosan terdekat (maksimal {maxRadius === "all" ? "Semua Jarak" : `${maxRadius} KM`}) dari titik kampus Anda.
            </p>
          </div>

          {/* OPSI PILIHAN LOKASI */}
          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
              <span>Pilih Titik Lokasi Acuan:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* TOMBOL 1: PILIHAN KAMPUS YANG SUDAH DI-SETTING DI PENGATURAN */}
              <button
                type="button"
                onClick={handleUseProfileCampus}
                className={`p-3 rounded-2xl text-left border transition-all relative flex items-center gap-3 ${
                  activeLocationMode === "campus"
                    ? "bg-white text-indigo-950 border-white shadow-lg ring-2 ring-amber-400"
                    : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    activeLocationMode === "campus"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/15 text-white"
                  }`}
                >
                  <School className="w-5 h-5" />
                </div>
                <div className="truncate flex-1">
                  <div className="text-[10px] uppercase font-black tracking-wider text-amber-500 dark:text-amber-400">
                    Pengaturan Profil Kamu
                  </div>
                  <div className="text-xs font-extrabold truncate">
                    {userProfileCampus}
                  </div>
                  <div className="text-[10px] opacity-75 truncate">
                    Gunakan lokasi kampus kamu
                  </div>
                </div>
                {activeLocationMode === "campus" && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 shrink-0" />
                )}
              </button>

              {/* TOMBOL 2: DETEKSI GPS REAL-TIME */}
              <button
                type="button"
                onClick={handleGetLiveGPS}
                disabled={gpsLoading}
                className={`p-3 rounded-2xl text-left border transition-all relative flex items-center gap-3 ${
                  activeLocationMode === "gps"
                    ? "bg-white text-indigo-950 border-white shadow-lg ring-2 ring-amber-400"
                    : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    activeLocationMode === "gps"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/15 text-white"
                  }`}
                >
                  <Navigation className={`w-4 h-4 ${gpsLoading ? "animate-spin" : ""}`} />
                </div>
                <div className="truncate flex-1">
                  <div className="text-[10px] uppercase font-black tracking-wider text-indigo-200">
                    Sensor Perangkat
                  </div>
                  <div className="text-xs font-extrabold truncate">
                    {gpsLoading ? "Mendeteksi GPS..." : "Lokasi GPS Saya Saat Ini"}
                  </div>
                  <div className="text-[10px] opacity-75 truncate">
                    Hitung dari posisimu sekarang
                  </div>
                </div>
                {activeLocationMode === "gps" && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 shrink-0" />
                )}
              </button>
            </div>

            {/* INPUT CARI NAMA KAMPUS MANUAL (CONTOH: UNSIL, ITB, UI, CIPEDES, SUKAMANAH) */}
            <div className="pt-1">
              <div className="relative">
                <School className="w-4 h-4 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  list="kampus-suggestions"
                  value={customCampusInput}
                  onChange={(e) => handleSelectCustomCampus(e.target.value)}
                  placeholder="Ketik atau ganti nama kampus lain (contoh: UNSIL, ITB, UI, Cipedes, Sukamanah)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/25 backdrop-blur-md rounded-2xl text-xs font-semibold text-white placeholder-white/60 border border-white/20 outline-none focus:ring-2 focus:ring-amber-400"
                />
                <datalist id="kampus-suggestions">
                  <option value="Universitas Siliwangi (UNSIL)" />
                  <option value="Cipedes (Tasikmalaya)" />
                  <option value="Sukamanah (Tasikmalaya)" />
                  {UNIVERSITAS_LIST.map((u, i) => (
                    <option key={i} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* STATUS TITIK ACUAN AKTIF */}
            <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs text-indigo-100">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-semibold truncate">
                  Titik Acuan Aktif: <strong>{currentLocation.name}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono opacity-80 shrink-0">
                {currentLocation.lat.toFixed(3)}, {currentLocation.lng.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PENGATURAN JARAK RADIUS (10KM, 20KM, 30KM, SEMUA) & SEARCH */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        {/* Search Input Kosan */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kos, fasilitas (WiFi, AC, Kamar Mandi Dalam)..."
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
                <option value="distance">Terdekat</option>
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

          {/* Total Temuan Info */}
          <div className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Ditemukan: {filteredKosan.length} Kosan Terdekat
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

                {/* Tipe Badge & Sumber */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[70%]">
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

                  {kos.sumber === "mamikos_kaggle" && (
                    <span className="text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 shadow-sm flex items-center gap-1 border border-emerald-400/30">
                      <Database className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Mamikos Kaggle</span>
                    </span>
                  )}
                </div>

                {/* Rating Badge Top Right */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-amber-400/30">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{kos.rating || 4.8}</span>
                </div>

                {/* Jarak GPS / Kampus Badge */}
                {kos.jarak !== undefined && (
                  <div
                    className={`absolute bottom-3 right-3 backdrop-blur-md text-white text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg ${
                      kos.jarak <= 1.5
                        ? "bg-emerald-600/95 ring-1 ring-emerald-300"
                        : kos.jarak <= 5.0
                        ? "bg-indigo-600/95"
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
                  <div>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {formatRupiah(kos.harga)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium"> / bulan</span>
                  </div>

                  {kos.sisa_kamar && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                      Sisa {kos.sisa_kamar} kamar
                    </span>
                  )}
                </div>

                <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {kos.nama}
                </h3>

                {/* Lokasi Kos & Buka di Google Maps */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                          {kos.area}
                        </p>
                        {kos.lat && kos.lng && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Koordinat: {kos.lat.toFixed(4)}, {kos.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${kos.lat},${kos.lng}`;
                        bukaUrlAman(mapUrl);
                      }}
                      title="Buka titik koordinat di Google Maps"
                      className="shrink-0 px-2 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition active:scale-95 text-[10px] font-bold flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/50"
                    >
                      <Map className="w-3 h-3 text-indigo-500" />
                      <span>Pin Maps</span>
                    </button>
                  </div>
                </div>

                {/* Fasilitas */}
                <div className="pt-1 flex flex-wrap gap-1.5">
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

            {/* Action Buttons: Rute Google Maps & Chat WA */}
            <div className="p-4 pt-0 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${kos.lat},${kos.lng}`;
                  bukaUrlAman(mapUrl);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-black text-xs border border-indigo-200 dark:border-indigo-800/80 active:scale-95 transition-all shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                <span>Rute Maps</span>
              </button>

              <a
                href={`https://wa.me/${kos.telp}?text=${encodeURIComponent(
                  `Halo pengelola ${kos.nama}, saya melihat info kosan ini di aplikasi Sahabat Mahasiswa (jarak: ${kos.jarak ?? 0} km dari ${currentLocation.name}). Apakah saat ini masih ada kamar yang tersedia?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 4. EMPTY STATE */}
      {filteredKosan.length === 0 && (
        <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-2xl">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-base text-slate-800 dark:text-white">
              Tidak Ada Kosan dalam Jarak {maxRadius === "all" ? "": `${maxRadius} KM`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Kosan dalam radius {maxRadius} KM dari <strong>{currentLocation.name}</strong> belum ditemukan. Coba perbesar jarak radius pencarian:
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
