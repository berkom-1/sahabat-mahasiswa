"use client";

import React, { useState, useEffect } from "react";
import { Kosan } from "@/lib/types";
import { DEFAULT_KOSAN, calculateDistance } from "@/lib/data";
import { MapPin, Navigation, MessageCircle, Filter, Wifi, Check, Sparkles } from "lucide-react";

const CAMPUS_PRESETS = [
  { name: "UI Depok", lat: -6.3627, lng: 106.8285 },
  { name: "ITB Bandung", lat: -6.8915, lng: 107.6107 },
  { name: "Unpad Jatinangor", lat: -6.9272, lng: 107.7745 },
  { name: "UGM Jogja", lat: -7.7713, lng: 110.3775 },
];

export default function KosanTab() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>("Pilih titik acuan atau aktifkan GPS");
  const [selectedTipe, setSelectedTipe] = useState<string>("all");
  const [maxHarga, setMaxHarga] = useState<number>(2000000);
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance");

  // Geolocation trigger
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Browser tidak mendukung GPS.");
      return;
    }
    setGpsLoading(true);
    setGpsStatus("Mencari koordinat GPS Anda...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        setGpsStatus("📍 Menggunakan lokasi GPS Anda saat ini");
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus("Gagal mengambil GPS. Silakan pilih kampus di bawah.");
        console.warn("GPS Error:", err.message);
      },
      { timeout: 10000 }
    );
  };

  // Set default to UI Depok on mount
  useEffect(() => {
    setUserLocation(CAMPUS_PRESETS[0]);
    setGpsStatus(`📍 Titik acuan: ${CAMPUS_PRESETS[0].name}`);
  }, []);

  // Calculate distance for all kosan
  const kosanWithDistance = DEFAULT_KOSAN.map((k) => {
    const jarak = userLocation
      ? calculateDistance(userLocation.lat, userLocation.lng, k.lat, k.lng)
      : undefined;
    return { ...k, jarak };
  });

  // Filter & Sort
  const filteredKosan = kosanWithDistance
    .filter((k) => {
      if (selectedTipe !== "all" && k.tipe !== selectedTipe) return false;
      if (k.harga > maxHarga) return false;
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
      {/* Banner & GPS Control */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Haversine GPS Radius
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Cari Kos Dekat Kampus
          </h1>
          <p className="text-indigo-100 text-sm mt-1">
            Hitung jarak akurat kilometer langsung dari kampus atau kamar Anda saat ini.
          </p>

          {/* GPS Buttons & Status */}
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-75"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                {gpsLoading ? "Mendeteksi..." : "Aktifkan GPS Saya"}
              </button>

              {CAMPUS_PRESETS.map((campus) => (
                <button
                  key={campus.name}
                  onClick={() => {
                    setUserLocation(campus);
                    setGpsStatus(`📍 Titik acuan: ${campus.name}`);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md transition-all ${
                    userLocation?.lat === campus.lat && userLocation?.lng === campus.lng
                      ? "bg-white/30 text-white font-bold ring-2 ring-white/50"
                      : "bg-white/10 text-indigo-100 hover:bg-white/20"
                  }`}
                >
                  {campus.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-indigo-200/90 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{gpsStatus}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tipe Kos Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tipe:
          </span>
          {[
            { id: "all", label: "Semua" },
            { id: "putra", label: "Putra" },
            { id: "putri", label: "Putri" },
            { id: "campur", label: "Campur" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTipe(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                selectedTipe === t.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sorting & Max Price */}
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "distance" | "price")}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="distance">Urutkan: Terdekat (GPS)</option>
            <option value="price">Urutkan: Termurah</option>
          </select>

          <select
            value={maxHarga}
            onChange={(e) => setMaxHarga(Number(e.target.value))}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={500000}>Maks Rp500 rb/bln</option>
            <option value={1000000}>Maks Rp1.0 jt/bln</option>
            <option value={1500000}>Maks Rp1.5 jt/bln</option>
            <option value={2500000}>Semua Budget</option>
          </select>
        </div>
      </div>

      {/* Kosan List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredKosan.map((kos) => (
          <div
            key={kos.id}
            className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Photo & Badge */}
              <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kos.foto_url}
                  alt={kos.nama}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full text-white shadow-md ${
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

                {kos.jarak !== undefined && (
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Navigation className="w-3 h-3 text-indigo-400" />
                    <span>{kos.jarak} km</span>
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(kos.harga)}
                  </span>
                  <span className="text-xs text-slate-500">/ bulan</span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {kos.nama}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{kos.area}</span>
                </p>

                {/* Facilities */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {kos.fasilitas.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <Check className="w-2.5 h-2.5 text-emerald-500" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 pt-0">
              <a
                href={`https://wa.me/${kos.telp}?text=${encodeURIComponent(
                  `Halo pengelola ${kos.nama}, saya melihat info kosan ini di aplikasi Sahabat Mahasiswa. Apakah saat ini masih ada kamar yang tersedia?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp Pemilik</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredKosan.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Tidak ada kosan yang cocok dengan kriteria filter Anda. Coba naikkan batas budget.
          </p>
        </div>
      )}
    </div>
  );
}
