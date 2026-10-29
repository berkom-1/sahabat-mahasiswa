"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  SlidersHorizontal,
  AlertCircle,
  ArrowUpDown,
  School,
  Star,
  Heart,
  Home,
  User,
  Users,
  Crown,
  Wallet,
  Building2,
  Bed,
  ShowerHead,
  Zap,
} from "lucide-react";

interface KosanTabProps {
  onOpenProfile?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  maxRadius?: number | "all";
  setMaxRadius?: (r: number | "all") => void;
  currentLocation?: { name: string; lat: number; lng: number; area: string };
  setCurrentLocation?: (loc: { name: string; lat: number; lng: number; area: string }) => void;
  onGetLiveGPS?: () => void;
  gpsLoading?: boolean;
}

export default function KosanTab({
  searchQuery: externalSearchQuery,
  maxRadius: externalMaxRadius,
  setMaxRadius: setExternalMaxRadius,
  currentLocation: externalCurrentLocation,
  setCurrentLocation: setExternalCurrentLocation,
  onGetLiveGPS: externalGetLiveGPS,
  gpsLoading: externalGpsLoading,
}: KosanTabProps) {
  const [kosanList, setKosanList] = useState<Kosan[]>(DEFAULT_KOSAN);
  const [selectedKosan, setSelectedKosan] = useState<Kosan | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage asynchronously to avoid cascading renders
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sm_kos_favorites");
      if (saved) {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => {
          setFavorites(parsed);
        });
      }
    } catch {}
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem("sm_kos_favorites", JSON.stringify(updated));
    } catch {}
    showNotification(
      favorites.includes(id)
        ? "Dihapus dari kosan favorit"
        : "Disimpan ke kosan favorit"
    );
  };

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification(null);
    }, 3500);
  };

  const [, setActiveLocationMode] = useState<"campus" | "gps" | "custom">("campus");

  // State koordinat titik acuan aktif (internal fallback)
  const [internalLocation, setInternalLocation] = useState<{
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

  const currentLocation = externalCurrentLocation || internalLocation;
  const updateCurrentLocation = useCallback(
    (loc: { name: string; lat: number; lng: number; area: string }) => {
      if (setExternalCurrentLocation) setExternalCurrentLocation(loc);
      else setInternalLocation(loc);
    },
    [setExternalCurrentLocation]
  );

  const [customCampusInput, setCustomCampusInput] = useState<string>("");
  const [internalGpsLoading, setInternalGpsLoading] = useState(false);
  const gpsLoading = externalGpsLoading !== undefined ? externalGpsLoading : internalGpsLoading;

  // Search state
  const [internalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Radius state
  const [internalMaxRadius, setInternalMaxRadius] = useState<number | "all">(10);
  const maxRadius = externalMaxRadius !== undefined ? externalMaxRadius : internalMaxRadius;
  const setMaxRadius = setExternalMaxRadius || setInternalMaxRadius;

  // Category & Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTipe, setSelectedTipe] = useState<string>("all");
  const [onlyTopRated, setOnlyTopRated] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [maxHarga, setMaxHarga] = useState<number>(2500000);
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance");
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // 1. Dengarkan pembaruan profil pengguna dari Pengaturan
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const cachedProfile = localStorage.getItem("sm_user_profile_cache");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.kampus && parsed.kampus.trim()) {
            updateCurrentLocation(getCoordinatesForLocation(parsed.kampus));
            showNotification(`Titik acuan diperbarui ke ${parsed.kampus.trim()}`);
          }
        }
      } catch {}
    };

    window.addEventListener("sm_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("sm_profile_updated", handleProfileUpdate);
  }, [updateCurrentLocation]);

  // Handler: Input nama kampus manual
  const handleSelectCustomCampus = (nama: string) => {
    setCustomCampusInput(nama);
    if (!nama.trim()) return;

    setActiveLocationMode("custom");
    const coords = getCoordinatesForLocation(nama);
    updateCurrentLocation(coords);
  };

  // Handler: Geolocation GPS Real-time perangkat
  const handleGetLiveGPS = () => {
    if (externalGetLiveGPS) {
      externalGetLiveGPS();
      return;
    }
    if (typeof window === "undefined" || !navigator.geolocation) {
      showNotification("Sensor GPS tidak tersedia di browser Anda.");
      return;
    }
    setInternalGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateCurrentLocation({
          name: "Lokasi GPS Saya Saat Ini",
          lat,
          lng,
          area: "Koordinat GPS Pengguna",
        });
        setActiveLocationMode("gps");
        setInternalGpsLoading(false);
        showNotification("Titik acuan disetel ke posisi GPS saat ini.");
      },
      (err) => {
        setInternalGpsLoading(false);
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

  // Filter list
  const filteredKosan = kosanWithDistance
    .filter((k) => {
      if (selectedTipe !== "all" && k.tipe !== selectedTipe) return false;
      if (k.harga > maxHarga) return false;

      // Category Icon Rail filter (Focused high-level accommodation types)
      if (selectedCategory === "putra") {
        if (k.tipe !== "putra") return false;
      } else if (selectedCategory === "putri") {
        if (k.tipe !== "putri") return false;
      } else if (selectedCategory === "campur") {
        if (k.tipe !== "campur") return false;
      } else if (selectedCategory === "eksklusif") {
        const isEksklusif =
          k.harga >= 750000 ||
          k.nama.toLowerCase().includes("eksklusif") ||
          k.nama.toLowerCase().includes("vip") ||
          k.fasilitas.some((f) => f.toLowerCase().includes("ac"));
        if (!isEksklusif) return false;
      } else if (selectedCategory === "hemat") {
        const isHemat =
          k.harga <= 600000 ||
          k.nama.toLowerCase().includes("hemat") ||
          k.nama.toLowerCase().includes("barokah");
        if (!isHemat) return false;
      } else if (selectedCategory === "kontrakan" || selectedCategory === "paviliun") {
        const isKontrakan =
          k.nama.toLowerCase().includes("kontrakan") ||
          k.nama.toLowerCase().includes("paviliun") ||
          k.nama.toLowerCase().includes("rumah") ||
          k.fasilitas.some((f) => f.toLowerCase().includes("dapur"));
        if (!isKontrakan) return false;
      }

      // Top rated filter
      if (onlyTopRated && (k.rating || 0) < 4.8) return false;

      // Only favorites filter
      if (onlyFavorites && !favorites.includes(String(k.id))) return false;

      // Text search query
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

  // Category Icon Rail Definition (Hide.com Hotel/Apartment/Villa style)
  const categoryRailItems = [
    { id: "all", label: "Semua Kos", icon: Home },
    { id: "putra", label: "Kos Putra", icon: User },
    { id: "putri", label: "Kos Putri", icon: Sparkles },
    { id: "campur", label: "Kos Campur", icon: Users },
    { id: "eksklusif", label: "Kos Eksklusif", icon: Crown },
    { id: "hemat", label: "Kos Hemat", icon: Wallet },
    { id: "kontrakan", label: "Kontrakan", icon: Building2 },
  ] as const;

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    if (id === "all") {
      setSelectedTipe("all");
    } else if (id === "putra") {
      setSelectedTipe("putra");
    } else if (id === "putri") {
      setSelectedTipe("putri");
    } else if (id === "campur") {
      setSelectedTipe("campur");
    } else {
      setSelectedTipe("all");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification Banner */}
      {statusNotification && (
        <div className="fixed top-22 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 text-center max-w-[90vw] animate-in fade-in slide-in-from-top-2">
          {statusNotification}
        </div>
      )}

      {/* 1. HORIZONTAL ICON CATEGORY RAIL (Hide.com Hotel/Apartment/Villa style) */}
      <div className="pt-2 border-b border-slate-200/80 dark:border-slate-800 w-full overflow-hidden">
        <div className="flex items-center gap-7 sm:gap-9 overflow-x-auto no-scrollbar pb-3">
          {categoryRailItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCategory(item.id)}
                className={`flex flex-col items-center gap-1.5 shrink-0 transition-all cursor-pointer relative py-1 group ${
                  isActive
                    ? "text-emerald-800 dark:text-emerald-300 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                }`}
              >
                <Icon
                  className={`w-6 h-6 stroke-[1.6] transition-transform group-hover:scale-110 ${
                    isActive ? "stroke-emerald-700 dark:stroke-emerald-400" : "stroke-current"
                  }`}
                />
                <span className="text-[13px] whitespace-nowrap tracking-tight font-medium">
                  {item.label}
                </span>

                {/* Active Indicator Underline (Siliwangi Green style) */}
                {isActive && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-emerald-700 dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-FILTER PILLS & TOOLBAR (Hide.com style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Pill: All */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedTipe("all");
              setOnlyTopRated(false);
              setOnlyFavorites(false);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "all" && !onlyTopRated && !onlyFavorites
                ? "border border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            All Kos
          </button>

          {/* Pill: Top Kos (4.8+ Rating) */}
          <button
            type="button"
            onClick={() => setOnlyTopRated(!onlyTopRated)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              onlyTopRated
                ? "border border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Top Kos (4.8+)</span>
          </button>

          {/* Pill: Favorit Saya */}
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              onlyFavorites
                ? "border border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            <Heart className={`w-3 h-3 ${onlyFavorites ? "fill-emerald-600 text-emerald-600" : ""}`} />
            <span>Favorit ({favorites.length})</span>
          </button>

          {/* Quick Radius Pills */}
          {[1, 3, 5, 10].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMaxRadius(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer tabular-nums ${
                maxRadius === r
                  ? "border border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              {r} KM
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMaxRadius("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              maxRadius === "all"
                ? "border border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            Semua Jarak
          </button>
        </div>

        {/* Right: Filter & Sorter */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              showAdvancedFilter
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold"
                : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "distance" | "price")}
              className="appearance-none pl-3.5 pr-8 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer outline-none"
            >
              <option value="distance" className="bg-white dark:bg-slate-900">Sort: Terdekat</option>
              <option value="price" className="bg-white dark:bg-slate-900">Sort: Termurah</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Expansion (Budget & Location Reference) */}
      {showAdvancedFilter && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Campus selector input */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                Pilih Titik Acuan Kampus
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  list="kampus-list-filter"
                  value={customCampusInput}
                  onChange={(e) => handleSelectCustomCampus(e.target.value)}
                  placeholder="Ketik kampus (UNSIL, ITB, UI, Cipedes)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-600"
                />
                <datalist id="kampus-list-filter">
                  <option value="Universitas Siliwangi (UNSIL)" />
                  <option value="Cipedes (Tasikmalaya)" />
                  <option value="Sukamanah (Tasikmalaya)" />
                  {UNIVERSITAS_LIST.map((u, i) => (
                    <option key={i} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* GPS Trigger */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                Sensor Geolocation
              </label>
              <button
                type="button"
                onClick={handleGetLiveGPS}
                disabled={gpsLoading}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 ${gpsLoading ? "animate-spin" : ""}`} />
                <span>{gpsLoading ? "Mendeteksi..." : "Gunakan GPS Saya Saat Ini"}</span>
              </button>
            </div>

            {/* Maximum Budget */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                Batas Budget Bulanan
              </label>
              <select
                value={maxHarga}
                onChange={(e) => setMaxHarga(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer tabular-nums"
              >
                <option value={700000}>Maks Rp 700.000 / bln</option>
                <option value={1000000}>Maks Rp 1.000.000 / bln</option>
                <option value={1500000}>Maks Rp 1.500.000 / bln</option>
                <option value={2500000}>Semua Budget (s/d Rp 2,5 jt)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBTLE LOCATION CONTEXT PILL */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">
            Acuan Jarak: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{currentLocation.name}</strong> ({maxRadius === "all" ? "Semua Radius" : `Maks ${maxRadius} KM`})
          </span>
        </div>
        <div className="text-slate-600 dark:text-slate-400 font-medium shrink-0">
          Ditemukan <strong className="text-slate-900 dark:text-white tabular-nums">{filteredKosan.length}</strong> kos
        </div>
      </div>

      {/* 4. 4-COLUMN LUXURY AIRBNB / VILLA CARD GRID (Hide.com style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredKosan.map((kos) => {
          const isFav = favorites.includes(String(kos.id));
          const mapDirectionUrl = `https://www.google.com/maps/dir/?api=1&destination=${kos.lat},${kos.lng}`;
          const waUrl = formatWhatsAppUrl(
            kos.telp,
            `Halo pengelola ${kos.nama}, saya melihat info kosan ini di Sahabat Mahasiswa (jarak: ${kos.jarak ?? 0} km dari ${currentLocation.name}). Apakah masih ada kamar kosong?`
          );

          // Discount / Promo tag mapping
          const promoBadge =
            kos.sumber === "mamikos_kaggle"
              ? "Mamikos Kaggle"
              : kos.harga <= 600000
              ? "Hemat Mahasiswa"
              : "Top Kos UNSIL";

          return (
            <div
              key={kos.id}
              onClick={() => setSelectedKosan(kos)}
              className="group flex flex-col cursor-pointer transition-all duration-300"
            >
              {/* Photo Container (Hide.com rounded 4:3 with glass badges) */}
              <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xs mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kos.foto_url}
                  alt={kos.nama}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Top-Left Siliwangi Green & Gold Discount/Promo Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-800 text-white shadow-xs">
                    {promoBadge}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md text-white backdrop-blur-md shadow-xs ${
                      kos.tipe === "putri"
                        ? "bg-rose-900/80"
                        : kos.tipe === "putra"
                        ? "bg-emerald-950/80"
                        : "bg-teal-900/80"
                    }`}
                  >
                    Kos {kos.tipe === "putri" ? "Putri" : kos.tipe === "putra" ? "Putra" : "Campur"}
                  </span>
                </div>

                {/* Top-Right Circular Glass Heart Favorite Button */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, String(kos.id))}
                  title={isFav ? "Hapus dari favorit" : "Simpan ke favorit"}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:text-emerald-600 transition-transform active:scale-90 shadow-xs cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isFav ? "fill-emerald-600 text-emerald-600" : "text-slate-700 dark:text-slate-300"
                    }`}
                  />
                </button>

                {/* Bottom-Right Distance Overlay */}
                {kos.jarak !== undefined && (
                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums">
                    <Navigation className="w-3 h-3 text-amber-400" />
                    <span>{kos.jarak} km</span>
                  </div>
                )}
              </div>

              {/* Meta Details Under Image */}
              <div className="flex-1 flex flex-col justify-between space-y-1.5">
                {/* Secondary Meta Tags */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                    {kos.tipe === "putri" ? "Khusus Putri" : kos.tipe === "putra" ? "Khusus Putra" : "Bebas Campur"}
                  </span>
                  {kos.fasilitas.slice(0, 2).map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap truncate max-w-28"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Title & Star Rating Row */}
                <div className="flex items-baseline justify-between gap-2 pt-0.5">
                  <h3 className="font-bold text-[15px] text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {kos.nama}
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{kos.rating || 4.73}</span>
                  </div>
                </div>

                {/* Location Subtitle */}
                <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate">
                  {kos.area} &bull; {kos.jarak !== undefined ? `${kos.jarak} km dari ${currentLocation.name.split(" ")[0]}` : "Tasikmalaya"}
                </p>

                {/* Specs Row with Subtle Icons */}
                <div className="flex items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-slate-400" />
                    <span>1 Kamar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShowerHead className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mandi Dalam</span>
                  </span>
                  {kos.sisa_kamar && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Sisa {kos.sisa_kamar}</span>
                    </span>
                  )}
                </div>

                {/* Price & Action Row (Hide.com tabular pricing + Clean Buttons) */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                  <div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatRupiah(kos.harga)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/ bln</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={mapDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Lihat Rute di Google Maps"
                      className="px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 text-slate-500" />
                      <span>Rute</span>
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Hubungi Pengelola via WhatsApp"
                      className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3 text-white" />
                      <span>Chat</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. EMPTY STATE */}
      {filteredKosan.length === 0 && (
        <div className="text-center py-16 px-6 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">
              Tidak Ada Kosan dalam Radius Ini
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Kosan dalam radius {maxRadius === "all" ? "pilihan" : `${maxRadius} KM`} dari <strong>{currentLocation.name}</strong> belum ditemukan. Coba perbesar jarak radius pencarian:
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMaxRadius(10)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Perluas Radius ke 10 KM
            </button>
            <button
              type="button"
              onClick={() => setMaxRadius(20)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Perluas ke 20 KM
            </button>
            <button
              type="button"
              onClick={() => setMaxRadius("all")}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
