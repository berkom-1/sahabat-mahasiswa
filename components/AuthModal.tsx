"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { signIn } from "next-auth/react";
import { X, AlertCircle, GraduationCap, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState("");

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  // Quick 1-Click Demo Login (Mahasiswa UNSIL)
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const demoEmail = "mahasiswa@unsil.ac.id";
      const demoPassword = "password123";

      let res;
      try {
        res = await apiClient.login(demoEmail, demoPassword);
      } catch {
        // If not found in MySQL, auto-register demo user
        res = await apiClient.register({
          email: demoEmail,
          password: demoPassword,
          nama: "Rizky Ramadhan (Mahasiswa UNSIL)",
          kampus: "Universitas Siliwangi (UNSIL)",
          jurusan: "Informatika",
          student_email: demoEmail,
          student_verified: true,
        });
      }

      localStorage.setItem(
        "sm_auth_metadata",
        JSON.stringify({
          provider: "campus_email",
          student_email: demoEmail,
          student_verified: true,
          google_linked: false,
        })
      );

      if (res?.user) {
        localStorage.setItem("sm_mysql_user", JSON.stringify(res.user));
      }

      await signIn("credentials", {
        email: demoEmail,
        password: demoPassword,
        name: res?.user?.name || "Rizky Ramadhan (Mahasiswa UNSIL)",
        redirect: false,
      });

      onSuccess();
      onClose();
      window.location.reload();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e?.message || "Gagal masuk dengan akun demo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const isCampus = isCampusEmail(email);

      if (mode === "login") {
        const res = await apiClient.login(email.trim(), password);

        // Simpan status login lokal & sync dengan NextAuth session
        localStorage.setItem(
          "sm_auth_metadata",
          JSON.stringify({
            provider: isCampus ? "campus_email" : "email",
            student_email: isCampus ? email.trim() : res.user?.student_email || null,
            student_verified: isCampus || Boolean(res.user?.student_verified),
            google_linked: Boolean(res.user?.google_linked),
          })
        );

        if (res.user) {
          localStorage.setItem("sm_mysql_user", JSON.stringify(res.user));
        }

        await signIn("credentials", {
          email: res.user?.email || email.trim(),
          password,
          name: res.user?.name || email.split("@")[0],
          redirect: false,
        });
      } else {
        const res = await apiClient.register({
          email: email.trim(),
          password,
          nama: nama.trim() || "Mahasiswa",
          kampus: isCampus ? "Universitas Siliwangi (UNSIL)" : "Mahasiswa Indonesia",
          student_email: isCampus ? email.trim() : null,
          student_verified: isCampus,
        });

        // Simpan status registrasi lokal & sync dengan NextAuth session
        localStorage.setItem(
          "sm_auth_metadata",
          JSON.stringify({
            provider: isCampus ? "campus_email" : "email",
            student_email: isCampus ? email.trim() : null,
            student_verified: isCampus,
            google_linked: false,
          })
        );

        if (res.user) {
          localStorage.setItem("sm_mysql_user", JSON.stringify(res.user));
        }

        await signIn("credentials", {
          email: res.user?.email || email.trim(),
          password,
          name: res.user?.name || nama.trim() || email.split("@")[0],
          redirect: false,
        });
      }

      onSuccess();
      onClose();
      window.location.reload();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e?.message || "Terjadi kesalahan autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn("google", { redirect: false, callbackUrl: "/" });
      if (res?.error) {
        setErrorMsg("Kunci Google OAuth belum dikonfigurasi di file .env. Silakan gunakan form masuk cepat email di bawah.");
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      setErrorMsg("Kunci Google OAuth belum dikonfigurasi. Silakan gunakan form masuk cepat email di bawah.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanEmail = googleEmail.trim().toLowerCase();
      const userName = cleanEmail.split("@")[0];

      // Auto login or create
      localStorage.setItem(
        "sm_auth_metadata",
        JSON.stringify({
          provider: "google",
          google_linked: true,
          google_email: cleanEmail,
          student_email: null,
          student_verified: false,
          prompt_student_email: true,
        })
      );

      await signIn("credentials", {
        email: cleanEmail,
        name: userName,
        provider: "google",
        callbackUrl: "/",
        redirect: false,
      });

      onClose();
      window.location.reload();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e?.message || "Gagal masuk dengan email Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop overlay to click outside */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl relative my-6 animate-in zoom-in-95 duration-150 z-10">
        <button
          type="button"
          onClick={onClose}
          title="Tutup Modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Sahabat Mahasiswa Universitas Siliwangi"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">
            {mode === "login" ? "Masuk Akun Mahasiswa" : "Daftar Akun Baru"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Portal Sahabat Mahasiswa Universitas Siliwangi
          </p>
        </div>

        {/* Quick Demo Login Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Masuk Cepat dengan Akun Demo Mahasiswa UNSIL</span>
          </button>
        </div>

        {/* Tab Pilihan Metode Login */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthType("campus");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authType === "campus"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Email Kampus</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthType("google");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authType === "google"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* METODE 1: AKUN GOOGLE */}
        {authType === "google" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center mx-auto">
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
              <h4 className="font-semibold text-xs text-slate-800 dark:text-white">
                Masuk Cepat dengan Akun Google
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ketik email Google kamu untuk masuk instan ke akun mahasiswa.
              </p>
            </div>

            <div className="space-y-3">
              {/* Form Input Email Google Langsung */}
              <form onSubmit={handleGoogleEmailSubmit} className="space-y-2.5">
                <input
                  type="email"
                  placeholder="Masukkan email Google (contoh: nama@gmail.com)"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                  className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading || !googleEmail}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? "Menghubungkan..." : "Masuk Sekarang dengan Akun Google"}</span>
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="shrink mx-2 text-xs text-slate-400 font-medium">
                  atau OAuth resmi
                </span>
                <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <span>OAuth Google Resmi</span>
              </button>
            </div>
          </div>
        ) : (
          /* METODE 2: AKUN MAHASISWA / EMAIL KAMPUS */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap Mahasiswa
                </label>
                <input
                  type="text"
                  placeholder="contoh: Farrel Pratama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email Kampus / Mahasiswa
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> @kampus.ac.id
                </span>
              </div>
              <input
                type="email"
                placeholder="nama@kampus.ac.id atau nama@mahasiswa.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400"
              />
              {email && isCampusEmail(email) && (
                <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Domain kampus terdeteksi. Lencana Mahasiswa Aktif akan diberikan.</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter sandi aman"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            {/* Opsi Info Akun */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                <strong>Tips:</strong> Kamu juga bisa klik tombol <strong>Masuk Cepat Demo</strong> di atas untuk langsung mencoba semua fitur tanpa mendaftar.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors mt-2 disabled:opacity-75 cursor-pointer"
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
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:underline cursor-pointer"
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
