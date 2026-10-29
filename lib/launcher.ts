import { Voucher } from "./types";
import { OUTLETS } from "./data";

declare global {
  interface Window {
    electronAPI?: {
      openExternal: (url: string) => void;
    };
  }
}

export interface LaunchConfig {
  namaApp: string;
  appScheme?: string | null;
  androidIntent?: string | null;
  webUrl: string;
  onToast?: (msg: string) => void;
}

export function formatWhatsAppUrl(telp: string, pesan: string): string {
  let cleaned = (telp || "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62") && cleaned.length > 0) {
    cleaned = "62" + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(pesan)}`;
}

export function bukaUrlAman(url: string) {
  if (!url) return;

  // 1. Windows Electron (.exe) Support
  if (typeof window !== "undefined" && window.electronAPI?.openExternal) {
    try {
      window.electronAPI.openExternal(url);
      return;
    } catch {
      // fallback to browser
    }
  }

  // 2. Mobile Android / iOS
  if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    try {
      const win = window.open(url, "_blank");
      if (!win) window.location.href = url;
    } catch {
      window.location.href = url;
    }
    return;
  }

  // 3. Desktop Browser
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.assign(url);
    }
  } catch {
    window.location.href = url;
  }
}

export function luncurkanAppAtauWeb(cfg: LaunchConfig) {
  const { namaApp, appScheme, androidIntent, webUrl, onToast } = cfg;

  if (typeof window === "undefined") return;

  // Windows Electron Desktop
  if (window.electronAPI?.openExternal) {
    if (onToast) onToast(`🌐 Membuka website resmi ${namaApp}...`);
    bukaUrlAman(webUrl);
    return;
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (!isMobile) {
    if (onToast) onToast(`🌐 Membuka website resmi ${namaApp}...`);
    bukaUrlAman(webUrl);
    return;
  }

  // On Mobile: Trigger native app scheme / intent
  if (onToast) onToast(`🚀 Membuka aplikasi ${namaApp}...`);

  let appOpened = false;
  const startTime = Date.now();

  const handleVisibility = () => {
    if (document.hidden) {
      appOpened = true;
    }
  };

  document.addEventListener("visibilitychange", handleVisibility, { once: true });
  window.addEventListener("pagehide", handleVisibility, { once: true });

  // 1. Coba skema aplikasi / intent Android
  if (isAndroid && androidIntent) {
    window.location.href = androidIntent;
  } else if (appScheme) {
    window.location.href = appScheme;
  }

  // 2. Fallback Website setelah 1.3 detik jika belum terpasang aplikasi
  setTimeout(() => {
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handleVisibility);

    const durasi = Date.now() - startTime;
    if (!appOpened && !document.hidden && durasi < 3000) {
      if (onToast) onToast(`📱 Aplikasi belum terpasang, membuka website ${namaApp}...`);
      bukaUrlAman(webUrl);
    }
  }, 1300);
}

export function bukaAplikasiPlatform(v: Voucher, onToast?: (msg: string) => void) {
  if (!v) return;
  const platform = v.platform || "TikTok GO Dining";
  const brand = v.brand || "Mixue";
  const bKey = v.brandKey || brand.toLowerCase().replace(/\s+/g, "");
  const outlet = OUTLETS[bKey];
  const tiktokUsername = v.tiktokUsername || outlet?.tiktokUsername || "mixueindonesia";

  // 1. TikTok GO Dining / TikTok Official Profile & Shop
  if (platform.includes("TikTok")) {
    const webOfficial = v.linkBeli?.startsWith("http")
      ? v.linkBeli
      : `https://www.tiktok.com/@${tiktokUsername}`;
    const webFallbackEnc = encodeURIComponent(webOfficial);

    luncurkanAppAtauWeb({
      namaApp: `TikTok (@${tiktokUsername})`,
      appScheme: `snssdk1180://user/profile?unique_id=${tiktokUsername}`,
      androidIntent: `intent://www.tiktok.com/@${tiktokUsername}#Intent;package=com.zhiliaoapp.musically;scheme=https;S.browser_fallback_url=${webFallbackEnc};end;`,
      webUrl: webOfficial,
      onToast,
    });
    return;
  }

  // 2. GrabFood
  if (platform.includes("Grab")) {
    const webGrab = v.linkBeli?.startsWith("http") ? v.linkBeli : "https://food.grab.com/id/id/";
    const webGrabEnc = encodeURIComponent(webGrab);
    luncurkanAppAtauWeb({
      namaApp: "GrabFood",
      appScheme: "grab://open?screenType=GRABFOOD",
      androidIntent: `intent://food.grab.com/id/id/#Intent;package=com.grabtaxi.passenger;scheme=https;S.browser_fallback_url=${webGrabEnc};end;`,
      webUrl: webGrab,
      onToast,
    });
    return;
  }

  // 3. ShopeeFood
  if (platform.includes("Shopee")) {
    const webShopee = v.linkBeli?.startsWith("http")
      ? v.linkBeli
      : "https://shopee.co.id/m/shopeefood";
    const webShopeeEnc = encodeURIComponent(webShopee);
    luncurkanAppAtauWeb({
      namaApp: "ShopeeFood",
      appScheme: "shopee://food",
      androidIntent: `intent://shopee.co.id/m/shopeefood#Intent;package=com.shopee.id;scheme=https;S.browser_fallback_url=${webShopeeEnc};end;`,
      webUrl: webShopee,
      onToast,
    });
    return;
  }

  // 4. GoFood
  if (platform.includes("GoFood") || platform.includes("Gojek")) {
    const webGojek = v.linkBeli?.startsWith("http") ? v.linkBeli : "https://gofood.co.id";
    const webGojekEnc = encodeURIComponent(webGojek);
    luncurkanAppAtauWeb({
      namaApp: "GoFood",
      appScheme: "gojek://gofood",
      androidIntent: `intent://gofood#Intent;package=com.gojek.app;scheme=gojek;S.browser_fallback_url=${webGojekEnc};end;`,
      webUrl: webGojek,
      onToast,
    });
    return;
  }

  // Fallback
  luncurkanAppAtauWeb({
    namaApp: brand,
    appScheme: null,
    androidIntent: null,
    webUrl: v.linkBeli || `https://www.tiktok.com/@${tiktokUsername}`,
    onToast,
  });
}
