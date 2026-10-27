import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { LowonganKerja } from "@/lib/types";
import { DEFAULT_LOWONGAN } from "@/lib/data";

interface JobRow extends RowDataPacket {
  id: number;
  title: string;
  company_name: string;
  type: string;
  work_system: string;
  salary_range: string;
  location: string;
  requirements: string | string[] | null;
  application_url_or_email: string;
  is_open: number;
  description: string;
}

export async function GET() {
  try {
    const rows = await query<JobRow[]>(
      "SELECT * FROM job_vacancies WHERE is_open = 1 ORDER BY id ASC"
    );

    const mysqlJobs: LowonganKerja[] = rows.map((r) => {
      let parsedGaji = 500000;
      if (r.salary_range) {
        const match = r.salary_range.replace(/\./g, "").match(/\d+/);
        if (match) parsedGaji = parseInt(match[0], 10);
      }

      let reqs = "";
      if (typeof r.requirements === "string") {
        reqs = r.requirements;
      } else if (Array.isArray(r.requirements)) {
        reqs = r.requirements.join(", ");
      }

      const typeMap: Record<string, string> = {
        part_time: "Part-time",
        internship: "Magang",
        freelance: "Freelance",
      };

      return {
        id: r.id,
        posisi: r.title,
        perusahaan: r.company_name,
        tipe: typeMap[r.type] || "Part-time",
        gaji: parsedGaji,
        jam: 4,
        lokasi: `${r.location} (${r.work_system})`,
        hrd: r.application_url_or_email,
        syarat: reqs || r.description || "Mahasiswa aktif UNSIL / Tasikmalaya",
        sumber: "mysql_sahabat_mahasiswa",
        url_lamar: r.application_url_or_email.startsWith("http")
          ? r.application_url_or_email
          : `mailto:${r.application_url_or_email}`,
      };
    });

    const merged = [...mysqlJobs, ...DEFAULT_LOWONGAN];

    return NextResponse.json({
      success: true,
      count: merged.length,
      data: merged,
    });
  } catch (error) {
    console.error("GET Jobs Error:", error);
    return NextResponse.json({
      success: true,
      count: DEFAULT_LOWONGAN.length,
      data: DEFAULT_LOWONGAN,
    });
  }
}
