"use client";

import React from "react";
import { Home, Tag, Wallet, CheckSquare, Briefcase } from "lucide-react";

export type TabKey = "kosan" | "voucher" | "dompet" | "tugas" | "kerja";

interface BottomNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { key: "kosan", label: "Cari Kos", icon: Home },
    { key: "voucher", label: "Diskon", icon: Tag },
    { key: "dompet", label: "Dompet", icon: Wallet },
    { key: "tugas", label: "Tugas", icon: CheckSquare },
    { key: "kerja", label: "Magang", icon: Briefcase },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pb-2 sm:pb-4 flex justify-center px-3">
      <nav className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-indigo-950/20 rounded-2xl sm:rounded-3xl p-1.5 flex items-center justify-between gap-1 w-full max-w-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-100 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
