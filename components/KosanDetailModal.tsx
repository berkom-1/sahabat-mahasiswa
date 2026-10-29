"use client";

import React, { useEffect } from "react";
import { Kosan } from "@/lib/types";
import { formatWhatsAppUrl } from "@/lib/launcher";
import {
  X,
  MapPin,
  Navigation,
  MessageCircle,
  Star,
  Check,
  Share2,
  Database,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface KosanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kosan: Kosan | null;
  currentLocationName: string;
}

export default function KosanDetailModal({
  isOpen,
  onClose,
  kosan,
  currentLocationName,
}: KosanDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !kosan) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const mapDirectionUrl = `https://www.google.com/maps/dir/?api=1&destination=${kosan.lat},${kosan.lng}`;
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${kosan.lat},${kosan.lng}`;
  const waUrl = formatWhatsAppUrl(
    kosan.telp,
    `Halo pengelola ${kosan.nama}, saya melihat info kosan ini di aplikasi Sahabat Mahasiswa (jarak: ${kosan.jarak ?? 0} km dari ${currentLocationName}). Apakah saat ini masih ada kamar yang tersedia?`
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: kosan.nama,
        text: `Info Kosan: ${kosan.nama} (${formatRupiah(kosan.harga)}/bln). Lokasi: ${kosan.area}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Kosan: ${kosan.nama}\nHarga: ${formatRupiah(kosan.harga)}/bulan\nAlamat: ${kosan.area}\nMaps: ${mapDirectionUrl}`
      );
      alert("Info kosan berhasil disalin ke clipboard.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-xl overflow-hidden my-6 z-10">
        {/* Header Photo */}
        <div className="relative h-60 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={kosan.foto_url}
            alt={kosan.nama}
            className="w-full h-full object-cover"
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title="Tutup"
            className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges Left */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-3 py-1 rounded-md text-white ${
                kosan.tipe === "putri"
                  ? "bg-rose-700"
                  : kosan.tipe === "putra"
                  ? "bg-blue-700"
                  : "bg-emerald-700"
              }`}
            >
              Kos {kosan.tipe === "putri" ? "putri" : kosan.tipe === "putra" ? "putra" : "campur"}
            </span>

            {kosan.sumber === "mamikos_kaggle" && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-900/80 text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mamikos Kaggle</span>
              </span>
            )}
          </div>

          {/* Rating & Jarak Badges Bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-950/80 text-amber-300 text-xs font-medium px-3 py-1 rounded-md flex items-center gap-1 border border-slate-700 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{kosan.rating || 4.8} / 5.0</span>
            </div>

            {kosan.jarak !== undefined && (
              <div className="bg-slate-900/90 text-white text-xs font-medium px-3 py-1 rounded-md flex items-center gap-1.5 border border-slate-700 tabular-nums">
                <Navigation className="w-3.5 h-3.5 text-slate-300" />
                <span className="tabular-nums">{kosan.jarak} km dari {currentLocationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Title & Price */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {kosan.nama}
              </h2>
              {kosan.sisa_kamar && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 tabular-nums">
                  Tersedia sisa {kosan.sisa_kamar} kamar
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatRupiah(kosan.harga)}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">/ bulan</span>
            </div>
          </div>

          {/* Location Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                  {kosan.area}
                </p>
                {kosan.lat && kosan.lng && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                    Koordinat: {kosan.lat.toFixed(4)}, {kosan.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <span>Pin Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Facilities */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Fasilitas Kosan:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {kosan.fasilitas.map((f, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-normal flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp Pengelola</span>
              </a>

              <a
                href={mapDirectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Buka Rute Google Maps</span>
              </a>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Bagikan / Salin Info Kos Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
