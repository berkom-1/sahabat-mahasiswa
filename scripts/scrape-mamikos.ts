import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

// Ambil argumen dari terminal (Contoh: npx tsx scripts/scrape-mamikos.ts bandung)
const args = process.argv.slice(2);
const inputWilayah = (args[0] || "tasikmalaya").toLowerCase();

function getProvinsiSlug(wilayah: string): string {
  const w = wilayah.toLowerCase();
  if (["bandung", "tasikmalaya", "depok", "bogor", "bekasi", "cimahi"].includes(w)) {
    return "jawa-barat";
  }
  if (["malang", "surabaya", "sidoarjo", "jember"].includes(w)) {
    return "jawa-timur";
  }
  if (["semarang", "surakarta", "yogyakarta", "jogja", "sleman"].includes(w)) {
    return w.includes("yogyakarta") || w.includes("jogja") || w.includes("sleman") ? "daerah-istimewa-yogyakarta" : "jawa-tengah";
  }
  if (["jakarta", "jaksel", "jakpus", "jaktim"].includes(w)) {
    return "dki-jakarta";
  }
  return "jawa-barat";
}

async function scrapeMamikosPuppeteer(wilayah: string) {
  const provinsi = getProvinsiSlug(wilayah);
  const targetUrl = `https://mamikos.com/cari/${wilayah}-${provinsi}-indonesia/all/bulanan/0-15000000?keyword=${encodeURIComponent(wilayah)}&rent=2&sort=price,-`;

  console.log(`🌍 Membuka browser otomatis untuk wilayah: ${wilayah.toUpperCase()}`);
  console.log(`🔗 Target URL: ${targetUrl}`);

  // Luncurkan browser Headless Puppeteer
  const browser = await puppeteer.launch({
    headless: true, // Ubah jadi false kalau kamu mau lihat browser-nya terbuka sendiri di layar
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    
    // Set User-Agent agar seperti browser asli
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    
    console.log("⏳ Sedang memuat halaman dan menunggu data kosan ter-render...");
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // Beri waktu sejenak agar list kartu kosan termuat sempurna oleh AJAX
    await page.waitForSelector(".room-list__card, .kost-card, .room-card-wrapper", { timeout: 10000 }).catch(() => {
      console.log("⚠️ Peringatan: Elemen kartu kosan lambat dimuat, mencoba ekstrak elemen yang ada...");
    });

    // Eksekusi DOM scraping di dalam browser
    const kosanData = await page.evaluate(() => {
      const cards = document.querySelectorAll(".room-list__card, .kost-card, .room-card-wrapper, [data-testid='kost-card']");
      const results: any[] = [];

      cards.forEach((el) => {
        const namaEl = el.querySelector(".title, .room-name, h3, h4");
        const areaEl = el.querySelector(".location, .room-location, p");
        const hargaEl = el.querySelector(".price, .room-price");
        const imgEl = el.querySelector("img");

        const nama = namaEl ? namaEl.textContent?.trim() : "";
        if (!nama) return;

        const area = areaEl ? areaEl.textContent?.trim() : "";
        const rawHarga = hargaEl ? hargaEl.textContent?.trim() || "" : "";
        const fotoUrl = imgEl ? (imgEl.getAttribute("data-src") || imgEl.getAttribute("src") || "") : "";

        results.push({ nama, area, rawHarga, fotoUrl });
      });

      return results;
    });

    console.log(`🔍 Ditemukan ${kosanData.length} kartu kosan terekstrak.`);

    let count = 0;
    for (const item of kosanData) {
      const hargaMatch = item.rawHarga.replace(/\D/g, "");
      const harga = hargaMatch ? parseInt(hargaMatch, 10) : 1000000;
      const fotoUrl = item.fotoUrl || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5";
      
      const slug = `${wilayah}-${item.nama}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      if (!slug) continue;

      await prisma.kosan.upsert({
        where: { slug: slug },
        update: {
          harga: harga,
          sumber: `mamikos_${wilayah}`,
        },
        create: {
          slug: slug,
          nama: item.nama,
          area: item.area || wilayah,
          harga: harga,
          tipe: "campur",
          lat: -6.9175,
          lng: 107.6191,
          telp: "6281234567890",
          fasilitas: JSON.stringify(["WiFi", "Kasur", "Kamar Mandi Dalam", "AC"]),
          foto_url: fotoUrl,
          sumber: `mamikos_${wilayah}`,
          rating: 4.8,
          sisa_kamar: 2,
        },
      });

      count++;
    }

    console.log(`✅ Sukses! Berhasil menyimpan ${count} kosan di ${wilayah.toUpperCase()} ke database.`);
  } catch (error: any) {
    console.error(`❌ Gagal scraping menggunakan Puppeteer:`, error.message);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

scrapeMamikosPuppeteer(inputWilayah);