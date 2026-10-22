import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { connection } from "next/server";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getUserSubscriptionStatus } from "@/services/subscription.service";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://layarrika.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "LayarRika — Platform Streaming & Katalog Sinematik",
    template: "%s — LayarRika",
  },
  description:
    "Temukan Ceritamu. Nikmati Setiap Episode. Platform katalog film dan serial sinematik dengan integrasi resmi TMDB API, visual modern, dan keamanan tinggi.",
  keywords: [
    "LayarRika",
    "streaming film",
    "katalog serial",
    "sinematik",
    "nonton legal",
    "trailer resmi",
    "TMDB",
  ],
  authors: [{ name: "Tim Pengembang LayarRika (Semester 5 RPL)" }],
  openGraph: {
    title: "LayarRika — Platform Streaming & Katalog Sinematik",
    description:
      "Temukan Ceritamu. Nikmati Setiap Episode. Platform katalog film dan serial sinematik dengan visual modern dan pengalaman menonton aman.",
    url: baseUrl,
    siteName: "LayarRika",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LayarRika — Platform Streaming & Katalog Sinematik",
    description:
      "Temukan Ceritamu. Nikmati Setiap Episode. Platform katalog film dan serial sinematik dengan visual modern dan pengalaman menonton aman.",
  },
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
  const subStatus = session?.user?.id
    ? await getUserSubscriptionStatus(session.user.id)
    : null;

  return (
    <SiteHeader
      user={
        session?.user
          ? {
              ...session.user,
              isVip: subStatus?.isVip || false,
            }
          : null
      }
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable}`} data-scroll-behavior="smooth">
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
