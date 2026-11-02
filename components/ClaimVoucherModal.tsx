"use client";

import React, { useState, useEffect } from "react";
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

// Generator Serial Voucher Deterministik
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

  if (!isOpen || !voucher) return null;

  const bKey = voucher.brandKey || voucher.brand.toLowerCase().replace(/\s+/g, "");
  const outlet: Outlet | undefined = OUTLETS[bKey];
  const platform = voucher.platform || "TikTok GO Dining";
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
    onToast(`Kode promo ${promoCode} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchApp = () => {
    bukaAplikasiPlatform(voucher, onToast);
  };

  const mapQuery = voucher.mapQuery || outlet?.mapQuery || `${voucher.brand} Tasikmalaya`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl relative my-6 z-10 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Title */}
        <div className="text-center pr-6">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Klaim Voucher Digital
          </span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5 tabular-nums">
            {voucher.brand} &bull; Diskon {voucher.diskonPersen}%
          </h3>
        </div>

        {/* Voucher Info Card: Grounded Resting Style */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {platform}
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Aktif
            </span>
          </div>

          <div className="pt-1">
            <h4 className="font-bold text-sm text-white leading-snug line-clamp-2">
              {voucher.namaVoucher}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{voucher.brand} Indonesia</p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
            <div>
              <span className="text-xs text-slate-400 line-through mr-2 tabular-nums">
                Rp {voucher.hargaAsli.toLocaleString("id-ID")}
              </span>
              <span className="text-xl font-bold text-white tabular-nums">
                Rp {voucher.hargaDiskon.toLocaleString("id-ID")}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white text-slate-900 text-xs font-bold tabular-nums">
              -{voucher.diskonPersen}%
            </span>
          </div>
        </div>

        {/* Digital Barcode Kasir Box */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Barcode Kasir (Scan & Redeem)
          </div>

          {/* Barcode SVG Container */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-center items-center overflow-hidden my-2">
            <svg width="260" height="48" viewBox="0 0 260 48" className="max-w-full block">
              {barcodeBars.map((bar, idx) => (
                <rect key={idx} x={bar.x} y="2" width={bar.width} height="44" fill="#111827" />
              ))}
            </svg>
          </div>

          <div className="font-mono text-xs font-bold tracking-widest text-slate-900 dark:text-white mt-1 tabular-nums">
            {serialVoucher}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Tunjukkan barcode ini ke kasir <strong>{voucher.brand}</strong> untuk potongan harga langsung.
          </p>
        </div>

        {/* Online Promo Code Box */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kode Promo Online
            </div>
            <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
              {promoCode}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Tersalin" : "Salin Kode"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Main Launch Button */}
          <button
            type="button"
            onClick={handleLaunchApp}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Buka di Aplikasi {platform.includes("TikTok") ? `TikTok (@${tiktokUsername})` : platform}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Maps Direction Link */}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors text-center border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Petunjuk Arah Outlet Terdekat</span>
          </a>
        </div>
      </div>
    </div>
  );
}
