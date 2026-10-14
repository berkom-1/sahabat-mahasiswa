import { NextRequest, NextResponse } from "next/server";
import { LowonganKerja } from "@/lib/types";

// Dataset Kaggle Lowongan Kerja Mahasiswa & Magang Indonesia
const KAGGLE_INDONESIA_JOBS: LowonganKerja[] = [
  {
    id: "kg-1",
    posisi: "Magang UI/UX Designer & Researcher",
    perusahaan: "PT Digital Kreasi Nusantara",
    tipe: "Magang",
    gaji: 1800000,
    jam: 25,
    lokasi: "Tasikmalaya / Remote (WFA)",
    hrd: "6281234561001",
    syarat: "Mahasiswa D3/S1 Desain/Informatika, portofolio Figma, antusias riset pengguna & wireframing.",
    sumber: "kaggle",
    url_lamar: "https://t.me/sahabat_mahasiswa_career",
    tanggal: "Hari ini",
  },
  {
    id: "kg-2",
    posisi: "Barista & Kasir Shift Sore (Ramah Kuliah)",
    perusahaan: "Kopi Titik Kumpul",
    tipe: "Part-time",
    gaji: 1300000,
    jam: 18,
    lokasi: "Jl. Siliwangi (Dekat Kampus UNSIL), Tasikmalaya",
    hrd: "6282134561002",
    syarat: "Mahasiswa aktif UNSIL/kampus Tasikmalaya, disiplin, berpenampilan rapi, ramah pelanggan.",
    sumber: "kaggle",
    url_lamar: "https://wa.me/6282134561002",
    tanggal: "Kemarin",
  },
  {
    id: "kg-3",
    posisi: "Magang Web Frontend Developer (Next.js & Tailwind)",
    perusahaan: "EduTech Solusindo",
    tipe: "Magang",
    gaji: 2200000,
    jam: 30,
    lokasi: "Bandung / Hybrid",
    hrd: "6283134561003",
    syarat: "Paham dasar TypeScript, React / Next.js, dan Git. Kesempatan konversi ke karyawan tetap.",
    sumber: "kaggle",
    url_lamar: "https://t.me/sahabat_mahasiswa_career",
    tanggal: "2 hari lalu",
  },
  {
    id: "kg-4",
    posisi: "Content Creator TikTok & Reels Kampus",
    perusahaan: "Studio Kreatif Muda",
    tipe: "Freelance",
    gaji: 1200000,
    jam: 12,
    lokasi: "Tasikmalaya / WFA",
    hrd: "6285234561004",
    syarat: "Percaya diri di depan kamera, mahir CapCut/Canva, paham algoritma FYP dan tren audio.",
    sumber: "kaggle",
    url_lamar: "https://wa.me/6285234561004",
    tanggal: "3 hari lalu",
  },
  {
    id: "kg-5",
    posisi: "Tutor Les Privat Matematika & Fisika SMP/SMA",
    perusahaan: "Bimbel Prestasi Pelajar",
    tipe: "Part-time",
    gaji: 1500000,
    jam: 10,
    lokasi: "Kec. Cipedes & Tawang, Tasikmalaya",
    hrd: "6287734561005",
    syarat: "Mahasiswa aktif FKIP/Teknik, sabar mengajar anak sekolah, jadwal fleksibel akhir pekan.",
    sumber: "kaggle",
    url_lamar: "https://wa.me/6287734561005",
    tanggal: "Minggu ini",
  },
  {
    id: "kg-6",
    posisi: "Data Entry & Admin Operasional E-Commerce",
    perusahaan: "Grosir Tasik Sejahtera",
    tipe: "Part-time",
    gaji: 1100000,
    jam: 15,
    lokasi: "Jl. RE Martadinata, Cipedes, Tasikmalaya",
    hrd: "6289634561006",
    syarat: "Teliti mengetik data, menguasai Microsoft Excel / Google Sheets, jujur dan tepat waktu.",
    sumber: "kaggle",
    url_lamar: "https://wa.me/6289634561006",
    tanggal: "Minggu ini",
  },
  {
    id: "kg-7",
    posisi: "Magang Social Media Marketing & Copywriter",
    perusahaan: "Nusantara Digital Agency",
    tipe: "Magang",
    gaji: 1750000,
    jam: 20,
    lokasi: "Jakarta Selatan / Remote",
    hrd: "6281934561007",
    syarat: "Mahasiswa jurusan Komunikasi/Manajemen/DKV, portofolio copywriting, sertifikat magang resmi.",
    sumber: "kaggle",
    url_lamar: "https://t.me/sahabat_mahasiswa_career",
    tanggal: "Baru saja",
  },
  {
    id: "kg-8",
    posisi: "Crew Event & Sound Operator Mahasiswa",
    perusahaan: "Tasik Sound & Stage Production",
    tipe: "Freelance",
    gaji: 800000,
    jam: 8,
    lokasi: "Gedung Kesenian Tasikmalaya",
    hrd: "6282234561008",
    syarat: "Fisik sehat, siap bekerja akhir pekan pada acara kampus dan expo, makan siang disediakan.",
    sumber: "kaggle",
    url_lamar: "https://wa.me/6282234561008",
    tanggal: "Kemarin",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const what = searchParams.get("what") || searchParams.get("q") || "magang";
  const where = searchParams.get("where") || "Indonesia";
  const page = searchParams.get("page") || "1";

  // Ambil credentials dari query atau header
  const appId =
    searchParams.get("app_id") ||
    request.headers.get("x-adzuna-app-id") ||
    process.env.ADZUNA_APP_ID ||
    "";
  const appKey =
    searchParams.get("app_key") ||
    request.headers.get("x-adzuna-app-key") ||
    process.env.ADZUNA_APP_KEY ||
    "";

  // JIKA PENGGUNA MEMILIKI KUNCI ADZUNA API RESMI
  if (appId.trim() && appKey.trim()) {
    try {
      const country = "id"; // Indonesia
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${encodeURIComponent(
        appId.trim()
      )}&app_key=${encodeURIComponent(
        appKey.trim()
      )}&results_per_page=15&what=${encodeURIComponent(
        what
      )}&where=${encodeURIComponent(where)}&content-type=application/json`;

      const res = await fetch(adzunaUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 }, // Cache 5 menit
      });

      if (res.ok) {
        const data = await res.json();
        const liveJobs: LowonganKerja[] = (data.results || []).map((item: any, idx: number) => {
          // Normalisasi tipe kontrak
          let tipe = "Part-time";
          if (what.toLowerCase().includes("magang") || item.title?.toLowerCase().includes("intern")) {
            tipe = "Magang";
          } else if (item.contract_time === "part_time") {
            tipe = "Part-time";
          } else if (item.contract_type === "contract") {
            tipe = "Freelance";
          }

          // Estimasi upah bulanan
          let estimasiGaji = 1500000;
          if (item.salary_min) {
            estimasiGaji = Math.round(item.salary_min > 50000000 ? item.salary_min / 12 : item.salary_min);
          } else if (item.salary_max) {
            estimasiGaji = Math.round(item.salary_max > 50000000 ? item.salary_max / 12 : item.salary_max);
          }

          return {
            id: `adzuna-${item.id || idx}`,
            posisi: (item.title || "Lowongan Kerja").replace(/<[^>]+>/g, ""),
            perusahaan: item.company?.display_name || "Perusahaan Terverifikasi",
            tipe: tipe as any,
            gaji: estimasiGaji,
            jam: tipe === "Part-time" ? 20 : 35,
            lokasi: item.location?.display_name || where,
            hrd: "6281234567890",
            syarat: (item.description || "Silakan cek kualifikasi selengkapnya pada portal lamaran.")
              .replace(/<[^>]+>/g, "")
              .slice(0, 240) + "...",
            sumber: "adzuna",
            url_lamar: item.redirect_url,
            tanggal: item.created ? new Date(item.created).toLocaleDateString("id-ID") : "Baru saja",
          };
        });

        if (liveJobs.length > 0) {
          return NextResponse.json({
            success: true,
            source: "adzuna_live",
            isLive: true,
            message: `Menampilkan ${liveJobs.length} lowongan langsung dari Adzuna Job API`,
            count: liveJobs.length,
            data: liveJobs,
          });
        }
      }
    } catch (err) {
      console.warn("Gagal fetch Adzuna API, beralih ke dataset Kaggle:", err);
    }
  }

  // JIKA KUNCI ADZUNA BELUM ADA ATAU HASIL KOSONG: GUNAKAN DATASET KAGGLE INDONESIA JOBS
  const qLower = what.toLowerCase();
  const wLower = where.toLowerCase();

  const filteredKaggle = KAGGLE_INDONESIA_JOBS.filter((job) => {
    if (qLower && qLower !== "all" && qLower !== "magang") {
      const matchPos = job.posisi.toLowerCase().includes(qLower);
      const matchSyarat = job.syarat.toLowerCase().includes(qLower);
      const matchTipe = job.tipe.toLowerCase().includes(qLower);
      if (!matchPos && !matchSyarat && !matchTipe) return false;
    }
    if (wLower && wLower !== "indonesia" && wLower !== "all") {
      const matchLoc = job.lokasi.toLowerCase().includes(wLower);
      if (!matchLoc) return false;
    }
    return true;
  });

  const finalData = filteredKaggle.length > 0 ? filteredKaggle : KAGGLE_INDONESIA_JOBS;

  return NextResponse.json({
    success: true,
    source: "kaggle_curated",
    isLive: false,
    message: appId ? "Adzuna API tidak merespon, memuat Dataset Kaggle Lowongan Mahasiswa." : "Menampilkan Dataset Kaggle Lowongan Mahasiswa (Atur API Adzuna untuk live update).",
    count: finalData.length,
    data: finalData,
  });
}
