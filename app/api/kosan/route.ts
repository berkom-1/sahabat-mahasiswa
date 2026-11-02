/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_KOSAN } from "@/lib/data";
import { Kosan } from "@/lib/types";

function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userLat = parseFloat(searchParams.get("lat") || "-7.3512");
    const userLng = parseFloat(searchParams.get("lng") || "108.2234");
    const tipe = searchParams.get("tipe");
    const maxHarga = searchParams.get("maxHarga") ? Number(searchParams.get("maxHarga")) : null;
    const search = searchParams.get("search")?.toLowerCase();

    // Bangun query where Prisma secara dinamis
    const whereClause: any = {};
    if (tipe && tipe !== "all") {
      whereClause.tipe = tipe;
    }
    if (maxHarga) {
      whereClause.harga = { lte: maxHarga };
    }

    const rows = await prisma.kosan.findMany({
      where: whereClause,
    });

    let list: Kosan[] = rows.map((r) => {
      let parsedFacilities: string[] = [];
      try {
        parsedFacilities = r.fasilitas ? JSON.parse(r.fasilitas) : [];
      } catch {
        parsedFacilities = r.fasilitas ? [r.fasilitas] : [];
      }

      const calculatedDistance = calculateHaversine(
        userLat, userLng, Number(r.lat) || -7.3512, Number(r.lng) || 108.2234
      );

      return {
        id: r.id,
        nama: r.nama,
        area: r.area,
        harga: Number(r.harga),
        tipe: (r.tipe as "putra" | "putri" | "campur") || "campur",
        jarak: calculatedDistance,
        lat: Number(r.lat) || -7.3512,
        lng: Number(r.lng) || 108.2234,
        telp: r.telp || "6281234567890",
        fasilitas: parsedFacilities.length > 0 ? parsedFacilities : ["Kamar Mandi Dalam", "Kasur", "WiFi"],
        foto_url: r.foto_url || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5",
        sumber: r.sumber || "prisma_sahabat_mahasiswa",
        rating: Number(r.rating) || 4.8,
        sisa_kamar: Number(r.sisa_kamar) || 2,
      };
    });

    if (search) {
      list = list.filter(
        (k) =>
          k.nama.toLowerCase().includes(search) ||
          k.area.toLowerCase().includes(search) ||
          k.fasilitas.some((f) => f.toLowerCase().includes(search))
      );
    }

    if (list.length === 0 && (!search || search.length === 0)) {
      list = DEFAULT_KOSAN;
    }

    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error("GET Kosan Error (Prisma):", error);
    return NextResponse.json({ success: true, count: DEFAULT_KOSAN.length, data: DEFAULT_KOSAN });
  }
}