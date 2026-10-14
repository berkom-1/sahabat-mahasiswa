"use client";

import React, { useState, useEffect } from "react";
import { Tugas } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface TugasTabProps {
  userId?: string | null;
}

const INITIAL_TUGAS: Tugas[] = [
  {
    id: "task-1",
    nama_tugas: "Laporan Praktikum Basis Data (Supabase & SQL)",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    bobot: 3, // Berat
    selesai: false,
  },
  {
    id: "task-2",
    nama_tugas: "Resume Jurnal Etika Profesi Bab 4",
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    bobot: 1, // Ringan
    selesai: false,
  },
  {
    id: "task-3",
    nama_tugas: "Kuis Online Algoritma & Pemrograman",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
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
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [bobot, setBobot] = useState<number>(2);

  // Load Tasks
  useEffect(() => {
    async function loadTasks() {
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("tugas")
            .select("*")
            .eq("user_id", userId)
            .order("deadline", { ascending: true });

          if (!error && data && data.length > 0) {
            setTugasList(data as Tugas[]);
            return;
          }
        } catch (err) {
          console.warn("Gagal fetch Supabase tugas:", err);
        }
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

  // Toggle Finish
  const handleToggleSelesai = async (id: string, currentSelesai: boolean) => {
    const nextVal = !currentSelesai;
    if (userId) {
      try {
        await supabase.from("tugas").update({ selesai: nextVal }).eq("id", id);
      } catch (err) {
        console.warn("Gagal update tugas di Supabase:", err);
      }
    }
    updateTugas(tugasList.map((t) => (t.id === id ? { ...t, selesai: nextVal } : t)));
  };

  // Add Task
  const handleAddTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTugas.trim()) return;

    const newTask: Tugas = {
      id: "task-" + Date.now(),
      user_id: userId || undefined,
      nama_tugas: namaTugas.trim(),
      deadline,
      bobot,
      selesai: false,
    };

    if (userId) {
      try {
        const { error } = await supabase.from("tugas").insert([
          {
            user_id: userId,
            nama_tugas: newTask.nama_tugas,
            deadline: newTask.deadline,
            bobot: newTask.bobot,
            selesai: false,
          },
        ]);
        if (error) console.warn("Supabase insert tugas error:", error);
      } catch (err) {
        console.warn("Gagal insert tugas ke Supabase:", err);
      }
    }

    updateTugas([newTask, ...tugasList]);
    setNamaTugas("");
    setShowAddModal(false);
  };

  // Delete Task
  const handleDeleteTugas = async (id: string) => {
    if (userId) {
      try {
        await supabase.from("tugas").delete().eq("id", id);
      } catch (err) {
        console.warn("Gagal hapus tugas Supabase:", err);
      }
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
    <div className="space-y-6 pb-24">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
            <CheckSquare className="w-3.5 h-3.5 text-purple-200" /> Deadline & Priority Manager
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pengingat Tugas Kuliah
          </h1>
          <p className="text-purple-100 text-sm mt-1">
            Urutkan tugas berdasarkan tingkat urgensi deadline dan bobot kesulitan mata kuliah.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveFilter("aktif")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "aktif"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            Aktif ({tugasList.filter((t) => !t.selesai).length})
          </button>
          <button
            onClick={() => setActiveFilter("selesai")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "selesai"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            Selesai ({tugasList.filter((t) => t.selesai).length})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
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
              className={`p-4 rounded-3xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                t.selesai
                  ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Custom Checkbox */}
                <button
                  onClick={() => handleToggleSelesai(t.id, t.selesai)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    t.selesai
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-600"
                  }`}
                >
                  {t.selesai && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="min-w-0 flex-1">
                  <h4
                    className={`font-bold text-sm text-slate-900 dark:text-white truncate ${
                      t.selesai ? "line-through text-slate-400 dark:text-slate-500" : ""
                    }`}
                  >
                    {t.nama_tugas}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {/* Urgency Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isOverdue
                          ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          : isToday
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          : isUrgent
                          ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {isOverdue
                        ? `Terlewat ${Math.abs(daysLeft)} hari`
                        : isToday
                        ? "Hari Ini!"
                        : `${daysLeft} hari lagi`}
                    </span>

                    {/* Weight Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        t.bobot === 3
                          ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                          : t.bobot === 2
                          ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                          : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {t.bobot === 3 ? "🔥 Bobot Berat" : t.bobot === 2 ? "⚡ Sedang" : "🌱 Ringan"}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {t.deadline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteTugas(t.id)}
                className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-colors"
                title="Hapus Tugas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-slate-400 text-xs">
              {activeFilter === "aktif"
                ? "Hebat! Tidak ada tugas kuliah yang tertunda."
                : "Belum ada tugas yang diselesaikan."}
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Tugas */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Tambah Tugas Kuliah
            </h3>

            <form onSubmit={handleAddTugas} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nama Tugas / Mata Kuliah
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Makalah Pancasila Bab 2"
                  value={namaTugas}
                  onChange={(e) => setNamaTugas(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Batas Waktu (Deadline)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Bobot Kesulitan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: "🌱 Ringan" },
                    { val: 2, label: "⚡ Sedang" },
                    { val: 3, label: "🔥 Berat" },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => setBobot(b.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        bobot === b.val
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
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
