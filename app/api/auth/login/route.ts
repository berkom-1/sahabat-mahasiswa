import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password?: string;
  kampus?: string;
  fakultas?: string;
  jurusan?: string;
  semester?: number;
  telp?: string;
  avatar_url?: string;
  student_email?: string;
  student_verified?: number;
  google_email?: string;
  google_linked?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = await query<UserRow[]>(
      "SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Akun dengan email tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = users[0];
    let isPasswordValid = false;

    if (user.password) {
      // Normalize bcrypt hash if it starts with $2y$ (PHP/Laravel standard)
      const normalizedHash = user.password.replace(/^\$2y\$/, "$2a$");
      try {
        isPasswordValid = await bcrypt.compare(password, normalizedHash);
      } catch (err) {
        console.warn("Bcrypt comparison error:", err);
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    const userData = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      kampus: user.kampus || "Universitas Siliwangi (UNSIL)",
      fakultas: user.fakultas || "",
      jurusan: user.jurusan || "",
      semester: user.semester || 1,
      telp: user.telp || "",
      avatar_url: user.avatar_url || null,
      student_email: user.student_email || null,
      student_verified: Boolean(user.student_verified),
      google_email: user.google_email || null,
      google_linked: Boolean(user.google_linked),
    };

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: userData,
    });
  } catch (error) {
    console.error("Login API Error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses login.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

