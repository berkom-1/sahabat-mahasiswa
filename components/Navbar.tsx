"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Moon, Sun, LogIn, LogOut, Music2 } from "lucide-react";

interface NavbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenTikTokConfig?: () => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenProfile,
  onOpenTikTokConfig,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors duration-200 border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-3 cursor-pointer group"
          title="Kembali ke atas"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900 group-hover:border-slate-400 dark:group-hover:border-slate-600 transition-colors">
            <Image
              src="/icon.png"
              alt="Sahabat Mahasiswa Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                Sahabat Mahasiswa
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    onOpenProfile();
                  } else {
                    onOpenAuth();
                  }
                }}
                title="Buka Portal Mahasiswa & Profil Kampus"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" /> Portal Kampus
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Kosan &bull; Diskon &bull; Dompet &bull; Tugas &bull; Magang
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* TikTok API Shortcut Button */}
          {onOpenTikTokConfig && (
            <button
              type="button"
              onClick={onOpenTikTokConfig}
              title="Pengaturan Kunci API TikTok GO Dining"
              className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
            >
              <Music2 className="w-4 h-4" />
              <span className="hidden lg:inline">API TikTok</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Ganti Tema"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "User Avatar"}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-xs">
                    {(user.name || user.email || "M")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline max-w-30 truncate">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Keluar"
                className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              id="btn-masuk-akun"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer select-none"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Akun</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
