"use client";

import React, { useState, useEffect } from "react";
import { Tugas } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import {
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  AlertCircle,
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

  const filteredTasks = tugasList
    .filter((t) => (activeFilter === "aktif" ? !t.selesai : t.selesai))
    .sort((a, b) => {
      // Sort: closest deadline first, then highest weight
      const daysA = getDaysLeft(a.deadline);
      const daysB = getDaysLeft(b.deadline);
      if (daysA !== daysB) return daysA - daysB;
      return b.bobot - a.bobot;
    });

  return (
    <div className="space-y-4 pb-20">
      {/* Banner: Grounded Resting Dark Card */}
      <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-5 sm:p-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
          <CheckSquare className="w-3.5 h-3.5 text-slate-400" /> Deadline & Priority Manager
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Pengingat Tugas Kuliah
        </h1>
        <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
          Kelola tugas kuliah berdasarkan tenggat waktu deadline dan tingkat urgensi mata kuliah.
        </p>
      </div>

      {/* Filter Tabs & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFilter("aktif")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
              activeFilter === "aktif"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Aktif (<span className="tabular-nums">{tugasList.filter((t) => !t.selesai).length}</span>)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("selesai")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
              activeFilter === "selesai"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Selesai (<span className="tabular-nums">{tugasList.filter((t) => t.selesai).length}</span>)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tugas</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((t) => {
          const daysLeft = getDaysLeft(t.deadline);
          const isOverdue = daysLeft < 0;
          const isToday = daysLeft === 0;
          const isUrgent = daysLeft <= 2 && daysLeft >= 0;

          return (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                t.selesai
                  ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleSelesai(t.id, t.selesai)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                    t.selesai
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-300 dark:border-slate-600 hover:border-slate-500"
                  }`}
                  title={t.selesai ? "Tandai belum selesai" : "Tandai selesai"}
                >
                  {t.selesai && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="min-w-0 flex-1">
                  <h4
                    className={`font-semibold text-sm text-slate-900 dark:text-white truncate ${
                      t.selesai ? "line-through text-slate-400 dark:text-slate-500" : ""
                    }`}
                  >
                    {t.nama_tugas}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {/* Urgency Badge */}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 tabular-nums ${
                        isOverdue
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                          : isToday
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                          : isUrgent
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isOverdue
                        ? `Terlewat ${Math.abs(daysLeft)} hari`
                        : isToday
                        ? "Hari Ini!"
                        : `${daysLeft} hari lagi`}
                    </span>

                    {/* Weight Badge (Sentence Case, Clean Text) */}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                        t.bobot === 3
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                          : t.bobot === 2
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                      }`}
                    >
                      {t.bobot === 3 ? "Bobot Berat" : t.bobot === 2 ? "Bobot Sedang" : "Bobot Ringan"}
                    </span>

                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3 h-3 text-slate-400" /> {t.deadline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteTugas(t.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Hapus Tugas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {activeFilter === "aktif"
                ? "Tidak ada tugas kuliah yang tertunda."
                : "Belum ada tugas yang diselesaikan."}
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Tugas */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => setShowAddModal(false)}
            aria-hidden="true"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Tambah Tugas Kuliah
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTugas} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Tugas & Mata Kuliah
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Laporan Praktikum Jaringan Komputer"
                  value={namaTugas}
                  onChange={(e) => setNamaTugas(e.target.value)}
                  required
                  className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Tenggat Waktu (Deadline)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full text-xs font-normal bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400 tabular-nums cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Tingkat Kesulitan / Bobot
                </label>
                <select
                  value={bobot}
                  onChange={(e) => setBobot(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value={1}>Bobot Ringan (Resume, Kuis Kecil)</option>
                  <option value={2}>Bobot Sedang (Makalah, Tugas Mingguan)</option>
                  <option value={3}>Bobot Berat (Laporan Praktikum, Proyek Akhir)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
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
