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
  Globe,
  Sparkles,
  ShoppingBag,
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
    <div className="space-y-4 pb-20">
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700 dark:border-slate-200 text-center max-w-[90vw]">
          {toastMsg}
        </div>
      )}

      {/* Header Banner: Grounded Resting Dark Card */}
      <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
            <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" /> Diskon & Voucher Makanan Mahasiswa
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Voucher & Promo Kuliner Kampus
          </h2>
          <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
            Promo hemat hingga <span className="tabular-nums font-semibold text-slate-200">58%</span> dari TikTok GO Dining, GrabFood, GoFood & ShopeeFood untuk resto sekitar kampus.
          </p>
        </div>

        {/* TikTok GO API Button */}
        <button
          type="button"
          onClick={() => setShowTikTokConfig(true)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-colors shrink-0 cursor-pointer ${
            hasTikTokKey
              ? "bg-slate-800 text-emerald-300 border-emerald-500/40 hover:bg-slate-700"
              : "bg-white text-slate-950 dark:bg-white dark:text-slate-950 border-transparent hover:bg-slate-100"
          }`}
          title="Pengaturan Kunci API TikTok GO Dining"
        >
          <Music2 className="w-4 h-4 text-rose-500" />
          <span>{hasTikTokKey ? "TikTok GO API Aktif" : "Hubungkan TikTok GO (API)"}</span>
        </button>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Lazatto, Hayam, Mie Gacoan, Nasi Padang, Warteg, Mixue..."
            className="w-full text-sm font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400"
          />
        </div>

        {/* Horizontal Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-medium no-scrollbar">
          {[
            { id: "all", label: "Semua Menu" },
            { id: "makanan_berat", label: "Makanan Berat (Lazatto, Hayam)" },
            { id: "mie", label: "Mie Gacoan & Dimsum" },
            { id: "kopi_minuman", label: "Kopi & Minuman" },
            { id: "burger", label: "Burger & Fast Food" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs font-medium ${
                categoryFilter === cat.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Horizontal Platform Filter Row */}
        <div className="flex gap-2 overflow-x-auto pt-1 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {[
            { id: "all", label: "Semua Platform" },
            { id: "TikTok GO Dining", label: "TikTok GO" },
            { id: "GrabFood", label: "GrabFood" },
            { id: "GoFood", label: "GoFood" },
            { id: "ShopeeFood", label: "ShopeeFood" },
            { id: "diskon", label: "Diskon Terbesar" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlatformFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs font-medium ${
                platformFilter === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 max-w-md mx-auto">
          <UtensilsCrossed className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="font-bold text-slate-900 dark:text-white text-base">
            Tidak Ada Promo Kuliner Ditemukan
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coba pilih platform lain atau gunakan kata kunci pencarian berbeda.
          </p>
        </div>
      )}

      {/* Grid List Voucher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((v) => {
          return (
            <article
              key={v.id}
              onClick={() => setSelectedClaimVoucher(v)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Baris Atas: Brand & Platform Badge */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                      {v.brand}
                    </span>
                  </div>

                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {v.platform}
                  </span>
                </div>

                {/* Sub Meta: Rating & Jarak */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium flex items-center gap-1 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold tabular-nums">{v.rating || "4.8"}</span>
                    <span className="tabular-nums">({v.terjual || "1.5rb"} terjual)</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{v.mapQuery ? "Outlet Terdekat" : "Berlaku Online"}</span>
                  </span>
                </div>

                {/* Badge Terlaris & Nama Voucher */}
                <div className="mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 inline-block mb-1 border border-rose-200 dark:border-rose-900">
                    {v.badgeTerlaris || "Promo Mahasiswa"}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
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
                  <div className="text-xs text-slate-400 line-through tabular-nums">
                    Rp {v.hargaAsli.toLocaleString("id-ID")}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      Rp {v.hargaDiskon.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-rose-600 text-white tabular-nums">
                      -{v.diskonPersen}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Button Info Outlet */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenOutlet(e, v)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Lihat Outlet Resto"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Outlet</span>
                  </button>

                  {/* Button Beli Direct Deep Link */}
                  <button
                    type="button"
                    onClick={(e) => handleBuyDirect(e, v)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title={`Buka di ${v.platform}`}
                  >
                    <span>Buka di {v.platform.split(" ")[0]}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
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
