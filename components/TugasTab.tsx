"use client";

import React, { useState, useEffect } from "react";
import { Tugas } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  Flame,
  Check,
} from "lucide-react";

interface TugasTabProps {
  userId?: string | null;
}

const INITIAL_TUGAS: Tugas[] = [
  {
    id: "task-1",
    nama_tugas: "Laporan Praktikum Basis Data (MySQL & SQL)",
    deadline: "2026-10-30",
    bobot: 3, // Berat
    selesai: false,
  },
  {
    id: "task-2",
    nama_tugas: "Resume Jurnal Etika Profesi Bab 4",
    deadline: "2026-11-02",
    bobot: 1, // Ringan
    selesai: false,
  },
  {
    id: "task-3",
    nama_tugas: "Kuis Online Algoritma & Pemrograman",
    deadline: "2026-10-28",
    bobot: 2, // Sedang
    selesai: false,
  },
];

export default function TugasTab({ userId }: TugasTabProps) {
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [activeFilter, setActiveFilter] = useState<"aktif" | "selesai">("aktif");
  const [weightFilter, setWeightFilter] = useState<number | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [namaTugas, setNamaTugas] = useState("");
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bobot, setBobot] = useState<number>(2);

  // Close modal on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddModal(false);
    };
    if (showAddModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

  // Load Tasks from MySQL
  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await apiClient.getTugas(userId || undefined);
        if (data && data.length > 0) {
          setTugasList(data);
          return;
        }
      } catch (err) {
        console.warn("Gagal fetch MySQL tugas:", err);
      }

      // Fallback LocalStorage
      const local = localStorage.getItem("sahabat_mahasiswa_tugas");
      if (local) {
        try {
          setTugasList(JSON.parse(local));
        } catch {
          setTugasList(INITIAL_TUGAS);
        }
      } else {
        setTugasList(INITIAL_TUGAS);
      }
    }
    loadTasks();
  }, [userId]);

  const updateTugas = (newList: Tugas[]) => {
    setTugasList(newList);
    localStorage.setItem("sahabat_mahasiswa_tugas", JSON.stringify(newList));
  };

  // Toggle Finish in MySQL
  const handleToggleSelesai = async (id: string, currentSelesai: boolean) => {
    const nextVal = !currentSelesai;
    try {
      await apiClient.updateTugas(id, { selesai: nextVal });
    } catch (err) {
      console.warn("Gagal update tugas di MySQL:", err);
    }
    updateTugas(tugasList.map((t) => (t.id === id ? { ...t, selesai: nextVal } : t)));
  };

  // Add Task to MySQL
  const handleAddTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTugas.trim()) return;

    let createdId = "task-" + Date.now();
    try {
      const created = await apiClient.addTugas({
        user_id: userId || undefined,
        nama_tugas: namaTugas.trim(),
        deadline,
        bobot,
        selesai: false,
      });
      if (created?.id) {
        createdId = created.id;
      }
    } catch (err) {
      console.warn("Gagal insert tugas ke MySQL:", err);
    }

    const newTask: Tugas = {
      id: createdId,
      user_id: userId || undefined,
      nama_tugas: namaTugas.trim(),
      deadline,
      bobot,
      selesai: false,
    };

    updateTugas([newTask, ...tugasList]);
    setNamaTugas("");
    setShowAddModal(false);
  };

  // Delete Task from MySQL
  const handleDeleteTugas = async (id: string) => {
    try {
      await apiClient.deleteTugas(id);
    } catch (err) {
      console.warn("Gagal hapus tugas di MySQL:", err);
    }
    updateTugas(tugasList.filter((t) => t.id !== id));
  };

  // Remaining days helper
  const getDaysLeft = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeCount = tugasList.filter((t) => !t.selesai).length;
  const urgentCount = tugasList.filter((t) => !t.selesai && getDaysLeft(t.deadline) <= 2 && getDaysLeft(t.deadline) >= 0).length;
  const completedCount = tugasList.filter((t) => t.selesai).length;

  const filteredTasks = tugasList
    .filter((t) => {
      if (activeFilter === "aktif" && t.selesai) return false;
      if (activeFilter === "selesai" && !t.selesai) return false;
      if (weightFilter !== "all" && t.bobot !== weightFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const daysA = getDaysLeft(a.deadline);
      const daysB = getDaysLeft(b.deadline);
      if (daysA !== daysB) return daysA - daysB;
      return b.bobot - a.bobot;
    });

  return (
    <div className="space-y-6 pb-24">
      {/* 1. TOP STATS CARDS (Luxury 3-col grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Aktif */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tugas Aktif Berjalan
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {activeCount} Tugas
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Deadline Mendesak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Deadline Mendesak (&le; 2 hari)
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
              {urgentCount} Tugas
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Selesai */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Telah Diselesaikan
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {completedCount} Tugas
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. SUB-FILTER PILLS & TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status & Priority Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveFilter("aktif")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "aktif"
                ? "border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            Aktif ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("selesai")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "selesai"
                ? "border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            Selesai ({completedCount})
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-emerald-900/40 mx-1" />

          {/* Bobot Filter Pills */}
          {[
            { val: "all", label: "Semua Bobot" },
            { val: 3, label: "Bobot Berat" },
            { val: 2, label: "Sedang" },
            { val: 1, label: "Ringan" },
          ].map((w) => (
            <button
              key={w.label}
              type="button"
              onClick={() => setWeightFilter(w.val as number | "all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                weightFilter === w.val
                  ? "border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold"
                  : "border border-slate-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tugas</span>
        </button>
      </div>

      {/* 3. TASK CARDS GRID (Hide.com luxury cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((t) => {
          const daysLeft = getDaysLeft(t.deadline);
          const isOverdue = daysLeft < 0;
          const isToday = daysLeft === 0;
          const isUrgent = daysLeft <= 2 && daysLeft >= 0;

          return (
            <div
              key={t.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs ${
                t.selesai
                  ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-70"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isOverdue
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                        : isToday
                        ? "bg-rose-500 text-white"
                        : isUrgent
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isOverdue
                      ? `Terlambat ${Math.abs(daysLeft)} hari`
                      : isToday
                      ? "Deadline Hari Ini!"
                      : `${daysLeft} hari lagi`}
                  </span>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      t.bobot === 3
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                        : t.bobot === 2
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {t.bobot === 3 ? "Bobot Berat" : t.bobot === 2 ? "Bobot Sedang" : "Bobot Ringan"}
                  </span>
                </div>

                {/* Task Title */}
                <h3
                  className={`font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 ${
                    t.selesai ? "line-through text-slate-400 dark:text-slate-500" : ""
                  }`}
                >
                  {t.nama_tugas}
                </h3>
              </div>

              {/* Bottom Meta & Action Row */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.deadline}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleSelesai(t.id, t.selesai)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      t.selesai
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{t.selesai ? "Batal" : "Selesai"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTugas(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-400 max-w-md mx-auto shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <div className="font-bold text-slate-900 dark:text-white text-base">
            Tidak Ada Tugas di Kategori Ini
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Semua tugas terselesaikan atau belum ada tugas yang dicatat.
          </p>
        </div>
      )}

      {/* MODAL TAMBAH TUGAS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Tambah Tugas Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTugas} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Nama Tugas / Mata Kuliah
                </label>
                <input
                  type="text"
                  required
                  value={namaTugas}
                  onChange={(e) => setNamaTugas(e.target.value)}
                  placeholder="Contoh: Makalah Pancasila Bab 2..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Tenggat Waktu (Deadline)
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Tingkat Bobot / Urgensi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: "Ringan" },
                    { val: 2, label: "Sedang" },
                    { val: 3, label: "Berat" },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => setBobot(b.val)}
                      className={`py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        bobot === b.val
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
