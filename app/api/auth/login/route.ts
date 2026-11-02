import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 },
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Akun dengan email tersebut tidak ditemukan." },
        { status: 404 },
      );
    }

    const normalizedHash = user.password.replace(/^\$2y\$/, "$2a$");
    const isPasswordValid = await bcrypt
      .compare(password, normalizedHash)
      .catch(() => false);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password yang Anda masukkan salah." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        name: user.nama,
        email: user.email,
        kampus: user.kampus || "Universitas Siliwangi (UNSIL)",
        fakultas: user.fakultas || "",
        jurusan: user.jurusan || "",
        semester: user.semester || 1,
        telp: user.telp || "",
        avatar_url: user.avatar_url,
        student_email: user.student_email,
        student_verified: user.student_verified,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses login." },
      { status: 500 },
    );
  }
}
