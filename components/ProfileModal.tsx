"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, User, School, BookOpen, Phone, LogOut, Check } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id?: string; email?: string | null; name?: string | null } | null;
  onLogout: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
}: ProfileModalProps) {
  const [nama, setNama] = useState(user?.name || "");
  const [kampus, setKampus] = useState("Universitas Indonesia");
  const [jurusan, setJurusan] = useState("Teknik Informatika");
  const [telp, setTelp] = useState("081234567890");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setNama(user.name);
    // Fetch profile from Supabase if exists
    async function fetchProfile() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data && !error) {
          if (data.nama) setNama(data.nama);
          if (data.kampus) setKampus(data.kampus);
          if (data.jurusan) setJurusan(data.jurusan);
          if (data.telp) setTelp(data.telp);
        }
      } catch (err) {
        console.warn("Error load profile:", err);
      }
    }
    fetchProfile();
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (user?.id) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          nama,
          kampus,
          jurusan,
          telp,
          email: user.email,
        });
      } catch (err) {
        console.warn("Gagal simpan profil:", err);
      }
    }
    setLoading(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Profil Mahasiswa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {user?.email || "Akun Mahasiswa"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
              <School className="w-3.5 h-3.5 text-indigo-500" /> Asal Perguruan Tinggi / Kampus
            </label>
            <input
              type="text"
              value={kampus}
              onChange={(e) => setKampus(e.target.value)}
              required
              className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Program Studi / Jurusan
            </label>
            <input
              type="text"
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              required
              className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> Nomor WhatsApp Aktif
            </label>
            <input
              type="tel"
              value={telp}
              onChange={(e) => setTelp(e.target.value)}
              className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
