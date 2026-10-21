import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FilmReel, ShieldCheck, Code } from "@phosphor-icons/react/dist/ssr";

export function SiteFooter() {
  const currentYear = 2026;

  return (
    <footer className="mt-20 border-t border-[#292929] bg-[#0A0A0A] py-12 text-[#A3A3A3] text-sm">
      <Container className="space-y-8">
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
              Temukan Ceritamu. Nikmati Setiap Episode. Platform katalog sinematik modern, aman, dan patuh standar hak cipta.
            </p>
          </div>

          {/* Project Info & Status */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#A3A3A3]">
            <div className="flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#171717] px-3 py-1">
              <Code size={14} className="text-[#D9A52E]" />
              <span>Tahap 7 — Security, Performance & Production Readiness</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#171717] px-3 py-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Strict CSP & Sandboxed Iframe</span>
            </div>
          </div>
        </div>

        {/* TMDB Official Mandatory Attribution Box */}
        <div className="rounded-xl border border-[#292929] bg-[#121212] p-4 text-xs text-[#737373] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-[#01b4e4] px-2 py-0.5 text-[10px] font-black tracking-wider text-[#0d253f] uppercase">
                TMDB
              </span>
              <span className="font-semibold text-[#A3A3A3]">
                The Movie Database (TMDB) Official Attribution
              </span>
            </div>
            <Link
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#01b4e4] hover:underline"
            >
              Kunjungi themoviedb.org &rarr;
            </Link>
          </div>
          <p className="leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Data metadata, poster film, sinopsis, dan cuplikan trailer resmi disediakan oleh TMDB API v3.
          </p>
          <div className="pt-2 border-t border-[#1f1f1f] text-[11px] text-[#666666] leading-relaxed">
            LayarRika dikembangkan untuk tujuan edukasi dan riset Rekayasa Perangkat Lunak (Semester 5). LayarRika tidak mendistribusikan atau menghosting stream berhak cipta tanpa lisensi resmi. Penggunaan komersial memerlukan perizinan tersendiri dari masing-masing pemegang hak siar dan The Movie Database.
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#222222] pt-6 text-xs text-[#737373]">
          <p>© {currentYear} LayarRika. Proyek Rekayasa Perangkat Lunak.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Dibangun dengan Next.js 16 App Router, React 19, TypeScript Strict Mode, & Neon DB.
          </p>
        </div>
      </Container>
    </footer>
  );
}
