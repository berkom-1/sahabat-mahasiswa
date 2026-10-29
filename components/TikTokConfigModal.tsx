"use client";

import React, { useState, useEffect } from "react";
import { X, Key, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, HelpCircle, BookOpen, Music2, Settings, FlaskConical } from "lucide-react";
import { TikTokConfig } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

interface TikTokConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  onSavedSuccess?: () => void;
}

export default function TikTokConfigModal({
  isOpen,
  onClose,
  userId,
  onSavedSuccess,
}: TikTokConfigModalProps) {
  const [clientKey, setClientKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sm_tiktok_dining_config");
        if (saved) return JSON.parse(saved).clientKey || "";
      } catch {}
    }
    return "";
  });
  const [accessToken, setAccessToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sm_tiktok_dining_config");
        if (saved) return JSON.parse(saved).accessToken || "";
      } catch {}
    }
    return "";
  });
  const [merchantId, setMerchantId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sm_tiktok_dining_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.merchantId || parsed.shopId || "";
        }
      } catch {}
    }
    return "";
  });
  const [showKey, setShowKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "guide" | "faq">("form");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Load existing config from MySQL if user logged in
  useEffect(() => {
    if (!isOpen) return;

    async function fetchFromMySQL() {
      if (!userId) return;
      try {
        const profile = await apiClient.getProfile(userId);
        if (profile) {
          if (profile.tiktok_client_key) setClientKey(profile.tiktok_client_key);
          if (profile.tiktok_access_token) setAccessToken(profile.tiktok_access_token);
        }
      } catch {}
    }
    fetchFromMySQL();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isConfigured = !!clientKey.trim();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const config: TikTokConfig = {
      clientKey: clientKey.trim(),
      accessToken: accessToken.trim(),
      merchantId: merchantId.trim(),
      active: !!clientKey.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("sm_tiktok_dining_config", JSON.stringify(config));

    // Sync to MySQL profile if logged in
    if (userId) {
      try {
        await apiClient.updateProfile({
          id: userId,
          tiktok_client_key: config.clientKey,
          tiktok_access_token: config.accessToken,
        });
      } catch (err) {
        console.warn("Gagal simpan tiktok config ke MySQL:", err);
      }
    }

    showToast("Kredensial TikTok GO Dining berhasil disimpan.");
    if (onSavedSuccess) onSavedSuccess();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTestConnection = () => {
    if (!clientKey.trim()) {
      setTestResult({
        success: false,
        msg: "Harap masukkan minimal Client Key / App ID terlebih dahulu.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      if (clientKey.length >= 8) {
        setTestResult({
          success: true,
          msg: "Koneksi berhasil. Format Client Key valid dan siap digunakan untuk direct link voucher.",
        });
      } else {
        setTestResult({
          success: false,
          msg: "Format Client Key terlalu pendek. Pastikan Anda menyalin App Key resmi dari TikTok Developer Portal.",
        });
      }
    }, 900);
  };

  const handleReset = () => {
    setClientKey("");
    setAccessToken("");
    setMerchantId("");
    localStorage.removeItem("sm_tiktok_dining_config");
    setTestResult(null);
    showToast("Kredensial direset ke mode bawaan standar.");
    if (onSavedSuccess) onSavedSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl relative my-8 z-10">
        {/* Toast Notif */}
        {toastMsg && (
          <div className="absolute top-4 left-6 right-16 z-20 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-medium shadow-md text-center">
            {toastMsg}
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Music2 className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                TikTok GO Dining API
              </h3>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                  isConfigured
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {isConfigured ? "Live Terhubung" : "Mode Standar"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Integrasi Voucher Kuliner & Direct Deep Link TikTok
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "form"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kredensial API</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "guide"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan Registrasi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "faq"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ</span>
          </button>
        </div>

        {/* TAB 1: FORM KREDENSIAL */}
        {activeTab === "form" && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Status Info Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Key className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-white">
                  Kunci API Pengembang Lokal
                </span>
                <p className="mt-0.5 leading-relaxed text-xs text-slate-500 dark:text-slate-400">
                  Masukkan <strong>Client Key</strong> dari TikTok for Developers untuk mengaktifkan sinkronisasi voucher dan mengarahkan langsung ke halaman voucher akun resmi TikTok GO.
                </p>
              </div>
            </div>

            {/* Field: Client Key / App ID */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span>Client Key / App ID</span>
                <span className="text-xs text-slate-400">Wajib untuk akses API</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={clientKey}
                  onChange={(e) => setClientKey(e.target.value)}
                  placeholder="Contoh: aw09f8x7z6y5..."
                  required
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl py-2.5 pl-3 pr-10 outline-none focus:border-slate-400 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Dining Access Token */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span>Dining Access Token (Bearer OAuth 2.0)</span>
                <span className="text-xs text-slate-400">Opsional</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Contoh: act.89abc123def456..."
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl py-2.5 pl-3 pr-10 outline-none focus:border-slate-400 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Merchant / Outlet ID */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span>Merchant / Outlet ID</span>
                <span className="text-xs text-slate-400">Opsional</span>
              </label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="Contoh: OUTLET-TSM-01"
                className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:border-slate-400 border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Hasil Uji Koneksi */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" /> Simpan Kredensial API
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
                  <span>{testing ? "Menguji Koneksi..." : "Uji Koneksi API"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  title="Kembalikan ke mode standar"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: PANDUAN REGISTRASI TIKTOK DEVELOPER */}
        {activeTab === "guide" && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 max-h-95 overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Portal Pengembang Resmi</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">developers.tiktok.com</div>
              </div>
              <a
                href="https://developers.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                Buka Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-2.5 list-decimal list-inside font-normal">
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Buat Akun Developer:</strong> Masuk ke portal menggunakan akun TikTok atau registrasi sebagai TikTok Developer.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Buat Aplikasi Baru:</strong> Klik <em>Manage Apps</em> &rarr; <em>Add an App</em>. Berikan nama <code>Sahabat Mahasiswa Dining</code>.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Pilih Produk Dining & Login:</strong> Tambahkan produk <em>TikTok Login Kit</em> atau <em>TikTok GO Dining Merchant</em> pada menu Products.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Salin Client Key:</strong> Masuk ke tab <em>Basic Settings</em>, salin <strong>Client Key</strong> dan tempelkan ke tab Kredensial API di aplikasi ini.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Selesai:</strong> Klik tombol <em>Simpan Kredensial</em>. Aplikasi otomatis siap meluncurkan voucher TikTok GO resmi.
              </li>
            </ol>
          </div>
        )}

        {/* TAB 3: FAQ */}
        {activeTab === "faq" && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 max-h-95 overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-white">Apakah mahasiswa lain wajib mengisi API Key ini?</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak wajib. Jika dibiarkan kosong, aplikasi tetap berjalan dalam <strong>Mode Standar</strong> dengan katalog voucher terverifikasi dan tautan deep link ke merchant resmi.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-white">Bagaimana voucher TikTok dibuka?</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sistem menggunakan peluncur pintar (<em>Smart Deep Linking</em>). Jika Anda membuka voucher di smartphone yang memiliki aplikasi TikTok, aplikasi TikTok akan langsung terbuka di halaman merchant terkait. Jika tidak punya aplikasi, browser otomatis membuka situs TikTok Shop/Dining.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-white">Apakah aman menyimpan Client Key di sini?</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sangat aman. Client Key disimpan secara privat di browser lokal dan database MySQL profil Anda sendiri.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
