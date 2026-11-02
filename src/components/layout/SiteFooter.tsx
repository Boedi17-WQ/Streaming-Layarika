"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FilmReel } from "@phosphor-icons/react";

export function SiteFooter() {
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-20 border-t border-[#222222] bg-[#0A0A0A] py-10 text-[#A3A3A3] text-sm">
      <Container className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E]">
                <FilmReel size={16} weight="duotone" />
              </div>
              <span className="text-base font-bold tracking-wide text-[#F5F5F5]">
                LAYAR<span className="text-[#D9A52E]">RIKA</span>
              </span>
            </div>
            <p className="text-xs text-[#737373] max-w-sm">
              Temukan Ceritamu. Nikmati Setiap Episode. Platform katalog sinematik modern, aman, dan berkelas.
            </p>
          </div>

          {/* Navigasi Footer Cepat */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#A3A3A3]">
            <Link href="/" className="hover:text-[#D9A52E] transition">
              Beranda
            </Link>
            <Link href="/catalog?type=movie" className="hover:text-[#D9A52E] transition">
              Movies
            </Link>
            <Link href="/catalog?type=tv" className="hover:text-[#D9A52E] transition">
              Series
            </Link>
            <Link href="/catalog" className="hover:text-[#D9A52E] transition">
              Katalog
            </Link>
            <Link href="/pricing" className="hover:text-[#D9A52E] transition">
              VIP Member
            </Link>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1C1C1C] pt-6 text-xs text-[#737373]">
          <p>© {currentYear} LAYARRIKA. Seluruh hak cipta dilindungi.</p>
          <p className="text-[11px] text-[#555555]">
            Platform hiburan streaming sinematik berkualitas tinggi.
          </p>
        </div>
      </Container>
    </footer>
  );
}
