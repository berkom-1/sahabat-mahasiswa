/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const whereClause = userId ? { user_id: String(userId) } : {};

    const rows = await prisma.tugas.findMany({
      where: whereClause,
      orderBy: { deadline: "asc" },
    });

    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      nama_tugas: r.nama_tugas,
      deadline: r.deadline ? r.deadline.toISOString().split("T")[0] : "",
      bobot: r.bobot || 2,
      selesai: Boolean(r.selesai),
      created_at: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET Tugas Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal mengambil data tugas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, nama_tugas, deadline, bobot, selesai } = body;

    if (!nama_tugas) {
      return NextResponse.json({ error: "Nama tugas wajib diisi." }, { status: 400 });
    }

    const dueDateTime = deadline ? new Date(`${deadline}T23:59:59`) : new Date();
    const uid = user_id || "demo-user-id";

    const newTask = await prisma.tugas.create({
      data: {
        user_id: String(uid),
        nama_tugas: nama_tugas,
        deadline: dueDateTime,
        bobot: Number(bobot) || 2,
        selesai: Boolean(selesai),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tugas berhasil ditambahkan via Prisma.",
      task: {
        id: newTask.id,
        user_id: newTask.user_id,
        nama_tugas: newTask.nama_tugas,
        deadline: newTask.deadline.toISOString().split("T")[0],
        bobot: newTask.bobot,
        selesai: newTask.selesai,
      },
    });
  } catch (error) {
    console.error("POST Tugas Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal menambahkan tugas." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, selesai, nama_tugas, deadline, bobot } = body;

    if (!id) {
      return NextResponse.json({ error: "ID tugas wajib disertakan." }, { status: 400 });
    }

    const updateData: any = {};
    if (selesai !== undefined) updateData.selesai = Boolean(selesai);
    if (nama_tugas !== undefined) updateData.nama_tugas = nama_tugas;
    if (deadline !== undefined) updateData.deadline = new Date(`${deadline}T23:59:59`);
    if (bobot !== undefined) updateData.bobot = Number(bobot);

    await prisma.tugas.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "Status tugas berhasil diperbarui." });
  } catch (error) {
    console.error("PUT Tugas Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal memperbarui tugas." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID tugas wajib disertakan." }, { status: 400 });
    }

    await prisma.tugas.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: "Tugas berhasil dihapus." });
  } catch (error) {
    console.error("DELETE Tugas Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal menghapus tugas." }, { status: 500 });
  }
}