import { NextResponse } from "next/server";
import { DEFAULT_VOUCHERS } from "@/lib/data";

export async function GET() {
  // Karena fitur TikTok dihapus dan tabel Voucher belum ada di Prisma Schema sebelumnya, 
  // kita langsung mapping data dummy secara default supaya UI frontend tidak rusak.
  // Nantinya bisa diganti ke: await prisma.voucher.findMany() jika tabelnya sudah kamu buat.
  try {
    return NextResponse.json({
      success: true,
      count: DEFAULT_VOUCHERS.length,
      data: DEFAULT_VOUCHERS,
    });
  } catch (error) {
    console.error("GET Vouchers Error:", error);
    return NextResponse.json({
      success: false,
      count: 0,
      data: [],
    });
  }
}