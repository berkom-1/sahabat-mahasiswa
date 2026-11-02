import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nama, kampus, jurusan, student_email, student_verified } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userName = String(nama || cleanEmail.split("@")[0]).trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan login." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nama: userName,
        email: cleanEmail,
        password: hashedPassword,
        kampus: kampus || "Universitas Siliwangi (UNSIL)",
        jurusan: jurusan || "Informatika",
        student_email: student_email || null,
        student_verified: Boolean(student_verified),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registrasi akun berhasil.",
      user: {
        id: newUser.id,
        name: newUser.nama,
        email: newUser.email,
        kampus: newUser.kampus,
        jurusan: newUser.jurusan,
        student_email: newUser.student_email,
        student_verified: newUser.student_verified,
        avatar_url: newUser.avatar_url,
      },
    });
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses pendaftaran." }, { status: 500 });
  }
}