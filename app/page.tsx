"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { X, GraduationCap, ShieldCheck } from "lucide-react";

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
import { getCoordinatesForLocation } from "@/lib/data";

interface LocalMySQLUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

export default function Home() {
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<LocalMySQLUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("kosan");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [dismissDualBanner, setDismissDualBanner] = useState(false);

  // Shared Search & Location State for Hide.com Navbar + Kosan
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState<number | "all">(10);
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    area: string;
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("sm_user_profile_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.kampus && parsed.kampus.trim()) {
            return getCoordinatesForLocation(parsed.kampus);
          }
        }
      } catch {}
    }
    return getCoordinatesForLocation("Universitas Siliwangi (UNSIL)");
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleGetLiveGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({
          name: "Lokasi GPS Saya Saat Ini",
          lat,
          lng,
          area: "Koordinat GPS Pengguna",
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Sync MySQL user from local cache
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedUser = localStorage.getItem("sm_mysql_user");
        if (savedUser) {
          setLocalUser(JSON.parse(savedUser));
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync Dark/Light theme class on <html>
  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
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
      } catch {}
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

  // Active user data (from Google NextAuth or MySQL Login)
  const activeUser = session?.user
    ? {
        id: (session.user as { id?: string }).id || session.user.email || "user-1",
        name: session.user.name,
        email: session.user.email,
        image: customAvatar || session.user.image,
      }
    : localUser
    ? {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        image: customAvatar || localUser.avatar_url || null,
      }
    : null;

  const handleLogout = async () => {
    localStorage.removeItem("sm_mysql_user");
    localStorage.removeItem("sm_auth_metadata");
    localStorage.removeItem("sm_user_profile_cache");
    if (session) {
      await nextAuthSignOut({ redirect: false });
    }
    setLocalUser(null);
    window.location.reload();
  };

  // Check Dual Account Status
  interface AuthMetadata {
    student_email?: string | null;
    google_linked?: boolean;
    provider?: string;
  }
  let authMeta: AuthMetadata = {};
  if (typeof window !== "undefined") {
    try {
      authMeta = JSON.parse(localStorage.getItem("sm_auth_metadata") || "{}");
    } catch {}
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
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans overflow-x-clip">
      {/* Navbar with Hide.com Segmented Floating Search */}
      <Navbar
        user={activeUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenTikTokConfig={() => setShowTikTokModal(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeTab !== "kosan" && activeTab !== "voucher") {
            setActiveTab("kosan");
          }
        }}
        radius={radius}
        onRadiusChange={setRadius}
        campusName={currentLocation.name}
        onCampusChange={(cName) => setCurrentLocation(getCoordinatesForLocation(cName))}
        onGetLiveGPS={handleGetLiveGPS}
        gpsLoading={gpsLoading}
      />

      {/* Dual Account Smart Banner */}
      {showGoogleAddCampusBanner && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Masuk via Google terhubung. <strong>Tambahkan email kampusmu (@kampus.ac.id)</strong> untuk membuka status Mahasiswa Terverifikasi.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="px-3 py-1 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                + Tambah Email Kampus
              </button>
              <button
                type="button"
                onClick={() => setDismissDualBanner(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCampusAddGoogleBanner && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Akun Mahasiswa aktif. <strong>Tautkan akun Google pribadimu</strong> untuk opsi masuk cepat 1-klik di perangkat lain.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="px-3 py-1 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Tautkan Google
              </button>
              <button
                type="button"
                onClick={() => setDismissDualBanner(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (Wide 7xl Container for 4-Column Luxury Layout) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 overflow-x-clip">
        {activeTab === "kosan" && (
          <KosanTab
            onOpenProfile={() => setShowProfileModal(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            maxRadius={radius}
            setMaxRadius={setRadius}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            onGetLiveGPS={handleGetLiveGPS}
            gpsLoading={gpsLoading}
          />
        )}
        {activeTab === "voucher" && <VoucherTab />}
        {activeTab === "dompet" && <DompetTab userId={activeUser?.id} />}
        {activeTab === "tugas" && <TugasTab userId={activeUser?.id} />}
        {activeTab === "kerja" && <KerjaTab />}
      </main>

      {/* Floating Luxury Dock Navigation */}
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
