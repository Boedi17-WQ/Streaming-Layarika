import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  const currentYear = 2026;

  return (
    <footer className="mt-20 border-t border-[#222222] bg-[#0A0A0A] py-10 text-[#A3A3A3] text-sm">
      <Container className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#171717] border border-[#D9A52E]/30 p-1 overflow-hidden">
                <Image
                  src="/images/layarrika-logo.png"
                  alt="LayarRika Logo"
                  width={20}
                  height={20}
                  className="object-contain"
                />
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
            <Link href="/help" className="hover:text-[#D9A52E] transition font-medium text-neutral-300">
              Pusat Bantuan & FAQ
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
