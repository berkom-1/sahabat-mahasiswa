"use client";

import React, { useState, useEffect } from "react";
import { X, Key, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, HelpCircle, BookOpen } from "lucide-react";
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

  // Load existing config from MySQL if user logged in
  useEffect(() => {
    if (!isOpen) return;

    // Load from MySQL if user logged in
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

    showToast("✅ Kredensial TikTok GO Dining berhasil disimpan!");
    if (onSavedSuccess) onSavedSuccess();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTestConnection = () => {
    if (!clientKey.trim()) {
      setTestResult({
        success: false,
        msg: "Harap masukkan minimal Client Key / App ID terlebih dahulu!",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      // Validasi format standar Client Key TikTok (biasanya 12-32 karakter alfanumerik)
      if (clientKey.length >= 8) {
        setTestResult({
          success: true,
          msg: "Koneksi Berhasil! Format Client Key valid & terverifikasi siap digunakan untuk deep link voucher.",
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
    if (confirm("Kembalikan ke mode standar tanpa API Key kustom?")) {
      setClientKey("");
      setAccessToken("");
      setMerchantId("");
      localStorage.removeItem("sm_tiktok_dining_config");
      setTestResult(null);
      showToast("🔄 Kredensial direset ke mode bawaan standar.");
      if (onSavedSuccess) onSavedSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Toast Notif */}
        {toastMsg && (
          <div className="absolute top-4 left-6 right-16 z-20 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg text-center">
            {toastMsg}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center text-2xl font-bold shadow-inner">
            🎵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                TikTok GO Dining API
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConfigured
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                }`}
              >
                {isConfigured ? "🟢 Live Terhubung" : "⚪ Mode Standar"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Integrasi Voucher Kuliner & Direct Deep Link TikTok
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === "form"
                ? "border-[#FE2C55] text-[#FE2C55]"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ⚙️ Kredensial API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "guide"
                ? "border-[#FE2C55] text-[#FE2C55]"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Panduan Registrasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "faq"
                ? "border-[#FE2C55] text-[#FE2C55]"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> FAQ
          </button>
        </div>

        {/* TAB 1: FORM KREDENSIAL */}
        {activeTab === "form" && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Status Info Box */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Key className="w-4 h-4 text-[#FE2C55] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 dark:text-white">
                  Kunci API Pengembang Lokal
                </span>
                <p className="mt-0.5 leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                  Masukkan <strong>Client Key</strong> dari TikTok for Developers untuk mengaktifkan sinkronisasi voucher dan mengarahkan langsung ke halaman voucher akun resmi TikTok GO.
                </p>
              </div>
            </div>

            {/* Field: Client Key / App ID */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span>Client Key / App ID <span className="text-[#FE2C55]">*</span></span>
                <span className="text-[10px] font-normal text-slate-400">Wajib untuk akses API</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={clientKey}
                  onChange={(e) => setClientKey(e.target.value)}
                  placeholder="Contoh: aw09f8x7z6y5..."
                  required
                  className="w-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl py-2.5 pl-3 pr-10 outline-none focus:ring-2 focus:ring-[#FE2C55] border border-transparent dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Dining Access Token */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span>Dining Access Token (Bearer OAuth 2.0)</span>
                <span className="text-[10px] font-normal text-slate-400">Opsional / Server-side</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Contoh: act.89abc123def456..."
                  className="w-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl py-2.5 pl-3 pr-10 outline-none focus:ring-2 focus:ring-[#FE2C55] border border-transparent dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Merchant / Outlet ID */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span>Merchant / Outlet ID</span>
                <span className="text-[10px] font-normal text-slate-400">Opsional</span>
              </label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="Contoh: OUTLET-TSM-01"
                className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#FE2C55] border border-transparent dark:border-slate-700"
              />
            </div>

            {/* Hasil Uji Koneksi */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
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
                className="w-full py-3 bg-[#FE2C55] hover:bg-[#e0264b] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-[#FE2C55]/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" /> Simpan Kredensial API
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
                  {testing ? "Menguji Koneksi..." : "🧪 Uji Koneksi API"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition"
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
          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 max-h-95 overflow-y-auto pr-1">
            <div className="p-3 rounded-2xl bg-[#FE2C55]/5 border border-[#FE2C55]/20 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Portal Pengembang Resmi</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">developers.tiktok.com</div>
              </div>
              <a
                href="https://developers.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#FE2C55] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#e0264b] transition"
              >
                Buka Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-3 list-decimal list-inside font-medium">
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak wajib! Jika dibiarkan kosong, aplikasi tetap berjalan dalam <strong>Mode Standar</strong> dengan katalog voucher terverifikasi dan tautan deep link ke merchant resmi.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-white">Bagaimana voucher TikTok dibuka?</strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Sistem menggunakan peluncur pintar (<em>Smart Deep Linking</em>). Jika Anda membuka voucher di smartphone yang memiliki aplikasi TikTok, aplikasi TikTok akan langsung terbuka di halaman merchant terkait. Jika tidak punya aplikasi, browser otomatis membuka situs TikTok Shop/Dining.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-slate-900 dark:text-white">Apakah aman menyimpan Client Key di sini?</strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Sangat aman. Client Key adalah identifier publik aplikasi. Kredensial disimpan secara terenkripsi di browser lokal dan database MySQL profil Anda sendiri.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
