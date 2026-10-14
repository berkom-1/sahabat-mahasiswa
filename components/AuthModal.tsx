"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, Sparkles, AlertCircle, CheckCircle2, GraduationCap, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [authType, setAuthType] = useState<"campus" | "google">("campus");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [optionalGoogle, setOptionalGoogle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCampusEmail = (val: string) => {
    const v = val.toLowerCase();
    return (
      v.includes(".ac.id") ||
      v.includes(".edu") ||
      v.includes("kampus.uc.id") ||
      v.includes("student.") ||
      v.includes("mhs.")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const isCampus = isCampusEmail(email);

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Simpan status login lokal
        localStorage.setItem(
          "sm_auth_metadata",
          JSON.stringify({
            provider: isCampus ? "campus_email" : "email",
            student_email: isCampus ? email : null,
            student_verified: isCampus,
            google_linked: false,
          })
        );
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nama: nama || "Mahasiswa",
              student_email: isCampus ? email : null,
              student_verified: isCampus,
              kampus: isCampus ? "Kampus Terverifikasi" : "Mahasiswa Indonesia",
            },
          },
        });
        if (error) throw error;

        // Simpan status registrasi lokal
        localStorage.setItem(
          "sm_auth_metadata",
          JSON.stringify({
            provider: isCampus ? "campus_email" : "email",
            student_email: isCampus ? email : null,
            student_verified: isCampus,
            google_linked: false,
          })
        );
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e?.message || "Terjadi kesalahan autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Menandai bahwa login berasal dari Google dan dapat menambahkan email kampus setelahnya
    localStorage.setItem(
      "sm_auth_metadata",
      JSON.stringify({
        provider: "google",
        google_linked: true,
        student_email: null,
        student_verified: false,
        prompt_student_email: true, // trigger opsi tambah email mahasiswa
      })
    );
    signIn("google");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative my-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white mx-auto flex items-center justify-center text-2xl mb-2 shadow-md shadow-indigo-600/25">
            🎓
          </div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white">
            {mode === "login" ? "Masuk Akun Mahasiswa" : "Daftar Akun Baru"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Mendukung login Akun Kampus (@kampus.uc.id / @*.ac.id) & Akun Google (Dual-Account).
          </p>
        </div>

        {/* Tab Pilihan Metode Login */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5 text-xs font-black">
          <button
            type="button"
            onClick={() => setAuthType("campus")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authType === "campus"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Email Kampus</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthType("google")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authType === "google"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Akun Google</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* METODE 1: AKUN GOOGLE */}
        {authType === "google" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h4 className="font-black text-xs text-slate-800 dark:text-white">
                Masuk Cepat 1-Klik dengan Google
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Setelah masuk dengan Google, kamu dapat <strong>opsional menambahkan email mahasiswa (@kampus.uc.id)</strong> di menu profil untuk verifikasi diskon & promo eksklusif.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-black transition-all shadow-md active:scale-[0.98]"
            >
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>
        ) : (
          /* METODE 2: AKUN MAHASISWA / EMAIL KAMPUS */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap Mahasiswa
                </label>
                <input
                  type="text"
                  placeholder="contoh: Farrel Pratama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-2xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Kampus / Mahasiswa
                </label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> @kampus.uc.id / @*.ac.id
                </span>
              </div>
              <input
                type="email"
                placeholder="nama@kampus.uc.id atau nama@mahasiswa.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-2xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {email && isCampusEmail(email) && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Domain kampus terdeteksi! Lencana Mahasiswa Aktif akan diberikan.</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter sandi aman"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-2xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Opsi Tautkan Google (Dual-Account Banner) */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
              <span className="text-base">💡</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                <strong>Opsi Dual-Account:</strong> Setelah login dengan email kampus ini, kamu juga bisa <strong>menautkan akun Google pribadimu</strong> di menu edit profil agar bisa login lewat Google kapan saja.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all mt-2 disabled:opacity-75 active:scale-[0.98]"
            >
              {loading ? "Memproses Akun..." : mode === "login" ? "Masuk Akun Kampus" : "Daftarkan Akun Mahasiswa"}
            </button>
          </form>
        )}

        {/* Switch Login / Register Footer */}
        <div className="mt-4 text-center border-t border-slate-100 dark:border-slate-800 pt-3.5">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMsg(null);
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            {mode === "login"
              ? "Belum punya akun? Daftar akun mahasiswa sekarang"
              : "Sudah punya akun? Masuk langsung ke portal"}
          </button>
        </div>
      </div>
    </div>
  );
}
