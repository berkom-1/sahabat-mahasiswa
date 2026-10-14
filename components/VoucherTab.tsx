"use client";

import React, { useState } from "react";
import { DEFAULT_VOUCHERS } from "@/lib/data";
import { Voucher } from "@/lib/types";
import { Tag, Copy, Check, ExternalLink, Sparkles, Flame, Percent } from "lucide-react";

export default function VoucherTab() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  const platforms = [
    { id: "all", label: "Semua Promo" },
    { id: "TikTok GO Dining", label: "TikTok Dining" },
    { id: "GrabFood", label: "GrabFood" },
    { id: "GoFood", label: "GoFood" },
    { id: "ShopeeFood", label: "ShopeeFood" },
  ];

  const handleCopyCode = (id: number | string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredVouchers = DEFAULT_VOUCHERS.filter((v) => {
    if (selectedPlatform === "all") return true;
    return v.platform === selectedPlatform;
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
      {/* Banner Diskon */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5 text-yellow-200" /> Diskon Mahasiswa Terupdate
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Voucher & Kuliner Hemat
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            Kumpulan promo TikTok GO Dining, GrabFood, GoFood, & ShopeeFood ramah kantong mahasiswa.
          </p>
        </div>
      </div>

      {/* Filter Platform Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              selectedPlatform === p.id
                ? "bg-orange-500 text-white shadow-orange-500/30 scale-100"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVouchers.map((v) => (
          <div
            key={v.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5 space-y-3">
              {/* Header Card: Platform & Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                  <span>{v.platformIcon}</span>
                  <span>{v.platform}</span>
                </span>

                {v.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                    {v.badge}
                  </span>
                )}
              </div>

              {/* Brand and Voucher Title */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{v.brandLogo}</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {v.brand}
                  </span>
                  <span className="text-[11px] text-slate-400">&bull; {v.kategori}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2 leading-snug">
                  {v.namaVoucher}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {v.deskripsi}
                </p>
              </div>

              {/* Price Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 line-through">
                    {formatRupiah(v.hargaAsli)}
                  </div>
                  <div className="text-lg font-black text-orange-600 dark:text-orange-400">
                    {formatRupiah(v.hargaDiskon)}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center gap-0.5">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Hemat {v.diskonPersen}%</span>
                </div>
              </div>

              {/* Promo Code Box */}
              {v.kodePromo && (
                <div className="flex items-center justify-between bg-dashed border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px]">KODE PROMO:</span>
                    <span className="font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">
                      {v.kodePromo}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(v.id, v.kodePromo)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors"
                  >
                    {copiedId === v.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Action Bottom */}
            <div className="p-5 pt-0">
              <a
                href={v.linkBeli}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all"
              >
                <span>Buka Aplikasi & Klaim</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
