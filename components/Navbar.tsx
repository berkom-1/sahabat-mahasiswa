"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Moon,
  Sun,
  LogIn,
  LogOut,
  Music2,
  Search,
  Navigation,
  ChevronDown,
  School,
  X,
  Compass,
} from "lucide-react";

interface NavbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenTikTokConfig?: () => void;
  onLogout: () => void;
  // Shared search & filter props for Hide.com segmented pill
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  radius?: number | "all";
  onRadiusChange?: (val: number | "all") => void;
  campusName?: string;
  onCampusChange?: (name: string) => void;
  onGetLiveGPS?: () => void;
  gpsLoading?: boolean;
}

export default function Navbar({
  user,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenProfile,
  onOpenTikTokConfig,
  onLogout,
  searchQuery = "",
  onSearchChange,
  radius = 10,
  onRadiusChange,
  campusName = "Universitas Siliwangi (UNSIL)",
  onCampusChange,
  onGetLiveGPS,
  gpsLoading = false,
}: NavbarProps) {
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [showCampusMenu, setShowCampusMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const radiusMenuRef = useRef<HTMLDivElement>(null);
  const campusMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (radiusMenuRef.current && !radiusMenuRef.current.contains(e.target as Node)) {
        setShowRadiusMenu(false);
      }
      if (campusMenuRef.current && !campusMenuRef.current.contains(e.target as Node)) {
        setShowCampusMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const radiusOptions = [
    { val: 1, label: "1 KM" },
    { val: 3, label: "3 KM" },
    { val: 5, label: "5 KM" },
    { val: 10, label: "10 KM" },
    { val: 20, label: "20 KM" },
    { val: "all", label: "Semua Jarak" },
  ] as const;

  const campusOptions = [
    "Universitas Siliwangi (UNSIL)",
    "Cipedes (Tasikmalaya)",
    "Sukamanah (Tasikmalaya)",
    "Institut Teknologi Bandung (ITB)",
    "Universitas Indonesia (UI)",
    "Universitas Gadjah Mada (UGM)",
    "Universitas Padjadjaran (UNPAD)",
  ];

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md transition-colors duration-200 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f17]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* 1. Left: Brand & Logo */}
        <div
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          title="Sahabat Mahasiswa - Kembali ke atas"
        >
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform shadow-xs">
            <Image
              src="/icon.png"
              alt="Sahabat Mahasiswa Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="block">
            <h1 className="font-bold text-sm sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Sahabat Mahasiswa
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal leading-tight hidden sm:block">
              Kosan &bull; Diskon &bull; Dompet &bull; Tugas &bull; Magang
            </p>
          </div>
        </div>

        {/* 2. Center: Segmented Floating Search Pill (Hide.com / AirBnB Style) */}
        <div className="hidden lg:flex items-center">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-full shadow-xs hover:shadow-md transition-all py-1.5 pl-4 pr-1.5 gap-2 text-xs">
            {/* Segment 1: Search Query Input */}
            <div className="flex items-center gap-2 w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Cari kos, fasilitas..."
                className="w-full bg-transparent text-xs font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Segment 2: Radius Selector Dropdown */}
            <div className="relative" ref={radiusMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowRadiusMenu(!showRadiusMenu);
                  setShowCampusMenu(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {radius === "all" ? "Semua Radius" : `Radius ${radius} KM`}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRadiusMenu && (
                <div className="absolute top-full mt-2 left-0 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Jarak Maksimal
                  </div>
                  {radiusOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        onRadiusChange?.(opt.val as number | "all");
                        setShowRadiusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        radius === opt.val
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {radius === opt.val && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Segment 3: Campus Reference Selector Dropdown */}
            <div className="relative" ref={campusMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowCampusMenu(!showCampusMenu);
                  setShowRadiusMenu(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium max-w-[150px] truncate cursor-pointer"
                title={campusName}
              >
                <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {campusName.includes("(")
                    ? campusName.split("(")[1].replace(")", "")
                    : campusName.split(" ")[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showCampusMenu && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Titik Lokasi Acuan</span>
                    {onOpenProfile && (
                      <span
                        onClick={() => {
                          setShowCampusMenu(false);
                          onOpenProfile();
                        }}
                        className="text-rose-500 hover:underline cursor-pointer lowercase"
                      >
                        atur profil
                      </span>
                    )}
                  </div>

                  {/* GPS Option */}
                  {onGetLiveGPS && (
                    <button
                      type="button"
                      onClick={() => {
                        onGetLiveGPS();
                        setShowCampusMenu(false);
                      }}
                      disabled={gpsLoading}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-2 mb-1 cursor-pointer"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                      <span>{gpsLoading ? "Mendeteksi..." : "Gunakan GPS Saya Saat Ini"}</span>
                    </button>
                  )}

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  {campusOptions.map((camp) => (
                    <button
                      key={camp}
                      type="button"
                      onClick={() => {
                        onCampusChange?.(camp);
                        setShowCampusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors truncate flex items-center justify-between ${
                        campusName === camp
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate">{camp}</span>
                      {campusName === camp && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Segment 4: Coral Circle Search Trigger Button */}
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 320, behavior: "smooth" });
              }}
              className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
              title="Cari Kosan"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Pill (collapses on < lg) */}
        <div className="flex lg:hidden flex-1 max-w-xs">
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-full px-3 py-2 text-xs shadow-xs text-slate-700 dark:text-slate-300"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{searchQuery || "Cari kos atau kampus..."}</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-500 shrink-0">
              {radius === "all" ? "Semua" : `${radius}km`}
            </span>
          </button>
        </div>

        {/* 3. Right: Actions & User Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Portal Kampus Outlined Pill Button (Like 'Sewa Your House' in Hide.com) */}
          <button
            type="button"
            onClick={user ? onOpenProfile : onOpenAuth}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer"
            title="Buka Portal Mahasiswa & Profil Kampus"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Portal Kampus</span>
          </button>

          {/* TikTok API Shortcut Button */}
          {onOpenTikTokConfig && (
            <button
              type="button"
              onClick={onOpenTikTokConfig}
              title="Pengaturan Kunci API TikTok GO Dining"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Music2 className="w-4 h-4 text-rose-500" />
            </button>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Ganti Tema"
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Button (Hide.com rounded pill with avatar) */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 py-1.5 pl-2 pr-3 rounded-full border border-slate-200 dark:border-slate-700 hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer bg-white dark:bg-slate-900"
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "User Avatar"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-[11px]">
                    {(user.name || user.email || "M")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-28 truncate">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Keluar"
                className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              id="btn-masuk-akun"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs transition-colors cursor-pointer select-none"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Akun</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Expand Drawer */}
      {showMobileSearch && (
        <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Cari kosan, area, atau fasilitas..."
              className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Radius:</span>
            {radiusOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => onRadiusChange?.(opt.val as number | "all")}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  radius === opt.val
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
