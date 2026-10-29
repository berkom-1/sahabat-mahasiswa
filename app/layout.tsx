import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sahabat Mahasiswa - Portal Kebutuhan Harian Mahasiswa",
  description:
    "Platform all-in-one mahasiswa Indonesia: info kosan terdekat, promo kuliner TikTok diskon hemat, pencatat dompet, dan info lowongan part-time.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
};

import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${dmSans.className} min-h-full flex flex-col font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
