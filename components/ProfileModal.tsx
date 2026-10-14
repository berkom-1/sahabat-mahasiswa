"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  X,
  User,
  School,
  BookOpen,
  Phone,
  LogOut,
  Camera,
  Trash2,
  Sparkles,
  KeyRound,
  Save,
  CheckCircle2,
  Building,
} from "lucide-react";
import { UNIVERSITAS_LIST, PRESET_AVATARS } from "@/lib/data";
import TikTokConfigModal from "./TikTokConfigModal";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id?: string; email?: string | null; name?: string | null; image?: string | null } | null;
  onLogout: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
}: ProfileModalProps) {
  const [nama, setNama] = useState(user?.name || "");
  const [kampus, setKampus] = useState("Universitas Siliwangi (UNSIL)");
  const [fakultas, setFakultas] = useState("Fakultas Teknik");
  const [jurusan, setJurusan] = useState("Informatika");
  const [telp, setTelp] = useState("081234567890");
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.image || "");
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [hasTikTokKey, setHasTikTokKey] = useState(false);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from localStorage & Supabase
  useEffect(() => {
    if (!isOpen) return;

    // Cek TikTok key status
    try {
      const savedCfg = localStorage.getItem("sm_tiktok_dining_config");
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        setHasTikTokKey(!!parsed.clientKey);
      }
    } catch (_) {}

    // Load local stored profile
    try {
      const localProfile = localStorage.getItem("sm_user_profile");
      if (localProfile) {
        const p = JSON.parse(localProfile);
        if (p.nama) setNama(p.nama);
        if (p.kampus) setKampus(p.kampus);
        if (p.fakultas) setFakultas(p.fakultas);
        if (p.jurusan) setJurusan(p.jurusan);
        if (p.telp) setTelp(p.telp);
        if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
      }
    } catch (_) {}

    // Fetch from Supabase
    async function fetchSupabaseProfile() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) {
          if (data.nama) setNama(data.nama);
          if (data.kampus) setKampus(data.kampus);
          if (data.fakultas) setFakultas(data.fakultas);
          if (data.jurusan) setJurusan(data.jurusan);
          if (data.telp) setTelp(data.telp);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if (data.tiktok_client_key) setHasTikTokKey(true);
        }
      } catch (err) {
        console.warn("Error fetching Supabase profile:", err);
      }
    }
    fetchSupabaseProfile();
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Handle Foto Upload (max 2MB, FileReader data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran foto maksimal 2 MB!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const profileData = {
      nama,
      kampus,
      fakultas,
      jurusan,
      telp,
      avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem("sm_user_profile", JSON.stringify(profileData));

    // Upsert to Supabase
    if (user?.id) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          nama,
          kampus,
          fakultas,
          jurusan,
          telp,
          avatar_url: avatarUrl,
          email: user.email,
        });
      } catch (err) {
        console.warn("Gagal simpan ke Supabase:", err);
      }
    }

    setLoading(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const initials = (nama || "Mahasiswa")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold shadow-inner">
              🎓
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                Pengaturan Profil Mahasiswa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi identitas akademik & integrasi eksternal
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          {/* Scrollable Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-4.5">
            {/* 1. SEKSI FOTO PROFIL & AVATAR */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
                <span>Foto Profil & Avatar</span>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus Foto
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3.5">
                {/* Avatar Preview */}
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white dark:border-slate-700 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Upload Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    Unggah Foto Baru
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    JPG/PNG, Maksimal 2MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Preset Avatars */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  Atau pilih avatar karakter siap pakai:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 transition hover:scale-105 ${
                        avatarUrl === url
                          ? "border-indigo-600 ring-2 ring-indigo-500/30"
                          : "border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. SEKSI INFORMASI PRIBADI */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Informasi Akun
              </h4>

              {/* Nama Lengkap */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" /> Nama Lengkap
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

              {/* Email (Readonly) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                  <span>Email Terverifikasi</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✔ Terkunci</span>
                </label>
                <input
                  type="email"
                  value={user?.email || "mahasiswa@kampus.ac.id"}
                  disabled
                  className="w-full text-xs font-mono bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 rounded-xl p-2.5 cursor-not-allowed border border-slate-200/50 dark:border-slate-800"
                />
              </div>

              {/* WhatsApp / Telp */}
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

            {/* 3. SEKSI DATA AKADEMIK */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Data Akademik & Kampus
              </h4>

              {/* Perguruan Tinggi (dengan Autocomplete Preset) */}
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

              {/* Fakultas & Jurusan Grid */}
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

            {/* 4. SEKSI INTEGRASI API TIKTOK GO DINING */}
            <div className="pt-2">
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
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar dari Akun Ini
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-Modal: TikTok Config */}
      <TikTokConfigModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
        userId={user?.id}
        onSavedSuccess={() => {
          setHasTikTokKey(true);
        }}
      />
    </>
  );
}
