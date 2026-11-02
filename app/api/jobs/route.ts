import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOWONGAN } from "@/lib/data";

export async function GET() {
  try {
    const rows = await prisma.lowonganKerja.findMany({
      orderBy: { id: "asc" },
    });

    const prismaJobs = rows.map((r) => {
      let parsedGaji = 500000;
      if (r.gaji) {
        parsedGaji = Number(r.gaji);
      }

      return {
        id: r.id,
        posisi: r.posisi,
        perusahaan: r.perusahaan || "Perusahaan Anonim",
        tipe: r.tipe || "Part-time",
        gaji: parsedGaji,
        jam: r.jam || 4,
        lokasi: r.lokasi,
        hrd: r.hrd || "",
        syarat: r.syarat || "Mahasiswa aktif UNSIL / Tasikmalaya",
        sumber: "prisma_sahabat_mahasiswa",
        url_lamar: r.url_lamar || `mailto:${r.hrd}`,
      };
    });

    const merged = [...prismaJobs, ...DEFAULT_LOWONGAN];

    return NextResponse.json({
      success: true,
      count: merged.length,
      data: merged,
    });
  } catch (error) {
    console.error("GET Jobs Error (Prisma):", error);
    return NextResponse.json({
      success: true,
      count: DEFAULT_LOWONGAN.length,
      data: DEFAULT_LOWONGAN,
    });
  }
}
