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
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pb-2 sm:pb-3 flex justify-center px-4">
      <nav className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl p-1.5 flex items-center justify-between gap-1 w-full max-w-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2]" />
              <span className="text-xs tracking-normal mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
