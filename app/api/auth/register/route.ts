import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      nama,
      kampus,
      jurusan,
      student_email,
      student_verified,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userName = String(nama || cleanEmail.split("@")[0]).trim();

    // Check if email already registered
    const existing = await query<RowDataPacket[]>(
      "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userKampus = kampus || "Universitas Siliwangi (UNSIL)";
    const userJurusan = jurusan || "Informatika";
    const isVerified = student_verified ? 1 : 0;
    const studentMail = student_email || null;

    const result = await execute(
      `INSERT INTO users (
        name,
        email,
        password,
        kampus,
        jurusan,
        student_email,
        student_verified,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userName,
        cleanEmail,
        hashedPassword,
        userKampus,
        userJurusan,
        studentMail,
        isVerified,
      ]
    );

    const newUserId = String(result.insertId);

    return NextResponse.json({
      success: true,
      message: "Registrasi akun berhasil.",
      user: {
        id: newUserId,
        name: userName,
        email: cleanEmail,
        kampus: userKampus,
        jurusan: userJurusan,
        student_email: studentMail,
        student_verified: Boolean(isVerified),
        avatar_url: null,
      },
    });
  } catch (error) {
    console.error("Register API Error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pendaftaran.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

