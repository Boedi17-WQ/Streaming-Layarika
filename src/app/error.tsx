"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { WarningCircle, ArrowClockwise, House } from "@phosphor-icons/react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error secara aman tanpa membocorkan kredensial
    console.error("[Application Error Boundary]", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-16">
      <Container className="text-center space-y-6 max-w-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171717] border border-amber-500/30 text-amber-400">
          <WarningCircle size={36} weight="duotone" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D9A52E]">
            Kendala Teknis
          </span>
          <h1 className="text-3xl font-extrabold text-[#F5F5F5]">
            Terjadi Kesalahan Pemuatan
          </h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            Koneksi ke server metadata TMDB atau sumber daya halaman mengalami kendala sementara. Silakan coba muat ulang halaman.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D9A52E] bg-[#D9A52E] px-5 py-2.5 text-xs font-bold text-[#0A0A0A] shadow-md transition hover:bg-[#c49226]"
          >
            <ArrowClockwise size={16} weight="bold" />
            <span>Coba Muat Ulang</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#292929] bg-[#171717] px-5 py-2.5 text-xs font-semibold text-[#F5F5F5] transition hover:border-[#D9A52E]"
          >
            <House size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
