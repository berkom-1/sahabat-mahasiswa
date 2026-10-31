import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TransaksiRow extends RowDataPacket {
  id: number;
  user_id: number;
  jenis: string;
  kategori: string;
  nominal: number;
  catatan: string;
  tanggal: string;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Protect privacy: userId is required; never dump all user transactions globally
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ success: true, data: [] });
    }

    const sql = "SELECT * FROM transaksi WHERE user_id = ? ORDER BY tanggal DESC, id DESC";
    const rows = await query<TransaksiRow[]>(sql, [Number(userId)]);

    const data = rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      jenis: r.jenis as "masuk" | "keluar",
      kategori: r.kategori,
      nominal: Number(r.nominal),
      catatan: r.catatan || "",
      tanggal: r.tanggal ? new Date(r.tanggal).toISOString().split("T")[0] : "",
      created_at: r.created_at,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET Transaksi Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil transaksi dompet dari MySQL.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, jenis, kategori, nominal, catatan, tanggal } = body;

    const amount = Number(nominal);
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Nominal transaksi harus lebih dari 0." },
        { status: 400 }
      );
    }

    const uid = user_id && !isNaN(Number(user_id)) ? Number(user_id) : 2; // fallback to demo user ID 2
    const txType = jenis === "masuk" ? "income" : "expense";
    const txDate = tanggal || new Date().toISOString().split("T")[0];
    const txCategory = kategori || (jenis === "masuk" ? "Uang Saku" : "Lainnya");

    const result = await execute(
      `INSERT INTO wallet_transactions (
        user_id,
        type,
        category,
        amount,
        description,
        transaction_date,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [uid, txType, txCategory, amount, catatan || "", txDate]
    );

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dicatat di MySQL.",
      transaction: {
        id: String(result.insertId),
        user_id: String(uid),
        jenis,
        kategori: txCategory,
        nominal: amount,
        catatan: catatan || "",
        tanggal: txDate,
      },
    });
  } catch (error) {
    console.error("POST Transaksi Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mencatat transaksi ke MySQL.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi wajib disertakan." },
        { status: 400 }
      );
    }

    await execute("DELETE FROM wallet_transactions WHERE id = ?", [Number(id)]);

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dihapus dari MySQL.",
    });
  } catch (error) {
    console.error("DELETE Transaksi Error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghapus transaksi dari MySQL.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


