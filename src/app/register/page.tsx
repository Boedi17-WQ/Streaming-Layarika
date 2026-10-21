import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  FilmReel,
  ArrowLeft,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Daftar Akun Baru — LayarRika",
  description: "Daftarkan akun LayarRika Anda untuk menyimpan watchlist dan riwayat tontonan sinematik.",
  robots: {
    index: false,
    follow: false,
  },
};

interface RegisterPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

// -----------------------------------------------------------------------------
// Async Register Content (Wrapped in Suspense for Next.js 16 Instant Navigation)
// -----------------------------------------------------------------------------
async function RegisterContent({ searchParams }: RegisterPageProps) {
  await connection();
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = callbackUrl && !callbackUrl.startsWith("http") ? callbackUrl : "/";

  return (
    <div className="space-y-6 rounded-2xl border border-[#292929] bg-[#171717] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Header Brand */}
      <div className="text-center space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-[#F5F5F5] transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0A0A] border border-[#D9A52E]/40 text-[#D9A52E] shadow-sm">
            <FilmReel size={24} weight="duotone" />
          </div>
          <span className="text-xl font-extrabold tracking-wider">
            LAYAR<span className="text-[#D9A52E]">RIKA</span>
          </span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
            Buat Akun LayarRika
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3]">
            Daftar gratis untuk menikmati katalog film dan menyimpan riwayat tontonan.
          </p>
        </div>
      </div>

      {/* Form Pendaftaran */}
      <RegisterForm callbackUrl={safeCallbackUrl} />

      {/* Benefit Badge */}
      <div className="space-y-2 rounded-xl border border-[#222222] bg-[#121212] p-4 text-xs text-[#737373]">
        <div className="flex items-center gap-1.5 font-semibold text-[#A3A3A3]">
          <Sparkle size={14} className="text-[#D9A52E]" />
          <span>Keuntungan Anggota LayarRika</span>
        </div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Akses penuh ke katalog ribuan film & serial.</li>
          <li>Simpan daftar tontonan (Watchlist) pribadi.</li>
          <li>Lanjutkan pemutaran video dari detik terakhir.</li>
        </ul>
      </div>

      {/* Footer Back Link */}
      <div className="text-center pt-2 border-t border-[#222222]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A3A3A3] transition hover:text-[#D9A52E]"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Beranda Utama</span>
        </Link>
      </div>
    </div>
  );
}

function RegisterFallback() {
  return (
    <div className="space-y-6 rounded-2xl border border-[#292929] bg-[#171717] p-8 shadow-2xl animate-pulse">
      <div className="h-10 w-32 mx-auto bg-[#292929] rounded-xl" />
      <div className="h-6 w-48 mx-auto bg-[#292929] rounded-lg" />
      <div className="h-12 w-full bg-[#292929] rounded-xl" />
    </div>
  );
}

export default function RegisterPage(props: RegisterPageProps) {
  return (
    <div className="relative flex min-h-[85vh] items-center justify-center py-16">
      {/* Background Cinematic Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(217,165,46,0.12),rgba(10,10,10,0))]" />

      <Container className="relative z-10 max-w-md w-full">
        <Suspense fallback={<RegisterFallback />}>
          <RegisterContent searchParams={props.searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}
