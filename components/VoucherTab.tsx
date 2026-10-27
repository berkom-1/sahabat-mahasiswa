"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Store } from "lucide-react";
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
    if (platformFilter !== "all" && platformFilter !== "diskon") {
      if (v.platform !== platformFilter && !v.platform.toLowerCase().includes(platformFilter.toLowerCase())) {
        return false;
      }
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
          v.brandKey === "richeese";
        if (!isBerat) return false;
      } else if (categoryFilter === "mie") {
        if (!v.brandKey?.includes("miegacoan") && !v.kategori.toLowerCase().includes("mie")) return false;
      } else if (categoryFilter === "kopi_minuman") {
        const isMinum =
          v.brandKey === "mixue" ||
          v.brandKey === "kopikenangan" ||
          v.brandKey === "janjijiwa" ||
          v.brandKey === "chatime" ||
          v.kategori.toLowerCase().includes("kopi") ||
          v.kategori.toLowerCase().includes("es krim") ||
          v.kategori.toLowerCase().includes("minuman") ||
          v.kategori.toLowerCase().includes("teh");
        if (!isMinum) return false;
      } else if (categoryFilter === "burger") {
        if (!v.brandKey?.includes("burger") && !v.namaVoucher.toLowerCase().includes("burger")) return false;
      }
    }

    return true;
  });

  if (platformFilter === "diskon") {
    filtered = [...filtered].sort((a, b) => b.diskonPersen - a.diskonPersen);
  }

  const handleBuyDirect = (e: React.MouseEvent, v: Voucher) => {
    e.stopPropagation();
    bukaAplikasiPlatform(v, showToast);
  };

  const handleOpenOutlet = (e: React.MouseEvent, v: Voucher) => {
    e.stopPropagation();
    const bKey = v.brandKey || v.brand.toLowerCase().replace(/\s+/g, "");
    setSelectedOutletBrandKey(bKey);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-top-4 duration-200 text-center max-w-[90vw]">
          {toastMsg}
        </div>
      )}

      {/* Header Banner & API Key Status */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-[#FE2C55]/15 via-rose-500/10 to-indigo-600/10 border border-[#FE2C55]/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🍽️</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Voucher & Promo Kuliner Kampus
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
            Diskon makanan hemat hingga 58% dari TikTok GO Dining, GrabFood, GoFood & ShopeeFood (Lazatto, Hayam Sambel Korek, Mie Gacoan, Richeese, KFC & Mixue).
          </p>
        </div>

        {/* TikTok GO API Button */}
        <button
          type="button"
          onClick={() => setShowTikTokConfig(true)}
          className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0 ${
            hasTikTokKey
              ? "bg-emerald-600 text-white shadow-emerald-600/25 hover:bg-emerald-700"
              : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
          }`}
          title="Pengaturan Kunci API TikTok GO Dining"
        >
          <span>{hasTikTokKey ? "🟢" : "🎵"}</span>
          <span>{hasTikTokKey ? "TikTok GO API Aktif ↗" : "Hubungkan TikTok GO (API) ↗"}</span>
        </button>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Lazatto, Hayam, Mie Gacoan, Nasi Padang, Warteg, Mixue..."
            className="w-full text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-[#FE2C55]"
          />
        </div>

        {/* Horizontal Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {[
            { id: "all", label: "Semua Menu", icon: "🍽️" },
            { id: "makanan_berat", label: "Makanan Berat (Lazatto, Hayam)", icon: "🍗" },
            { id: "mie", label: "Mie Gacoan & Dimsum", icon: "🍜" },
            { id: "kopi_minuman", label: "Kopi & Minuman", icon: "☕" },
            { id: "burger", label: "Burger & Fast Food", icon: "🍔" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 text-[11px] font-black ${
                categoryFilter === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Horizontal Platform Filter Row */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {[
            { id: "all", label: "Semua Platform", icon: "🌐" },
            { id: "TikTok GO Dining", label: "TikTok GO", icon: "🎵" },
            { id: "GrabFood", label: "GrabFood", icon: "🟢" },
            { id: "GoFood", label: "GoFood", icon: "🔴" },
            { id: "ShopeeFood", label: "ShopeeFood", icon: "🟠" },
            { id: "diskon", label: "Diskon Terbesar", icon: "🔥" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPlatformFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 shadow-sm ${
                platformFilter === tab.id
                  ? "bg-[#FE2C55] text-white shadow-[#FE2C55]/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
          <div className="text-4xl mb-2">🍽️</div>
          <div className="font-black text-slate-800 dark:text-white text-sm">
            Tidak Ada Promo Kuliner Ditemukan
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Coba pilih platform lain atau gunakan kata kunci pencarian berbeda.
          </p>
        </div>
      )}

      {/* Grid List Voucher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((v) => {
          const platformColor = v.platformColor || "#FE2C55";
          return (
            <article
              key={v.id}
              onClick={() => setSelectedClaimVoucher(v)}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#FE2C55]/40 dark:hover:border-[#FE2C55]/40 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Baris Atas: Brand & Platform Badge */}
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{v.brandLogo}</span>
                    <span className="font-black text-xs text-slate-900 dark:text-white tracking-wide">
                      {v.brand}
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white flex items-center gap-1 shadow-sm"
                    style={{ backgroundColor: platformColor }}
                  >
                    <span>{v.platformIcon}</span>
                    <span>{v.platform}</span>
                  </span>
                </div>

                {/* Sub Meta: Rating & Jarak */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-amber-500 font-bold flex items-center gap-1">
                    ⭐ {v.rating || "4.8"} ({v.terjual || "1.5rb"} terjual)
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-42.5">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{v.mapQuery ? "📍 Outlet Terdekat" : "🌐 Berlaku Online"}</span>
                  </span>
                </div>

                {/* Badge Terlaris & Nama Voucher */}
                <div className="mb-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FE2C55]/10 text-[#FE2C55] inline-block mb-1.5">
                    {v.badgeTerlaris || "Promo Mahasiswa"} 🔥
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#FE2C55] transition">
                    {v.namaVoucher}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {v.deskripsi}
                  </p>
                </div>
              </div>

              {/* Baris Bawah: Harga & Tombol Aksi */}
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-400 line-through">
                    Rp {v.hargaAsli.toLocaleString("id-ID")}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      Rp {v.hargaDiskon.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[11px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500 text-white">
                      -{v.diskonPersen}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Button Info Outlet */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenOutlet(e, v)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    title="Lihat Storefront Outlet"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Outlet</span>
                  </button>

                  {/* Button Beli Direct Deep Link */}
                  <button
                    type="button"
                    onClick={(e) => handleBuyDirect(e, v)}
                    className="px-3 py-2 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1"
                    style={{ backgroundColor: platformColor }}
                    title={`Buka di ${v.platform}`}
                  >
                    <span>🚀</span>
                    <span>Beli di {v.platform.split(" ")[0]}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

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
