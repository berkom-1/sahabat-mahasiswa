import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const whereClause = userId ? { user_id: String(userId) } : {};

    const rows = await prisma.transaksi.findMany({
      where: whereClause,
      orderBy: { tanggal: "desc" },
    });

    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      jenis: r.jenis,
      kategori: r.kategori,
      nominal: r.nominal,
      catatan: r.catatan || "",
      tanggal: r.tanggal ? r.tanggal.toISOString().split("T")[0] : "",
      created_at: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET Transaksi Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal mengambil transaksi dompet." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, jenis, kategori, nominal, catatan, tanggal } = body;

    const amount = Number(nominal);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Nominal transaksi harus lebih dari 0." }, { status: 400 });
    }

    const txDate = tanggal ? new Date(tanggal) : new Date();
    const txCategory = kategori || (jenis === "masuk" ? "Uang Saku" : "Lainnya");
    // Gunakan user demo (ambil dari ID spesifik) jika user_id tidak ada, tapi idealnya diambil dari sesi aktif
    const uid = user_id || "demo-user-id"; 

    const newTx = await prisma.transaksi.create({
      data: {
        user_id: String(uid),
        jenis: jenis,
        kategori: txCategory,
        nominal: amount,
        catatan: catatan || "",
        tanggal: txDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dicatat via Prisma.",
      transaction: {
        id: newTx.id,
        user_id: newTx.user_id,
        jenis: newTx.jenis,
        kategori: newTx.kategori,
        nominal: newTx.nominal,
        catatan: newTx.catatan || "",
        tanggal: newTx.tanggal.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("POST Transaksi Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal mencatat transaksi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID transaksi wajib disertakan." }, { status: 400 });
    }

    await prisma.transaksi.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus via Prisma." });
  } catch (error) {
    console.error("DELETE Transaksi Error (Prisma):", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi." }, { status: 500 });
  }
}