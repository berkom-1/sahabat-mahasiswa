"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Store,
  UtensilsCrossed,
  Flame,
  Music2,
  ExternalLink,
  Star,
  Coffee,
  Sparkles,
  Heart,
  Pizza,
  Cookie,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import { Voucher } from "@/lib/types";
import { DEFAULT_VOUCHERS } from "@/lib/data";
import { bukaAplikasiPlatform } from "@/lib/launcher";
import ClaimVoucherModal from "./ClaimVoucherModal";
import OutletModal from "./OutletModal";
import TikTokConfigModal from "./TikTokConfigModal";

export default function VoucherTab() {
  const [vouchers] = useState<Voucher[]>(DEFAULT_VOUCHERS);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"discount" | "price" | "rating">("discount");

  // Selected modals
  const [selectedClaimVoucher, setSelectedClaimVoucher] = useState<Voucher | null>(null);
  const [selectedOutletBrandKey, setSelectedOutletBrandKey] = useState<string | null>(null);
  const [showTikTokConfig, setShowTikTokConfig] = useState(false);

  // TikTok API status
  const [hasTikTokKey, setHasTikTokKey] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sm_tiktok_dining_config");
        if (saved) return !!JSON.parse(saved).clientKey;
      } catch {}
    }
    return false;
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sm_voucher_favorites");
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
      localStorage.setItem("sm_voucher_favorites", JSON.stringify(updated));
    } catch {}
    showToast(favorites.includes(id) ? "Dihapus dari voucher favorit" : "Disimpan ke voucher favorit");
  };

  const checkTikTokConfig = () => {
    try {
      const saved = localStorage.getItem("sm_tiktok_dining_config");
      setHasTikTokKey(saved ? !!JSON.parse(saved).clientKey : false);
    } catch {
      setHasTikTokKey(false);
    }
  };

  useEffect(() => {
    window.addEventListener("storage", checkTikTokConfig);
    window.addEventListener("sm_profile_updated", checkTikTokConfig);
    return () => {
      window.removeEventListener("storage", checkTikTokConfig);
      window.removeEventListener("sm_profile_updated", checkTikTokConfig);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filter vouchers
  let filtered = vouchers.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      v.brand.toLowerCase().includes(q) ||
      v.namaVoucher.toLowerCase().includes(q) ||
      v.deskripsi.toLowerCase().includes(q) ||
      v.kategori.toLowerCase().includes(q);

    if (!matchSearch) return false;

    // Platform filter
    if (platformFilter !== "all" && platformFilter !== "diskon50") {
      if (v.platform !== platformFilter && !v.platform.toLowerCase().includes(platformFilter.toLowerCase())) {
        return false;
      }
    }
    if (platformFilter === "diskon50" && v.diskonPersen < 50) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all") {
      if (categoryFilter === "makanan_berat") {
        const isBerat =
          v.kategori.toLowerCase().includes("makanan berat") ||
          v.brandKey === "lazatto" ||
          v.brandKey === "ayamhayam" ||
          v.brandKey === "kfc" ||
          v.brandKey === "padangampera" ||
          v.brandKey === "wartegbahari" ||
          v.brandKey === "dkriuk" ||
          v.brandKey === "rocketchicken" ||
          v.brandKey === "miegacoan";
        if (!isBerat) return false;
      } else if (categoryFilter === "kopi_minuman") {
        const isMinum =
          v.kategori.toLowerCase().includes("minuman") ||
          v.kategori.toLowerCase().includes("kopi") ||
          v.brandKey === "mixue" ||
          v.brandKey === "kopi-kenangan" ||
          v.brandKey === "janji-jiwa" ||
          v.brandKey === "chatime" ||
          v.brandKey === "haus" ||
          v.brandKey === "estehindonesia";
        if (!isMinum) return false;
      } else if (categoryFilter === "camilan") {
        const isCamilan =
          v.kategori.toLowerCase().includes("camilan") ||
          v.kategori.toLowerCase().includes("snack") ||
          v.brandKey === "rotio" ||
          v.brandKey === "jco" ||
          v.brandKey === "shihlin";
        if (!isCamilan) return false;
      } else if (categoryFilter === "fast_food") {
        const isFastFood =
          v.brandKey === "mcdonalds" ||
          v.brandKey === "kfc" ||
          v.brandKey === "aw" ||
          v.brandKey === "burgerking" ||
          v.brandKey === "lazatto";
        if (!isFastFood) return false;
      } else if (categoryFilter === "ayam") {
        const isAyam =
          v.brandKey === "lazatto" ||
          v.brandKey === "ayamhayam" ||
          v.brandKey === "dkriuk" ||
          v.brandKey === "rocketchicken" ||
          v.namaVoucher.toLowerCase().includes("ayam");
        if (!isAyam) return false;
      } else if (categoryFilter === "tiktok") {
        if (!v.platform.toLowerCase().includes("tiktok")) return false;
      }
    }

    return true;
  });

  // Sort
  filtered = filtered.sort((a, b) => {
    if (sortBy === "discount") return b.diskonPersen - a.diskonPersen;
    if (sortBy === "price") return a.hargaDiskon - b.hargaDiskon;
    return Number(b.rating || 4.8) - Number(a.rating || 4.8);
  });

  const handleBuyDirect = (e: React.MouseEvent, v: Voucher) => {
    e.stopPropagation();
    bukaAplikasiPlatform(v, showToast);
  };

  const handleOpenOutlet = (e: React.MouseEvent, v: Voucher) => {
    e.stopPropagation();
    const bKey = v.brandKey || v.brand.toLowerCase().replace(/\s+/g, "");
    setSelectedOutletBrandKey(bKey);
  };

  const categoryRail = [
    { id: "all", label: "Semua Menu", icon: UtensilsCrossed },
    { id: "makanan_berat", label: "Makanan Berat", icon: Pizza },
    { id: "kopi_minuman", label: "Kopi & Minuman", icon: Coffee },
    { id: "camilan", label: "Camilan & Roti", icon: Cookie },
    { id: "fast_food", label: "Fast Food", icon: Flame },
    { id: "ayam", label: "Ayam & Bebek", icon: Sparkles },
    { id: "tiktok", label: "TikTok GO", icon: Music2 },
  ] as const;

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed top-22 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 text-center max-w-[90vw] animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* 1. HORIZONTAL ICON CATEGORY RAIL (Hide.com style) */}
      <div className="pt-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-7 sm:gap-9 overflow-x-auto no-scrollbar pb-3">
          {categoryRail.map((item) => {
            const Icon = item.icon;
            const isActive = categoryFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryFilter(item.id)}
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

      {/* 2. SUB-FILTER PILLS & TOOLBAR (Hide.com style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Pill: All */}
          <button
            type="button"
            onClick={() => {
              setPlatformFilter("all");
              setCategoryFilter("all");
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              platformFilter === "all" && categoryFilter === "all"
                ? "border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Promo
          </button>

          {/* Pill: Diskon >50% */}
          <button
            type="button"
            onClick={() => setPlatformFilter(platformFilter === "diskon50" ? "all" : "diskon50")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              platformFilter === "diskon50"
                ? "border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold"
                : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tag className="w-3 h-3 text-rose-500" />
            <span>Diskon &gt; 50%</span>
          </button>

          {/* Platform Pills */}
          {[
            { id: "TikTok GO Dining", label: "TikTok GO" },
            { id: "GrabFood", label: "GrabFood" },
            { id: "GoFood", label: "GoFood" },
            { id: "ShopeeFood", label: "ShopeeFood" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlatformFilter(platformFilter === tab.id ? "all" : tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                platformFilter === tab.id
                  ? "border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold"
                : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Sorter */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Lazatto, Mixue..."
              className="pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none w-36 sm:w-48 focus:border-rose-400"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "discount" | "price" | "rating")}
              className="appearance-none pl-3.5 pr-8 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer outline-none"
            >
              <option value="discount" className="bg-white dark:bg-slate-900">Sort: Diskon %</option>
              <option value="price" className="bg-white dark:bg-slate-900">Sort: Termurah</option>
              <option value="rating" className="bg-white dark:bg-slate-900">Sort: Terlaris</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. 4-COLUMN LUXURY FOOD & DINING VOUCHER GRID (Hide.com style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((v) => {
          const isFav = favorites.includes(String(v.id));
          // High quality food image lookup
          const foodPhoto =
            v.brandKey === "mixue"
              ? "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"
              : v.brandKey === "lazatto" || v.brandKey === "ayamhayam"
              ? "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
              : v.brandKey === "miegacoan"
              ? "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80"
              : v.brandKey === "kopi-kenangan" || v.brandKey === "janji-jiwa"
              ? "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80"
              : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

          return (
            <article
              key={v.id}
              onClick={() => setSelectedClaimVoucher(v)}
              className="group flex flex-col cursor-pointer transition-all duration-300"
            >
              {/* Photo Container (Hide.com 4:3 rounded image) */}
              <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xs mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foodPhoto}
                  alt={v.brand}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Top-Left Coral Discount Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-xs tabular-nums">
                    -{v.diskonPersen}% Off
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white shadow-xs">
                    {v.platform}
                  </span>
                </div>

                {/* Top-Right Circular Glass Heart */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, String(v.id))}
                  title={isFav ? "Hapus dari favorit" : "Simpan ke favorit"}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-500 transition-transform active:scale-90 shadow-xs cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isFav ? "fill-rose-500 text-rose-500" : "text-slate-700 dark:text-slate-300"
                    }`}
                  />
                </button>

                {/* Bottom-Right Terjual Tag */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{v.rating || "4.8"}</span>
                  <span className="text-slate-300 text-[10px]">({v.terjual || "1.2k"})</span>
                </div>
              </div>

              {/* Details Below Image */}
              <div className="flex-1 flex flex-col justify-between space-y-1.5">
                {/* Secondary Meta Tags */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {v.badgeTerlaris || "Diskon Kampus"}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap truncate">
                    {v.kategori}
                  </span>
                </div>

                {/* Brand & Voucher Title */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {v.brand}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-rose-500 transition-colors">
                    {v.namaVoucher}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {v.deskripsi}
                  </p>
                </div>

                {/* Price & Action Row */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                  <div>
                    <div className="text-[11px] text-slate-400 line-through tabular-nums leading-none">
                      Rp {v.hargaAsli.toLocaleString("id-ID")}
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      Rp {v.hargaDiskon.toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleOpenOutlet(e, v)}
                      title="Lihat Outlet"
                      className="px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Store className="w-3 h-3 text-slate-500" />
                      <span className="hidden sm:inline">Outlet</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleBuyDirect(e, v)}
                      title={`Buka di ${v.platform}`}
                      className="px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Klaim</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-400 max-w-md mx-auto shadow-xs">
          <UtensilsCrossed className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <div className="font-bold text-slate-900 dark:text-white text-base">
            Tidak Ada Promo Kuliner Ditemukan
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-4">
            Coba pilih platform lain atau gunakan kata kunci pencarian berbeda.
          </p>
        </div>
      )}

      {/* MODAL 1: KLAIM VOUCHER & BARCODE KASIR */}
      <ClaimVoucherModal
        isOpen={!!selectedClaimVoucher}
        onClose={() => setSelectedClaimVoucher(null)}
        voucher={selectedClaimVoucher}
        onToast={showToast}
      />

      {/* MODAL 2: STOREFRONT OUTLET & MENU LENGKAP */}
      <OutletModal
        isOpen={!!selectedOutletBrandKey}
        onClose={() => setSelectedOutletBrandKey(null)}
        brandKey={selectedOutletBrandKey}
        onSelectVoucher={(v) => setSelectedClaimVoucher(v)}
        onToast={showToast}
      />

      {/* MODAL 3: PENGATURAN KUNCI API TIKTOK GO DINING */}
      <TikTokConfigModal
        isOpen={showTikTokConfig}
        onClose={() => setShowTikTokConfig(false)}
        onSavedSuccess={checkTikTokConfig}
      />
    </div>
  );
}
