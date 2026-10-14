"use client";

import React from "react";
import { Sparkles, Moon, Sun, User as UserIcon, LogIn, LogOut } from "lucide-react";

interface NavbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenProfile,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors duration-200 border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <span className="text-xl font-bold">🎓</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-300 bg-clip-text text-transparent">
                Sahabat Mahasiswa
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                <Sparkles className="w-2.5 h-2.5" /> Portal Kampus
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Kosan &bull; Makan Murah &bull; Dompet &bull; Tugas &bull; Magang
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label="Ganti Tema"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* User Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "User Avatar"}
                    className="w-7 h-7 rounded-full object-cover border border-indigo-500"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {(user.name || user.email || "M")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline max-w-[120px] truncate">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>
              <button
                onClick={onLogout}
                title="Keluar"
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/25 transition-all"
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
