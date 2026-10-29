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
    <div className="fixed bottom-4 left-0 right-0 z-30 pointer-events-none flex justify-center px-4 animate-in fade-in slide-in-from-bottom-2">
      <nav className="pointer-events-auto bg-white/90 dark:bg-[#0c111d]/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-full p-1.5 flex items-center justify-between gap-1 w-full max-w-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-800 dark:bg-emerald-700 text-white font-semibold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 stroke-2" />
              <span className="text-[11px] tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
