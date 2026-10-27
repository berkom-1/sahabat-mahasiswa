import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { Voucher } from "@/lib/types";
import { DEFAULT_VOUCHERS } from "@/lib/data";

interface FoodVoucherRow extends RowDataPacket {
  id: number;
  title: string;
  merchant_name: string;
  category: string;
  discount_label: string;
  promo_code: string;
  terms: string;
  location: string;
  valid_until: string;
  is_active: number;
  claim_count: number;
}

export async function GET() {
  try {
    const rows = await query<FoodVoucherRow[]>(
      "SELECT * FROM food_vouchers WHERE is_active = 1 ORDER BY id ASC"
    );

    const mysqlVouchers: Voucher[] = rows.map((r) => ({
      id: r.id,
      brand: r.merchant_name,
      brandLogo: "🍲",
      kategori: r.category === "warteg" ? "Warteg & Nasi Rames" : r.category === "cafe" ? "Kopi & Minuman" : "Makanan Hemat",
      platform: "TikTok GO Dining",
      platformIcon: "📱",
      namaVoucher: r.title,
      deskripsi: r.terms || "Promo spesial mahasiswa",
      hargaAsli: 25000,
      hargaDiskon: 15000,
      diskonPersen: 40,
      pax: 1,
      rating: "4.8",
      terjual: `${r.claim_count || 100}+`,
      badge: r.discount_label,
      kodePromo: r.promo_code,
      linkBeli: "https://www.tiktok.com",
    }));

    // Merge MySQL vouchers with curated vouchers
    const merged = [...mysqlVouchers, ...DEFAULT_VOUCHERS];

    return NextResponse.json({
      success: true,
      count: merged.length,
      data: merged,
    });
  } catch (error) {
    console.error("GET Vouchers Error:", error);
    return NextResponse.json({
      success: true,
      count: DEFAULT_VOUCHERS.length,
      data: DEFAULT_VOUCHERS,
    });
  }
}

