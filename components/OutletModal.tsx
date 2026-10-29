"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Star, MapPin, Clock, Bookmark, Share2, Compass, ShieldCheck, ExternalLink, Music2, Sparkles } from "lucide-react";
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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
      onToast("Link outlet berhasil disalin.");
    }
  };

  const handleToggleBookmark = () => {
    setSavedOutlet(!savedOutlet);
    onToast(savedOutlet ? "Outlet dihapus dari tersimpan." : "Outlet disimpan ke favorit.");
  };

  const handleLaunchTikTok = () => {
    if (outletVouchers.length > 0) {
      bukaAplikasiPlatform(outletVouchers[0], onToast);
    } else {
      const mockV: Partial<Voucher> = {
        platform: outlet.platform,
        brand: outlet.brand,
        brandKey: outlet.brandKey,
        tiktokUsername: outlet.tiktokUsername,
        linkBeli: `https://www.tiktok.com/@${outlet.tiktokUsername}`,
      };
      bukaAplikasiPlatform(mockV as Voucher, onToast);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl relative my-6 max-h-[92vh] flex flex-col overflow-hidden z-10">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center font-bold text-xs tracking-tight text-slate-900 dark:text-white">
            {outlet.platform} &bull; Outlet Resto
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Bagikan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Outlet Info Hero */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3.5">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight truncate">
                  {outlet.namaOutlet}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap tabular-nums">
                  <span className="font-semibold text-amber-500 flex items-center gap-0.5 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {outlet.rating}
                  </span>
                  <span className="tabular-nums">({outlet.ulasan} ulasan)</span>
                  <span>&bull;</span>
                  <span className="tabular-nums">{outlet.disimpan} disimpan</span>
                </div>
                <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-1">
                  &ldquo;{outlet.tagline}&rdquo;
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{outlet.jamBuka}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{outlet.jarak} &bull; {outlet.alamat}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Petunjuk Arah</span>
              </a>
              <button
                type="button"
                onClick={handleLaunchTikTok}
                className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Music2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Akun TikTok</span>
              </button>
            </div>
          </div>

          {/* Official Promo Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-white">
                Diskon TikTok GO Dining
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                Official Promo
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Jaminan voucher aktif
              </span>
              <span>Layanan resmi TikTok GO</span>
            </div>
          </div>

          {/* Pax Filter Chips */}
          <div className="flex gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPaxFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                paxFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Semua Menu
            </button>
            <button
              type="button"
              onClick={() => setPaxFilter(1)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                paxFilter === 1
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Untuk 1 Pax
            </button>
            <button
              type="button"
              onClick={() => setPaxFilter(2)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                paxFilter === 2
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              >
                <div>
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md inline-block mb-1 border border-rose-200 dark:border-rose-900">
                    {v.badgeTerlaris || "Diskon Promo"}
                  </span>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                    {v.namaVoucher}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {v.deskripsi}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 line-through mr-1.5 tabular-nums">
                      Rp {v.hargaAsli.toLocaleString("id-ID")}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      Rp {v.hargaDiskon.toLocaleString("id-ID")}
                    </span>
                    <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-rose-600 text-white tabular-nums">
                      -{v.diskonPersen}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectVoucher(v);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Klaim Barcode
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Buka di Aplikasi TikTok */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={handleLaunchTikTok}
            className="w-full py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Buka di Aplikasi TikTok (@{outlet.tiktokUsername})</span>
            <ExternalLink className="w-4 h-4 ml-0.5" />
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Pembelian & penukaran voucher diproses langsung di aplikasi resmi.
          </p>
        </div>
      </div>
    </div>
  );
}
