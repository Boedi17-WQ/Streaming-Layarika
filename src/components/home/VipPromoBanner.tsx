import Link from "next/link";
import { Crown, Sparkle, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function VipPromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D9A52E]/40 bg-gradient-to-r from-[#17140b] via-[#101010] to-[#1a150a] p-4 sm:p-6 md:p-8 shadow-xl shadow-black/80 my-2">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#D9A52E]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[#D9A52E]/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D9A52E]/20 border border-[#D9A52E]/40 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#D9A52E]">
              <Crown size={13} weight="fill" />
              <span>LAYARRIKA VIP</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#888888] uppercase tracking-widest">
              STREAM MORE, PAY LESS
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex flex-wrap items-baseline gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE082] via-[#D9A52E] to-[#B3821C]">
                Rp 49.000
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-wide">
                Bulan Pertama
              </span>
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#A3A3A3] leading-relaxed line-clamp-2 sm:line-clamp-none">
              Buka seluruh episode serial tanpa batas kuota harian. Kualitas sinematik 4K Ultra HD bebas jeda iklan.
            </p>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F0C05A] via-[#D9A52E] to-[#B3821C] px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black text-[#0A0A0A] shadow-lg shadow-[#D9A52E]/25 transition hover:brightness-110 active:scale-95"
          >
            <Sparkle size={15} weight="fill" />
            <span>Upgrade VIP Sekarang</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

