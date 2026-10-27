"use client";

import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { Voucher, Outlet } from "@/lib/types";
import { OUTLETS } from "@/lib/data";
import { bukaAplikasiPlatform } from "@/lib/launcher";

interface ClaimVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: Voucher | null;
  onToast: (msg: string) => void;
}

// Generator Barcode Kasir Dinamis SVG
function generateBarcodeLines(serial: string) {
  let x = 12;
  const bars: { x: number; width: number }[] = [];
  for (let i = 0; i < serial.length; i++) {
    const code = serial.charCodeAt(i);
    const w1 = (code % 3) + 1.2;
    const w2 = ((code >> 1) % 2) + 1;
    bars.push({ x, width: w1 });
    x += w1 + 1.6;
    bars.push({ x, width: w2 });
    x += w2 + 2;
  }
  return bars;
}

// Generator Serial Voucher Deterministik (Purity-safe untuk React render)
function getDeterministicSerial(brand: string, id: string | number) {
  let hash = 0;
  const str = `${brand}-${id}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash % 900000) + 100000;
  return `TTGO-${brand.toUpperCase()}-${num}`;
}

export default function ClaimVoucherModal({
  isOpen,
  onClose,
  voucher,
  onToast,
}: ClaimVoucherModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !voucher) return null;

  const bKey = voucher.brandKey || voucher.brand.toLowerCase().replace(/\s+/g, "");
  const outlet: Outlet | undefined = OUTLETS[bKey];
  const platform = voucher.platform || "TikTok GO Dining";
  const platformColor = voucher.platformColor || "#FE2C55";
  const tiktokUsername = voucher.tiktokUsername || outlet?.tiktokUsername || "mixueindonesia";

  const promoCode =
    voucher.kodePromo ||
    `${voucher.brand.toUpperCase().replace(/\s+/g, "")}${voucher.diskonPersen || 50}OFF`;
  const serialVoucher =
    voucher.serialVoucher ||
    getDeterministicSerial(bKey, voucher.id);

  const barcodeBars = generateBarcodeLines(serialVoucher);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    onToast(`📋 Kode promo ${promoCode} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchApp = () => {
    bukaAplikasiPlatform(voucher, onToast);
  };

  const mapQuery = voucher.mapQuery || outlet?.mapQuery || `${voucher.brand} Tasikmalaya`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Title */}
        <div className="text-center mb-4 pr-6">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#FE2C55]">
            KLAIM VOUCHER DIGITAL
          </span>
          <h3 className="font-black text-base text-slate-900 dark:text-white mt-0.5">
            {voucher.brand} · Diskon {voucher.diskonPersen}%
          </h3>
        </div>

        {/* Voucher Info Card */}
        <div
          className="p-4 rounded-2xl mb-4 border relative overflow-hidden text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${platformColor} 0%, #0f172a 100%)`,
            borderColor: `${platformColor}40`,
          }}
        >
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wider">
              {platform}
            </span>
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Aktif
            </span>
          </div>

          <div className="flex items-center gap-3.5 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 border border-white/20">
              {voucher.brandLogo || "🍽️"}
            </div>
            <div>
              <h4 className="font-black text-sm text-white leading-snug line-clamp-2">
                {voucher.namaVoucher}
              </h4>
              <p className="text-xs text-white/80 mt-0.5">{voucher.brand} Indonesia</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/15 flex justify-between items-baseline">
            <div>
              <span className="text-xs text-white/60 line-through mr-2">
                Rp {voucher.hargaAsli.toLocaleString("id-ID")}
              </span>
              <span className="text-xl font-black text-white">
                Rp {voucher.hargaDiskon.toLocaleString("id-ID")}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-white text-slate-900 text-xs font-black shadow">
              -{voucher.diskonPersen}%
            </span>
          </div>
        </div>

        {/* Digital Barcode Kasir Box */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 text-center mb-4 shadow-inner">
          <div className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
            BARCODE KASIR (SCAN & REDEEM)
          </div>

          {/* Barcode SVG Container */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden my-2 shadow-sm">
            <svg width="260" height="48" viewBox="0 0 260 48" className="max-w-full block">
              {barcodeBars.map((bar, idx) => (
                <rect key={idx} x={bar.x} y="2" width={bar.width} height="44" fill="#111827" />
              ))}
            </svg>
          </div>

          <div className="font-mono text-sm font-black tracking-widest text-slate-900 dark:text-white mt-1">
            {serialVoucher}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Tunjukkan barcode ini ke kasir <strong>{voucher.brand}</strong> untuk potongan harga saat memesan.
          </p>
        </div>

        {/* Online Promo Code Box */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center mb-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Kode Promo Online
            </div>
            <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
              {promoCode}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-1.5 active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Tersalin" : "Salin Kode"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Main Launch Button (Deep link to TikTok app) */}
          <button
            type="button"
            onClick={handleLaunchApp}
            className="w-full py-3.5 rounded-2xl text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{
              backgroundColor: platformColor,
              boxShadow: `0 8px 20px ${platformColor}40`,
            }}
          >
            <span>🚀</span>
            <span>Buka di Aplikasi {platform.includes("TikTok") ? `TikTok (@${tiktokUsername})` : platform}</span>
            <ExternalLink className="w-4 h-4 ml-0.5" />
          </button>

          {/* Maps Direction Link */}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center border border-slate-200 dark:border-slate-700"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Petunjuk Arah Outlet Terdekat</span>
          </a>
        </div>
      </div>
    </div>
  );
}
