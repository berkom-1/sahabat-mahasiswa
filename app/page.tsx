"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
        image: session.user.image,
      }
    : supabaseUser
    ? {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.nama || supabaseUser.email?.split("@")[0],
        email: supabaseUser.email,
        image: null,
      }
    : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (session) {
      await nextAuthSignOut({ redirect: false });
    }
    setSupabaseUser(null);
  };

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
