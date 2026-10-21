import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { connection } from "next/server";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LayarRika — Platform Streaming & Katalog Sinematik",
  description:
    "Temukan Ceritamu. Nikmati Setiap Episode. Platform streaming film dan serial dengan visual modern, katalog metadata TMDB, dan pengalaman menonton sinematik.",
  keywords: [
    "LayarRika",
    "streaming film",
    "katalog serial",
    "sinematik",
    "nonton legal",
    "TMDB",
  ],
  authors: [{ name: "Tim Pengembang LayarRika" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Server Component untuk memuat sesi autentikasi secara asinkron.
 * Menggunakan await connection() dari Next.js 16 agar dieksekusi secara dinamis
 * pada request-time di dalam Suspense boundary, sehingga tidak memblokir prerendering statis (PPR).
 */
async function HeaderWithAuth() {
  await connection();
  const session = await auth();
  return <SiteHeader user={session?.user} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#F5F5F5] antialiased">
        <Suspense fallback={<SiteHeader user={null} />}>
          <HeaderWithAuth />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
