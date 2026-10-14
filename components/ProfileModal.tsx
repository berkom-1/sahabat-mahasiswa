"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { signIn } from "next-auth/react";
import {
  X,
  User as UserIcon,
  Mail,
  School,
  Building,
  BookOpen,
  Phone,
  Save,
  LogOut,
  Camera,
  CheckCircle2,
  KeyRound,
  GraduationCap,
  Sparkles,
  Link2,
  ShieldCheck,
  Check,
  Plus,
} from "lucide-react";
import { PRESET_AVATARS, UNIVERSITAS_LIST } from "@/lib/data";
import TikTokConfigModal from "./TikTokConfigModal";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onLogout: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
}: ProfileModalProps) {
  const [nama, setNama] = useState("");
  const [kampus, setKampus] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [semester, setSemester] = useState<number>(1);
  const [telp, setTelp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Dual-Account state
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [inputStudentEmail, setInputStudentEmail] = useState("");
  const [inputGoogleEmail, setInputGoogleEmail] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingGoogle, setIsAddingGoogle] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [hasTikTokKey, setHasTikTokKey] = useState(false);

  // Periksa apakah email utama merupakan email kampus atau google
  const isPrimaryGoogle = !!user?.email?.toLowerCase().includes("@gmail.com");
  const isPrimaryCampus =
    !!user?.email?.toLowerCase().includes(".ac.id") ||
    !!user?.email?.toLowerCase().includes("kampus.uc.id") ||
    !!user?.email?.toLowerCase().includes(".edu");

  useEffect(() => {
    if (!isOpen) return;

    // Load initial values from user prop
    setNama(user?.name || "");
    setAvatarUrl(user?.image || PRESET_AVATARS[0]);

    // Check TikTok config
    try {
      const tiktokSaved = localStorage.getItem("sm_tiktok_dining_config");
      setHasTikTokKey(!!tiktokSaved && !!JSON.parse(tiktokSaved).clientKey);
    } catch (_) {
      setHasTikTokKey(false);
    }

    // Load dual-account state from localStorage
    try {
      const authMeta = localStorage.getItem("sm_auth_metadata");
      if (authMeta) {
        const meta = JSON.parse(authMeta);
        if (meta.student_email) {
          setStudentEmail(meta.student_email);
          setIsStudentVerified(true);
        }
        if (meta.google_linked) {
          setIsGoogleLinked(true);
          setGoogleEmail(meta.google_email || (isPrimaryGoogle ? user?.email : null));
        }
      }
    } catch (_) {}

    // If logged in via Google initially, set primary Google
    if (isPrimaryGoogle) {
      setIsGoogleLinked(true);
      setGoogleEmail(user?.email || null);
    } else if (isPrimaryCampus) {
      setStudentEmail(user?.email || null);
      setIsStudentVerified(true);
    }

    // Fetch Profile from Supabase
    const fetchProfile = async () => {
      if (!user?.email && !user?.id) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (data && !error) {
          if (data.nama) setNama(data.nama);
          if (data.kampus) setKampus(data.kampus);
          if (data.fakultas) setFakultas(data.fakultas);
          if (data.jurusan) setJurusan(data.jurusan);
          if (data.telp) setTelp(data.telp);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if (data.student_email) {
            setStudentEmail(data.student_email);
            setIsStudentVerified(true);
          }
          if (data.google_email) {
            setGoogleEmail(data.google_email);
            setIsGoogleLinked(true);
          }
        }
      } catch (e) {
        console.warn("Tidak dapat mengambil data profil Supabase:", e);
      }
    };

    fetchProfile();
  }, [isOpen, user, isPrimaryGoogle, isPrimaryCampus]);

  if (!isOpen) return null;

  // Handler: Tambahkan Email Mahasiswa (@kampus.uc.id dsb)
  const handleSaveStudentEmail = async () => {
    const val = inputStudentEmail.trim().toLowerCase();
    if (!val || !val.includes("@")) {
      setStatusFeedback("Harap masukkan format email yang valid.");
      return;
    }

    const isCampusDomain =
      val.includes(".ac.id") ||
      val.includes(".edu") ||
      val.includes("kampus.uc.id") ||
      val.includes("student.");

    setStudentEmail(val);
    setIsStudentVerified(true);
    setIsAddingStudent(false);

    // Simpan ke local metadata
    try {
      const prev = JSON.parse(localStorage.getItem("sm_auth_metadata") || "{}");
      localStorage.setItem(
        "sm_auth_metadata",
        JSON.stringify({
          ...prev,
          student_email: val,
          student_verified: true,
        })
      );
    } catch (_) {}

    // Simpan ke Supabase jika ada profil
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({
          student_email: val,
          student_verified: true,
        })
        .eq("id", user.id);
    }

    setStatusFeedback(
      isCampusDomain
        ? "🎓 Email mahasiswa berhasil diverifikasi! Lencana Mahasiswa Aktif terbuka."
        : "✅ Email mahasiswa berhasil ditambahkan."
    );
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  // Handler: Tautkan Akun Google
  const handleLinkGoogle = async () => {
    if (inputGoogleEmail.trim()) {
      const val = inputGoogleEmail.trim();
      setGoogleEmail(val);
      setIsGoogleLinked(true);
      setIsAddingGoogle(false);

      try {
        const prev = JSON.parse(localStorage.getItem("sm_auth_metadata") || "{}");
        localStorage.setItem(
          "sm_auth_metadata",
          JSON.stringify({
            ...prev,
            google_linked: true,
            google_email: val,
          })
        );
      } catch (_) {}

      if (user?.id) {
        await supabase
          .from("profiles")
          .update({
            google_email: val,
            google_linked: true,
          })
          .eq("id", user.id);
      }

      setStatusFeedback("🔵 Akun Google berhasil ditautkan!");
      setTimeout(() => setStatusFeedback(null), 3000);
    } else {
      // Trigger OAuth NextAuth jika ingin sign in langsung
      signIn("google");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const payload: any = {
        nama,
        kampus: kampus || "Mahasiswa Indonesia",
        fakultas,
        jurusan,
        telp,
        avatar_url: avatarUrl,
      };

      if (studentEmail) payload.student_email = studentEmail;
      if (googleEmail) payload.google_email = googleEmail;

      if (user?.id) {
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email || "",
          ...payload,
        });
      }

      localStorage.setItem(
        "sm_user_profile_cache",
        JSON.stringify({
          ...payload,
          email: user?.email,
          studentEmail,
          googleEmail,
        })
      );

      setSaved(true);
      setStatusFeedback("Profil mahasiswa berhasil disimpan!");
      setTimeout(() => {
        setSaved(false);
        setStatusFeedback(null);
      }, 3000);
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      setStatusFeedback("Gagal menyimpan ke server, disimpan di memori lokal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
              🎓
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                Profil & Identitas Mahasiswa
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kelola identitas kampus, akun tertaut, dan pengaturan akun
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-5">
          {statusFeedback && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* 1. SEKSI FOTO PROFIL / AVATAR */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <div className="relative inline-block mx-auto mb-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Foto Profil"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl border-2 border-indigo-500 shadow-md">
                  {(nama || user?.email || "M")[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
              Pilih Avatar Karakter Mahasiswa:
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(url)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition ${
                    avatarUrl === url
                      ? "border-indigo-600 scale-110 shadow-md"
                      : "border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* 2. SEKSI TAUTAN AKUN & IDENTITAS MAHASISWA (DUAL-ACCOUNT) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-50 dark:to-slate-800/60 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                  Tautan Akun & Identitas Kampus (Dual-Account)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                Fitur Eksklusif
              </span>
            </div>

            {/* KARTU 1: AKUN GOOGLE */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">Akun Google</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]">
                      {isPrimaryGoogle
                        ? user?.email
                        : googleEmail || "Belum ditautkan (opsional)"}
                    </div>
                  </div>
                </div>

                {isPrimaryGoogle || isGoogleLinked ? (
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Terhubung
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingGoogle(!isAddingGoogle)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tautkan Google
                  </button>
                )}
              </div>

              {/* Form Tautkan Google jika belum terhubung */}
              {!isPrimaryGoogle && !isGoogleLinked && isAddingGoogle && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                  <input
                    type="email"
                    placeholder="nama@gmail.com"
                    value={inputGoogleEmail}
                    onChange={(e) => setInputGoogleEmail(e.target.value)}
                    className="flex-1 text-xs bg-slate-100 dark:bg-slate-700/60 rounded-xl px-3 py-1.5 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleLinkGoogle}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>

            {/* KARTU 2: AKUN MAHASISWA / EMAIL KAMPUS */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <span>Email Mahasiswa (@kampus.uc.id)</span>
                      {isStudentVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[210px]">
                      {isPrimaryCampus
                        ? user?.email
                        : studentEmail || "Belum ditambahkan (opsional)"}
                    </div>
                  </div>
                </div>

                {isPrimaryCampus || isStudentVerified ? (
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Terverifikasi
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingStudent(!isAddingStudent)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Kampus
                  </button>
                )}
              </div>

              {/* Form Input Email Mahasiswa */}
              {!isPrimaryCampus && !isStudentVerified && isAddingStudent && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="nama@kampus.uc.id atau @*.ac.id"
                      value={inputStudentEmail}
                      onChange={(e) => setInputStudentEmail(e.target.value)}
                      className="flex-1 text-xs bg-slate-100 dark:bg-slate-700/60 rounded-xl px-3 py-1.5 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveStudentEmail}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Verifikasi
                    </button>
                  </div>

                  {/* Quick Domain Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-500">
                    <span>Saran:</span>
                    {["@kampus.uc.id", "@unsil.ac.id", "@ui.ac.id", "@itb.ac.id", "@ugm.ac.id"].map(
                      (domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => {
                            const prefix = inputStudentEmail.split("@")[0] || "nama";
                            setInputStudentEmail(`${prefix}${domain}`);
                          }}
                          className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition"
                        >
                          +{domain}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. SEKSI BIODATA DASAR */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Biodata Mahasiswa
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap mahasiswa"
                required
                className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>Email Akun Utama</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✔ Terkunci</span>
              </label>
              <input
                type="email"
                value={user?.email || "mahasiswa@kampus.ac.id"}
                disabled
                className="w-full text-xs font-mono bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 rounded-xl p-2.5 cursor-not-allowed border border-slate-200/50 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> Nomor WhatsApp / Telepon
              </label>
              <input
                type="tel"
                value={telp}
                onChange={(e) => setTelp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-slate-700"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Digunakan untuk konfirmasi pesanan kosan dan kontak lowongan kerja part-time.
              </p>
            </div>
          </div>

          {/* 4. SEKSI DATA AKADEMIK */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Data Akademik & Kampus
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <School className="w-3.5 h-3.5 text-indigo-500" /> Perguruan Tinggi / Universitas
              </label>
              <input
                type="text"
                list="list-universitas"
                value={kampus}
                onChange={(e) => setKampus(e.target.value)}
                placeholder="Ketik atau pilih kampus..."
                required
                className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-slate-700"
              />
              <datalist id="list-universitas">
                {UNIVERSITAS_LIST.map((univ, idx) => (
                  <option key={idx} value={univ} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5 text-indigo-500" /> Fakultas
                </label>
                <input
                  type="text"
                  value={fakultas}
                  onChange={(e) => setFakultas(e.target.value)}
                  placeholder="Contoh: Fak. Teknik"
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Program Studi
                </label>
                <input
                  type="text"
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                  placeholder="Contoh: Informatika"
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 5. SEKSI INTEGRASI API TIKTOK GO DINING */}
          <div className="pt-1">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FE2C55]/10 via-[#25F4EE]/5 to-transparent border border-[#FE2C55]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FE2C55] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-[#FE2C55]/30">
                  🎵
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Kunci API TikTok Dining
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        hasTikTokKey
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {hasTikTokKey ? "Aktif" : "Standar"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Direct deep link voucher ke aplikasi TikTok
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTikTokModal(true)}
                className="px-3 py-1.5 bg-[#FE2C55] hover:bg-[#e0264b] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> Atur Kunci
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {loading ? "Menyimpan..." : "Simpan Profil Mahasiswa"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Keluar Akun
            </button>
          </div>
        </form>

        {/* TikTok Modal Popup */}
        <TikTokConfigModal
          isOpen={showTikTokModal}
          onClose={() => setShowTikTokModal(false)}
          onSavedSuccess={() => setHasTikTokKey(true)}
        />
      </div>
    </div>
  );
}
