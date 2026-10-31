import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ProfileRow extends RowDataPacket {
  id: number;
  email: string;
  nama: string;
  kampus: string;
  fakultas: string;
  jurusan: string;
  semester: number;
  telp: string;
  avatar_url: string;
  student_email: string;
  student_verified: number;
  google_email: string;
  google_linked: number;
  tiktok_client_key?: string;
  tiktok_access_token?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Parameter userId atau email diperlukan." },
        { status: 400 }
      );
    }

    let rows: ProfileRow[] = [];
    if (userId && !isNaN(Number(userId))) {
      rows = await query<ProfileRow[]>(
        "SELECT * FROM profiles WHERE id = ? LIMIT 1",
        [Number(userId)]
      );
    } else if (email) {
      rows = await query<ProfileRow[]>(
        "SELECT * FROM profiles WHERE LOWER(email) = ? LIMIT 1",
        [email.trim().toLowerCase()]
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ profile: null }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json({
      profile: {
        id: String(row.id),
        email: row.email,
        nama: row.nama,
        kampus: row.kampus,
        fakultas: row.fakultas,
        jurusan: row.jurusan,
        semester: row.semester,
        telp: row.telp,
        avatar_url: row.avatar_url,
        student_email: row.student_email,
        student_verified: Boolean(row.student_verified),
        google_email: row.google_email,
        google_linked: Boolean(row.google_linked),
        tiktok_client_key: row.tiktok_client_key || null,
        tiktok_connected: Boolean(row.tiktok_access_token),
      },
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil data profil.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      email,
      nama,
      kampus,
      fakultas,
      jurusan,
      semester,
      telp,
      avatar_url,
      student_email,
      student_verified,
      google_email,
      google_linked,
      tiktok_client_key,
      tiktok_access_token,
    } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: "id atau email wajib disertakan untuk update profil." },
        { status: 400 }
      );
    }

    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: unknown[] = [];

    if (nama !== undefined) {
      fields.push("name = ?");
      values.push(nama);
    }
    if (kampus !== undefined) {
      fields.push("kampus = ?");
      values.push(kampus);
    }
    if (fakultas !== undefined) {
      fields.push("fakultas = ?");
      values.push(fakultas);
    }
    if (jurusan !== undefined) {
      fields.push("jurusan = ?");
      values.push(jurusan);
    }
    if (semester !== undefined) {
      fields.push("semester = ?");
      values.push(semester);
    }
    if (telp !== undefined) {
      fields.push("telp = ?");
      values.push(telp);
    }
    if (avatar_url !== undefined) {
      fields.push("avatar_url = ?");
      values.push(avatar_url);
    }
    if (student_email !== undefined) {
      fields.push("student_email = ?");
      values.push(student_email ? String(student_email).trim().toLowerCase() : null);
    }
    if (student_verified !== undefined) {
      const emailToCheck = String(student_email || email || "").toLowerCase();
      const isCampusDomain = emailToCheck.includes(".ac.id") || emailToCheck.includes(".edu");
      // Only grant student_verified if student has a valid campus domain or is already verified
      fields.push("student_verified = ?");
      values.push(student_verified && (isCampusDomain || !student_email) ? 1 : 0);
    }
    if (google_email !== undefined) {
      fields.push("google_email = ?");
      values.push(google_email);
    }
    if (google_linked !== undefined) {
      fields.push("google_linked = ?");
      values.push(google_linked ? 1 : 0);
    }
    if (tiktok_client_key !== undefined) {
      fields.push("tiktok_client_key = ?");
      values.push(tiktok_client_key);
    }
    if (tiktok_access_token !== undefined) {
      fields.push("tiktok_access_token = ?");
      values.push(tiktok_access_token);
    }

    fields.push("updated_at = NOW()");

    if (fields.length === 1) {
      return NextResponse.json({ message: "Tidak ada data yang diubah." });
    }

    let whereClause = "";
    if (id && !isNaN(Number(id))) {
      whereClause = "WHERE id = ?";
      values.push(Number(id));
    } else if (email) {
      whereClause = "WHERE LOWER(email) = ?";
      values.push(email.trim().toLowerCase());
    } else {
      return NextResponse.json({ error: "Identifier tidak valid." }, { status: 400 });
    }

    await execute(
      `UPDATE users SET ${fields.join(", ")} ${whereClause}`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui di MySQL.",
    });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui profil.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

