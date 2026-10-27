import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TugasRow extends RowDataPacket {
  id: number;
  user_id: number;
  nama_tugas: string;
  deadline: string;
  bobot: number;
  selesai: number;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let sql = "SELECT * FROM tugas";
    const params: unknown[] = [];

    if (userId && !isNaN(Number(userId))) {
      sql += " WHERE user_id = ?";
      params.push(Number(userId));
    }

    sql += " ORDER BY deadline ASC";

    const rows = await query<TugasRow[]>(sql, params);

    const data = rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      nama_tugas: r.nama_tugas,
      deadline: r.deadline ? new Date(r.deadline).toISOString().split("T")[0] : "",
      bobot: Number(r.bobot) || 2,
      selesai: Boolean(r.selesai),
      created_at: r.created_at,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET Tugas Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil data tugas dari MySQL.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, nama_tugas, deadline, bobot, selesai } = body;

    if (!nama_tugas) {
      return NextResponse.json(
        { error: "Nama tugas wajib diisi." },
        { status: 400 }
      );
    }

    const uid = user_id && !isNaN(Number(user_id)) ? Number(user_id) : 2; // fallback to demo user ID 2
    const weightMap: Record<number, string> = {
      1: "rendah",
      2: "sedang",
      3: "tinggi",
    };
    const weightEnum = weightMap[Number(bobot)] || "sedang";
    const statusVal = selesai ? "completed" : "pending";
    const dueDateTime = deadline ? `${deadline} 23:59:59` : new Date().toISOString().slice(0, 19).replace('T', ' ');

    const result = await execute(
      `INSERT INTO assignment_deadlines (
        user_id,
        title,
        description,
        due_date,
        weight,
        difficulty,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'sedang', ?, NOW(), NOW())`,
      [uid, nama_tugas, "", dueDateTime, weightEnum, statusVal]
    );

    return NextResponse.json({
      success: true,
      message: "Tugas berhasil ditambahkan ke MySQL.",
      task: {
        id: String(result.insertId),
        user_id: String(uid),
        nama_tugas,
        deadline,
        bobot: Number(bobot) || 2,
        selesai: Boolean(selesai),
      },
    });
  } catch (error) {
    console.error("POST Tugas Error:", error);
    const message = error instanceof Error ? error.message : "Gagal menambahkan tugas ke MySQL.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, selesai, nama_tugas, deadline, bobot } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID tugas wajib disertakan." },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (selesai !== undefined) {
      fields.push("status = ?");
      values.push(selesai ? "completed" : "pending");
      fields.push("completed_at = ?");
      values.push(selesai ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null);
    }

    if (nama_tugas !== undefined) {
      fields.push("title = ?");
      values.push(nama_tugas);
    }

    if (deadline !== undefined) {
      fields.push("due_date = ?");
      values.push(`${deadline} 23:59:59`);
    }

    if (bobot !== undefined) {
      const weightMap: Record<number, string> = {
        1: "rendah",
        2: "sedang",
        3: "tinggi",
      };
      fields.push("weight = ?");
      values.push(weightMap[Number(bobot)] || "sedang");
    }

    fields.push("updated_at = NOW()");

    values.push(Number(id));

    await execute(
      `UPDATE assignment_deadlines SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Status tugas berhasil diperbarui di MySQL.",
    });
  } catch (error) {
    console.error("PUT Tugas Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui tugas di MySQL.";
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
        { error: "ID tugas wajib disertakan." },
        { status: 400 }
      );
    }

    await execute("DELETE FROM assignment_deadlines WHERE id = ?", [Number(id)]);

    return NextResponse.json({
      success: true,
      message: "Tugas berhasil dihapus dari MySQL.",
    });
  } catch (error) {
    console.error("DELETE Tugas Error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghapus tugas dari MySQL.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


