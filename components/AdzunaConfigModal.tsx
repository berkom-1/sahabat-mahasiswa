"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { AdzunaConfig } from "@/lib/types";

interface AdzunaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedSuccess?: () => void;
}

export default function AdzunaConfigModal({
  isOpen,
  onClose,
  onSavedSuccess,
}: AdzunaConfigModalProps) {
  const [appId, setAppId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sm_adzuna_config");
        if (saved) return JSON.parse(saved).appId || "";
      } catch {}
    }
    return "";
  });
  const [appKey, setAppKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sm_adzuna_config");
        if (saved) return JSON.parse(saved).appKey || "";
      } catch {}
    }
    return "";
  });
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "guide">("form");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("sm_adzuna_config");
        if (saved) {
          const parsed: AdzunaConfig = JSON.parse(saved);
          setAppId(parsed.appId || "");
          setAppKey(parsed.appKey || "");
        }
      } catch {}
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isConfigured = !!appId.trim() && !!appKey.trim();

  // Test koneksi ke Adzuna API via Next.js internal route
  const handleTestConnection = async () => {
    if (!appId.trim() || !appKey.trim()) {
      setTestResult({
        success: false,
        msg: "Harap masukkan App ID dan App Key terlebih dahulu.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(
        `/api/jobs/adzuna?what=magang&where=Indonesia&app_id=${encodeURIComponent(
          appId.trim()
        )}&app_key=${encodeURIComponent(appKey.trim())}`
      );
      const data = await res.json();

      if (data.isLive) {
        setTestResult({
          success: true,
          msg: `Koneksi Berhasil! Terhubung ke Adzuna Job API (${data.count} lowongan live ditemukan).`,
        });
      } else {
        setTestResult({
          success: false,
          msg: "Koneksi gagal atau kredensial belum valid. Pastikan App ID & Key sudah benar dari developer.adzuna.com.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        msg: "Terjadi kendala jaringan saat menghubungi Adzuna API.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    try {
      const config: AdzunaConfig = {
        appId: appId.trim(),
        appKey: appKey.trim(),
        country: "id",
        active: !!appId.trim() && !!appKey.trim(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem("sm_adzuna_config", JSON.stringify(config));
      window.dispatchEvent(new Event("sm_adzuna_updated"));

      showToast("Kunci API Adzuna berhasil disimpan!");
      if (onSavedSuccess) onSavedSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error("Gagal menyimpan Adzuna config:", err);
      showToast("Gagal menyimpan ke penyimpanan lokal.");
    }
  };

  const handleReset = () => {
    setAppId("");
    setAppKey("");
    setTestResult(null);
    localStorage.removeItem("sm_adzuna_config");
    window.dispatchEvent(new Event("sm_adzuna_updated"));
    showToast("Kunci API Adzuna dihapus. Aplikasi kembali ke Dataset Kaggle.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-blue-600/10 via-indigo-600/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                Integrasi API Adzuna Lowongan Kerja
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sinkronisasi ribuan lowongan magang & part-time real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("form")}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === "form"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            Pengaturan API Key
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "guide"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cara Dapat Key Gratis</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {toastMsg && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
              <span>{toastMsg}</span>
            </div>
          )}

          {activeTab === "form" ? (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isConfigured
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300"
                }`}
              >
                {isConfigured ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                )}
                <div className="text-xs leading-relaxed">
                  <div className="font-black">
                    {isConfigured ? "Adzuna API Aktif" : "Mode Dataset Kaggle (Default)"}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {isConfigured
                      ? "Aplikasi menarik lowongan live langsung dari agregator Adzuna Indonesia."
                      : "Kunci API belum diisi. Aplikasi saat ini menampilkan kumpulan data lowongan mahasiswa dari Dataset Kaggle Indonesia."}
                  </div>
                </div>
              </div>

              {/* Form Input: App ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Adzuna App ID</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: a1b2c3d4"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
                />
              </div>

              {/* Form Input: App Key */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Adzuna App Key (Secret)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKey ? "Sembunyikan" : "Perlihatkan"}</span>
                  </button>
                </label>
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Contoh: e5f6g7h8i9j0k1l2m3n4..."
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
                />
              </div>

              {/* Test Connection Button */}
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !appId || !appKey}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
                  <span>{testing ? "Menguji Koneksi ke Adzuna..." : "Uji Koneksi API"}</span>
                </button>

                {testResult && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Kunci API
                </button>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Guide Tab */
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-medium">
                Adzuna menyediakan akses API pencarian lowongan kerja <strong>100% Gratis</strong> untuk pengembang aplikasi.
              </div>

              <ol className="list-decimal list-inside space-y-2.5 font-medium">
                <li>
                  Buka portal resmi pengembang Adzuna di:
                  <a
                    href="https://developer.adzuna.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
                  >
                    <span>developer.adzuna.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Klik tombol <strong>&quot;Get your API Key&quot;</strong> atau daftar akun developer gratis.
                </li>
                <li>
                  Isi nama aplikasi (misal: <em>Sahabat Mahasiswa</em>) dan verifikasi email Anda.
                </li>
                <li>
                  Salin <strong>App ID</strong> dan <strong>App Key</strong> yang tertera di dashboard Anda ke formulir di samping.
                </li>
              </ol>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Kembali ke Formulir Kunci API
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
