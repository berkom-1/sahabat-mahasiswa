"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { GraduationCap, Link2, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import BottomNav, { TabKey } from "@/components/BottomNav";
import KosanTab from "@/components/KosanTab";
import VoucherTab from "@/components/VoucherTab";
import DompetTab from "@/components/DompetTab";
import TugasTab from "@/components/TugasTab";
import KerjaTab from "@/components/KerjaTab";
import AuthModal from "@/components/AuthModal";
import ProfileModal from "@/components/ProfileModal";
import TikTokConfigModal from "@/components/TikTokConfigModal";

export default function Home() {
  const { data: session } = useSession();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("kosan");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [dismissDualBanner, setDismissDualBanner] = useState(false);

  // Sync Supabase Auth session
  useEffect(() => {
    async function initAuth() {
      try {
        const {
          data: { session: supaSession },
        } = await supabase.auth.getSession();
        setSupabaseUser(supaSession?.user ?? null);
      } catch (e) {
        console.warn("Error getting initial Supabase session:", e);
      }
    }
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSupabaseUser(currentSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync Dark/Light theme class on <html>
  useEffect(() => {
    const savedTheme = localStorage.getItem("sm_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Sync custom profile avatar
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  useEffect(() => {
    const loadCachedAvatar = () => {
      try {
        const cached = localStorage.getItem("sm_user_profile_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.avatar_url) setCustomAvatar(parsed.avatar_url);
        }
      } catch (_) {}
    };

    loadCachedAvatar();
    window.addEventListener("sm_profile_updated", loadCachedAvatar);
    return () => window.removeEventListener("sm_profile_updated", loadCachedAvatar);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("sm_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Active user data (from Google NextAuth or Supabase Auth)
  const activeUser = session?.user
    ? {
        id: session.user.email || "nextauth-user",
        name: session.user.name,
        email: session.user.email,
        image: customAvatar || session.user.image,
      }
    : supabaseUser
    ? {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.nama || supabaseUser.email?.split("@")[0],
        email: supabaseUser.email,
        image: customAvatar || null,
      }
    : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (session) {
      await nextAuthSignOut({ redirect: false });
    }
    setSupabaseUser(null);
  };

  // Check Dual Account Status
  let authMeta: any = {};
  if (typeof window !== "undefined") {
    try {
      authMeta = JSON.parse(localStorage.getItem("sm_auth_metadata") || "{}");
    } catch (_) {}
  }

  const isGoogleLogin = !!session?.user || !!activeUser?.email?.includes("@gmail.com");
  const isCampusLogin =
    !isGoogleLogin &&
    (!!activeUser?.email?.includes(".ac.id") ||
      !!activeUser?.email?.includes("kampus.uc.id") ||
      !!activeUser?.email?.includes(".edu"));

  const showGoogleAddCampusBanner =
    activeUser && isGoogleLogin && !authMeta.student_email && !dismissDualBanner;
  const showCampusAddGoogleBanner =
    activeUser && isCampusLogin && !authMeta.google_linked && !dismissDualBanner;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        user={activeUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenTikTokConfig={() => setShowTikTokModal(true)}
        onLogout={handleLogout}
      />

      {/* Dual Account Smart Banner */}
      {showGoogleAddCampusBanner && (
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white px-4 py-2.5 text-xs shadow-md border-b border-indigo-500/30">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-base">🎓</span>
              <span>
                Masuk via Google terhubung! <strong>Tambahkan email kampusmu (@kampus.uc.id)</strong> untuk membuka status Mahasiswa Terverifikasi.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="px-3 py-1 bg-white text-indigo-700 font-black rounded-lg hover:bg-indigo-50 transition shadow-sm"
              >
                + Tambah Email Kampus
              </button>
              <button
                type="button"
                onClick={() => setDismissDualBanner(true)}
                className="p-1 hover:bg-white/20 rounded-md transition text-white/80 hover:text-white"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCampusAddGoogleBanner && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2.5 text-xs shadow-md border-b border-blue-500/30">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-base">🔵</span>
              <span>
                Akun Mahasiswa aktif! <strong>Tautkan akun Google pribadimu</strong> untuk opsi masuk cepat 1-klik di perangkat lain.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="px-3 py-1 bg-white text-blue-700 font-black rounded-lg hover:bg-blue-50 transition shadow-sm"
              >
                Tautkan Google
              </button>
              <button
                type="button"
                onClick={() => setDismissDualBanner(true)}
                className="p-1 hover:bg-white/20 rounded-md transition text-white/80 hover:text-white"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-5">
        {activeTab === "kosan" && <KosanTab />}
        {activeTab === "voucher" && <VoucherTab />}
        {activeTab === "dompet" && <DompetTab userId={activeUser?.id} />}
        {activeTab === "tugas" && <TugasTab userId={activeUser?.id} />}
        {activeTab === "kerja" && <KerjaTab />}
      </main>

      {/* Floating Bottom Dock Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={activeUser}
        onLogout={handleLogout}
      />

      {/* TikTok Config Modal */}
      <TikTokConfigModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
        userId={activeUser?.id}
      />
    </div>
  );
}
