"use client";

import React, { useState } from "react";
import { X, ArrowLeft, Star, MapPin, Clock, Bookmark, Share2, Compass, ShieldCheck, ExternalLink } from "lucide-react";
import { Outlet, Voucher } from "@/lib/types";
import { OUTLETS, DEFAULT_VOUCHERS } from "@/lib/data";
import { bukaAplikasiPlatform } from "@/lib/launcher";

interface OutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandKey: string | null;
  onSelectVoucher: (v: Voucher) => void;
  onToast: (msg: string) => void;
}

export default function OutletModal({
  isOpen,
  onClose,
  brandKey,
  onSelectVoucher,
  onToast,
}: OutletModalProps) {
  const [paxFilter, setPaxFilter] = useState<"all" | 1 | 2>("all");
  const [savedOutlet, setSavedOutlet] = useState(false);

  if (!isOpen || !brandKey) return null;

  const outlet: Outlet | undefined = OUTLETS[brandKey];
  if (!outlet) return null;

  // Filter vouchers belonging to this outlet
  let outletVouchers = DEFAULT_VOUCHERS.filter(
    (v) => (v.brandKey || v.brand.toLowerCase().replace(/\s+/g, "")) === brandKey
  );

  if (paxFilter !== "all") {
    outletVouchers = outletVouchers.filter((v) => v.pax === paxFilter || v.pax === "all");
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    outlet.mapQuery || `${outlet.brand} Tasikmalaya`
  )}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: outlet.namaOutlet,
        text: `Cek promo kuliner ${outlet.brand} di Sahabat Mahasiswa!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      onToast("🔗 Link outlet berhasil disalin!");
    }
  };

  const handleToggleBookmark = () => {
    setSavedOutlet(!savedOutlet);
    onToast(savedOutlet ? "Outlet dihapus dari tersimpan" : "🔖 Outlet disimpan ke favorit!");
  };

  const handleLaunchTikTok = () => {
    if (outletVouchers.length > 0) {
      bukaAplikasiPlatform(outletVouchers[0], onToast);
    } else {
      const mockV: any = {
        platform: outlet.platform,
        brand: outlet.brand,
        brandKey: outlet.brandKey,
        tiktokUsername: outlet.tiktokUsername,
        linkBeli: `https://www.tiktok.com/@${outlet.tiktokUsername}`,
      };
      bukaAplikasiPlatform(mockV, onToast);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Sticky Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center font-black text-xs tracking-wider text-slate-900 dark:text-white uppercase">
            {outlet.platform.toUpperCase()} · OUTLET
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl transition ${
                savedOutlet
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Simpan Outlet"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Bagikan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Outlet Info Hero */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl shadow-sm shrink-0">
                {outlet.brandLogo}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight truncate">
                  {outlet.namaOutlet}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="font-bold text-amber-500 flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500" /> {outlet.rating}
                  </span>
                  <span>({outlet.ulasan} ulasan)</span>
                  <span>·</span>
                  <span>{outlet.disimpan} disimpan</span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-1">
                  "{outlet.tagline}"
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span>{outlet.jamBuka}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 truncate">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>📍 {outlet.jarak} · {outlet.alamat}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Petunjuk Arah</span>
              </a>
              <button
                type="button"
                onClick={handleLaunchTikTok}
                className="py-2 px-3 rounded-xl bg-[#FE2C55] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#FE2C55]/20 hover:bg-[#e0264b] transition"
              >
                <span>🎵 Akun TikTok</span>
              </button>
            </div>
          </div>

          {/* Official Promo Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FE2C55]/15 via-rose-500/10 to-transparent border border-[#FE2C55]/30 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Jelajahi TikTok GO · Diskon s/d 50%
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FE2C55] text-white">
                GO | Tokopedia
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Bisa refund kapan saja
              </span>
              <span>Layanan resmi TikTok GO Dining</span>
            </div>
          </div>

          {/* Pax Filter Chips */}
          <div className="flex gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaxFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition ${
                paxFilter === "all"
                  ? "bg-[#FE2C55] text-white shadow-md shadow-[#FE2C55]/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Semua Menu
            </button>
            <button
              type="button"
              onClick={() => setPaxFilter(1)}
              className={`px-3 py-1.5 rounded-xl transition ${
                paxFilter === 1
                  ? "bg-[#FE2C55] text-white shadow-md shadow-[#FE2C55]/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Untuk 1 Pax
            </button>
            <button
              type="button"
              onClick={() => setPaxFilter(2)}
              className={`px-3 py-1.5 rounded-xl transition ${
                paxFilter === 2
                  ? "bg-[#FE2C55] text-white shadow-md shadow-[#FE2C55]/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Untuk 2 Pax
            </button>
          </div>

          {/* Catalog Items */}
          <div className="space-y-3">
            {outletVouchers.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between gap-3 hover:border-[#FE2C55]/50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#FE2C55] bg-[#FE2C55]/10 px-2 py-0.5 rounded-md inline-block mb-1">
                      {v.badgeTerlaris || "Diskon Promo"}
                    </span>
                    <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug">
                      {v.namaVoucher}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {v.deskripsi}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <span className="text-[11px] text-slate-400 line-through mr-1.5">
                      Rp {v.hargaAsli.toLocaleString("id-ID")}
                    </span>
                    <span className="text-sm font-black text-[#FE2C55]">
                      Rp {v.hargaDiskon.toLocaleString("id-ID")}
                    </span>
                    <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FE2C55] text-white">
                      -{v.diskonPersen}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectVoucher(v);
                    }}
                    className="px-3 py-1.5 bg-[#FE2C55] hover:bg-[#e0264b] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FE2C55]/20 transition active:scale-95"
                  >
                    Klaim Barcode ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Buka di Aplikasi TikTok */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={handleLaunchTikTok}
            className="w-full py-3.5 bg-[#FE2C55] hover:bg-[#e0264b] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#FE2C55]/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <span>🚀 Buka di Aplikasi TikTok (@{outlet.tiktokUsername})</span>
            <ExternalLink className="w-4 h-4 ml-0.5" />
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            💡 Pembelian & penukaran voucher diproses langsung di aplikasi TikTok resmi.
          </p>
        </div>
      </div>
    </div>
  );
}
