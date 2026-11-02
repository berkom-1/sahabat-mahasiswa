/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({ error: "Parameter userId atau email diperlukan." }, { status: 400 });
    }

    const profile = await prisma.user.findFirst({
      where: userId ? { id: String(userId) } : { email: email?.trim().toLowerCase() },
    });

    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        nama: profile.nama,
        kampus: profile.kampus,
        fakultas: profile.fakultas,
        jurusan: profile.jurusan,
        semester: profile.semester,
        telp: profile.telp,
        avatar_url: profile.avatar_url,
        student_email: profile.student_email,
        student_verified: profile.student_verified,
        auth_provider: profile.auth_provider,
      },
    });
  } catch (error) {
    console.error("GET Profile Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal mengambil data profil." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id, email, nama, kampus, fakultas, jurusan, semester,
      telp, avatar_url, student_email, student_verified
    } = body;

    if (!id && !email) {
      return NextResponse.json({ error: "id atau email wajib disertakan untuk update." }, { status: 400 });
    }

    const updateData: any = {};
    if (nama !== undefined) updateData.nama = nama;
    if (kampus !== undefined) updateData.kampus = kampus;
    if (fakultas !== undefined) updateData.fakultas = fakultas;
    if (jurusan !== undefined) updateData.jurusan = jurusan;
    if (semester !== undefined) updateData.semester = Number(semester);
    if (telp !== undefined) updateData.telp = telp;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (student_email !== undefined) updateData.student_email = student_email;
    if (student_verified !== undefined) updateData.student_verified = Boolean(student_verified);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Tidak ada data yang diubah." });
    }

    // Gunakan findFirst untuk mencari target jika menggunakan email
    const targetUser = await prisma.user.findFirst({
      where: id ? { id: String(id) } : { email: String(email).trim().toLowerCase() }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "Profil berhasil diperbarui via Prisma." });
  } catch (error) {
    console.error("PUT Profile Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}