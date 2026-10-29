"use client";

import React, { useState, useEffect } from "react";
import { Kosan } from "@/lib/types";
import {
  DEFAULT_KOSAN,
  calculateDistance,
  getCoordinatesForLocation,
  UNIVERSITAS_LIST,
} from "@/lib/data";
import { formatWhatsAppUrl } from "@/lib/launcher";
import { apiClient } from "@/lib/api-client";
import KosanDetailModal from "./KosanDetailModal";
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
  Star,
  Database,
  Map,
  Settings,
  X,
  ExternalLink,
} from "lucide-react";

interface KosanTabProps {
  onOpenProfile?: () => void;
}

export default function KosanTab({ onOpenProfile }: KosanTabProps) {
  const [kosanList, setKosanList] = useState<Kosan[]>(DEFAULT_KOSAN);
  const [selectedKosan, setSelectedKosan] = useState<Kosan | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification(null);
    }, 3500);
  };

  // State profil kampus pengguna dari Pengaturan / Profil
  const [userProfileCampus, setUserProfileCampus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedProfile = localStorage.getItem("sm_user_profile_cache");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.kampus && parsed.kampus.trim()) return parsed.kampus.trim();
        }
      } catch {}
    }
    return "Universitas Siliwangi (UNSIL)";
  });
  const [activeLocationMode, setActiveLocationMode] = useState<"campus" | "gps" | "custom">("campus");

  // State koordinat titik acuan aktif
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    area: string;
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedProfile = localStorage.getItem("sm_user_profile_cache");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.kampus && parsed.kampus.trim()) {
            return getCoordinatesForLocation(parsed.kampus);
          }
        }
      } catch {}
    }
    return getCoordinatesForLocation("Universitas Siliwangi (UNSIL)");
  });

  const [customCampusInput, setCustomCampusInput] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<string>("all");
  const [maxHarga, setMaxHarga] = useState<number>(2500000);
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance");

  // PENGATURAN RADIUS JARAK (Opsi: 1 KM, 3 KM, 5 KM, 10 KM, 20 KM, Semua)
  const [maxRadius, setMaxRadius] = useState<number | "all">(10);

  // 1. Dengarkan pembaruan profil pengguna dari Pengaturan
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const cachedProfile = localStorage.getItem("sm_user_profile_cache");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.kampus && parsed.kampus.trim()) {
            setUserProfileCampus(parsed.kampus.trim());
            setCurrentLocation(getCoordinatesForLocation(parsed.kampus));
            showNotification(`Titik acuan diperbarui ke ${parsed.kampus.trim()}`);
          }
        }
      } catch {}
    };

    window.addEventListener("sm_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("sm_profile_updated", handleProfileUpdate);
  }, []);

  // Handler: Gunakan Lokasi Kampus yang sudah disetting di Pengaturan
  const handleUseProfileCampus = () => {
    setActiveLocationMode("campus");
    const coords = getCoordinatesForLocation(userProfileCampus);
    setCurrentLocation(coords);
    setCustomCampusInput("");
    showNotification(`Titik acuan: ${userProfileCampus}`);
  };

  // Handler: Input nama kampus manual
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
      showNotification("Sensor GPS tidak tersedia di browser Anda.");
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
          area: "Koordinat GPS Pengguna",
        });
        setActiveLocationMode("gps");
        setGpsLoading(false);
        showNotification("Titik acuan disetel ke posisi GPS saat ini.");
      },
      (err) => {
        setGpsLoading(false);
        showNotification(`Gagal mengambil GPS: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 2. Fetch kosan dari API database
  useEffect(() => {
    const fetchKosan = async () => {
      try {
        const res = await apiClient.getKosan({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          tipe: selectedTipe === "all" ? undefined : selectedTipe,
          maxHarga: maxHarga,
        });

        if (res && res.length > 0) {
          setKosanList(res);
        }
      } catch (err) {
        console.warn("Gagal memuat API kosan, menggunakan data lokal:", err);
      }
    };

    fetchKosan();
  }, [currentLocation.lat, currentLocation.lng, selectedTipe, maxHarga, maxRadius]);

  // Hitung ulang jarak dinamis dari currentLocation aktif
  const kosanWithDistance = kosanList.map((k) => {
    if (k.lat && k.lng) {
      const dist = calculateDistance(currentLocation.lat, currentLocation.lng, k.lat, k.lng);
      return { ...k, jarak: dist };
    }
    return k;
  });

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
    <div className="space-y-4 pb-20">
      {/* Toast Notification Banner */}
      {statusNotification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700 dark:border-slate-200 text-center max-w-[90vw]">
          {statusNotification}
        </div>
      )}

      {/* 1. HERO BANNER: GROUNDED SURFACE (NO GAUDY GRADIENTS, FLAT RESTING PANEL) */}
      <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-5 sm:p-6 space-y-3.5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium mb-2 border border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Radius kosan berdasarkan titik kampus
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            Cari Kos Dekat Kampus Anda
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Menampilkan kosan terdekat (maksimal <span className="tabular-nums font-semibold text-slate-200">{maxRadius === "all" ? "Semua Jarak" : `${maxRadius} KM`}</span>) dari titik acuan yang dipilih.
          </p>
        </div>

        {/* OPSI PILIHAN LOKASI */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Pilih Titik Lokasi Acuan:</span>
            {activeLocationMode === "custom" && (
              <button
                type="button"
                onClick={handleUseProfileCampus}
                className="text-xs underline text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Kembalikan ke profil kampus
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* TOMBOL 1: PILIHAN KAMPUS PROFIL */}
            <button
              type="button"
              onClick={handleUseProfileCampus}
              className={`p-3 rounded-xl text-left border transition-colors relative flex items-start gap-3 cursor-pointer ${
                activeLocationMode === "campus"
                  ? "bg-slate-800 text-white border-slate-500"
                  : "bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800/60"
              }`}
            >
              <School className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
              <div className="truncate flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-400">
                    Profil Kampus
                  </span>
                  {onOpenProfile && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile();
                      }}
                      title="Ganti kampus di Profil"
                      className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" /> Ganti
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-white truncate mt-0.5">
                  {userProfileCampus}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  Klik untuk gunakan lokasi ini
                </div>
              </div>
              {activeLocationMode === "campus" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              )}
            </button>

            {/* TOMBOL 2: DETEKSI GPS REAL-TIME */}
            <button
              type="button"
              onClick={handleGetLiveGPS}
              disabled={gpsLoading}
              className={`p-3 rounded-xl text-left border transition-colors relative flex items-start gap-3 cursor-pointer ${
                activeLocationMode === "gps"
                  ? "bg-slate-800 text-white border-slate-500"
                  : "bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800/60"
              }`}
            >
              <Navigation className={`w-5 h-5 text-slate-300 shrink-0 mt-0.5 ${gpsLoading ? "animate-spin" : ""}`} />
              <div className="truncate flex-1">
                <div className="text-xs font-semibold text-slate-400">
                  Sensor Perangkat
                </div>
                <div className="text-sm font-semibold text-white truncate mt-0.5">
                  {gpsLoading ? "Mendeteksi GPS..." : "Lokasi GPS Saya Saat Ini"}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  Hitung dari posisimu sekarang
                </div>
              </div>
              {activeLocationMode === "gps" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              )}
            </button>
          </div>

          {/* INPUT CARI NAMA KAMPUS MANUAL */}
          <div>
            <div className="relative">
              <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                list="kampus-suggestions"
                value={customCampusInput}
                onChange={(e) => handleSelectCustomCampus(e.target.value)}
                placeholder="Ketik atau ganti nama kampus lain (contoh: UNSIL, ITB, UI, Cipedes, Sukamanah)..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 rounded-xl text-sm font-normal text-white placeholder-slate-500 border border-slate-700 outline-none focus:border-slate-400"
              />
              {customCampusInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomCampusInput("");
                    handleUseProfileCampus();
                  }}
                  title="Hapus pencarian kampus"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
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
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                Titik Acuan: <strong className="text-white font-medium">{currentLocation.name}</strong>
              </span>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
              {currentLocation.lat.toFixed(3)}, {currentLocation.lng.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PENGATURAN JARAK RADIUS & SEARCH */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5">
        {/* Search Input Kosan */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kos, fasilitas (WiFi, AC, Kamar Mandi Dalam)..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm font-normal text-slate-800 dark:text-slate-200 outline-none focus:border-slate-400 border border-slate-200 dark:border-slate-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Reset pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* PENGATURAN RADIUS JARAK & URUTAN */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* RADIUS BUTTONS: 1 KM, 3 KM, 5 KM, 10 KM, 20 KM, SEMUA */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 mr-1">
              <Compass className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Radius:
            </span>

            {[
              { val: 1, label: "1 KM" },
              { val: 3, label: "3 KM" },
              { val: 5, label: "5 KM" },
              { val: 10, label: "10 KM (Default)" },
              { val: 20, label: "20 KM" },
              { val: "all", label: "Semua Jarak" },
            ].map((r) => {
              const isSelected = maxRadius === r.val;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => {
                    setMaxRadius(r.val as number | "all");
                    showNotification(`Radius disetel ke ${r.label}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer tabular-nums ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
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
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "distance" | "price")}
                className="text-sm font-medium bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="distance">Terdekat</option>
                <option value="price">Termurah</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={maxHarga}
                onChange={(e) => setMaxHarga(Number(e.target.value))}
                className="text-sm font-medium bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer tabular-nums"
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
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
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
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedTipe === t.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Total Temuan Info */}
          <div className="ml-auto text-sm font-medium text-slate-600 dark:text-slate-400 tabular-nums">
            Ditemukan: <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{filteredKosan.length}</span> Kosan
          </div>
        </div>
      </div>

      {/* 3. GRID DAFTAR KOSAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredKosan.map((kos) => {
          const mapDirectionUrl = `https://www.google.com/maps/dir/?api=1&destination=${kos.lat},${kos.lng}`;
          const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${kos.lat},${kos.lng}`;
          const waUrl = formatWhatsAppUrl(
            kos.telp,
            `Halo pengelola ${kos.nama}, saya melihat info kosan ini di aplikasi Sahabat Mahasiswa (jarak: ${kos.jarak ?? 0} km dari ${currentLocation.name}). Apakah saat ini masih ada kamar yang tersedia?`
          );

          return (
            <div
              key={kos.id}
              onClick={() => setSelectedKosan(kos)}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Photo & Badges */}
                <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={kos.foto_url}
                    alt={kos.nama}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Tipe Badge & Sumber (Sentence Case, Readable 12-13px) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[75%]">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-md text-white ${
                        kos.tipe === "putri"
                          ? "bg-rose-700"
                          : kos.tipe === "putra"
                          ? "bg-blue-700"
                          : "bg-emerald-700"
                      }`}
                    >
                      Kos {kos.tipe === "putri" ? "putri" : kos.tipe === "putra" ? "putra" : "campur"}
                    </span>

                    {kos.sumber === "mamikos_kaggle" && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-900/80 text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mamikos Kaggle</span>
                      </span>
                    )}
                  </div>

                  {/* Rating Badge Top Right */}
                  <div className="absolute top-3 right-3 bg-slate-950/80 text-amber-300 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="tabular-nums">{kos.rating || 4.8}</span>
                  </div>

                  {/* Jarak GPS / Kampus Badge */}
                  {kos.jarak !== undefined && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 border border-slate-700 tabular-nums">
                      <Navigation className="w-3.5 h-3.5 text-slate-300" />
                      <span className="tabular-nums">{kos.jarak} km</span>
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatRupiah(kos.harga)}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium ml-1">/ bulan</span>
                    </div>

                    {kos.sisa_kamar && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 tabular-nums">
                        Sisa {kos.sisa_kamar} kamar
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {kos.nama}
                  </h3>

                  {/* Lokasi Kos & Buka di Google Maps */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                            {kos.area}
                          </p>
                          {kos.lat && kos.lng && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                              Koordinat: {kos.lat.toFixed(4)}, {kos.lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={mapSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Buka titik koordinat di Google Maps"
                        className="shrink-0 px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Map className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        <span>Pin Maps</span>
                      </a>
                    </div>
                  </div>

                  {/* Fasilitas */}
                  <div className="pt-0.5 flex flex-wrap gap-1.5">
                    {kos.fasilitas.slice(0, 4).map((f, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {f}
                      </span>
                    ))}
                    {kos.fasilitas.length > 4 && (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1 py-0.5 tabular-nums">
                        +{kos.fasilitas.length - 4} fasilitas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Rute Google Maps & Chat WA */}
              <div className="p-4 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={mapDirectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span>Rute Maps</span>
                  </a>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Chat WA</span>
                  </a>
                </div>

                <div className="text-center">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors">
                    Lihat detail & foto lengkap <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. EMPTY STATE */}
      {filteredKosan.length === 0 && (
        <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Tidak Ada Kosan dalam Jarak {maxRadius === "all" ? "" : `${maxRadius} KM`}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Kosan dalam radius {maxRadius === "all" ? "pilihan" : `${maxRadius} KM`} dari <strong>{currentLocation.name}</strong> belum ditemukan. Coba perbesar jarak radius pencarian:
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMaxRadius(10)}
              className="px-3.5 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Perluas Radius ke 10 KM
            </button>
            <button
              type="button"
              onClick={() => setMaxRadius(20)}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Perluas ke 20 KM
            </button>
            <button
              type="button"
              onClick={() => setMaxRadius("all")}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tampilkan Semua Jarak
            </button>
          </div>
        </div>
      )}

      {/* Kosan Detail Modal */}
      <KosanDetailModal
        isOpen={!!selectedKosan}
        onClose={() => setSelectedKosan(null)}
        kosan={selectedKosan}
        currentLocationName={currentLocation.name}
      />
    </div>
  );
}
