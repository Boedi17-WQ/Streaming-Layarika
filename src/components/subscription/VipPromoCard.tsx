"use client";

import Link from "next/link";
import { Crown, CheckCircle } from "@phosphor-icons/react";

export interface VipPromoCardProps {
  isVip: boolean;
  className?: string;
}

export function VipPromoCard({ isVip, className = "" }: VipPromoCardProps) {
  if (isVip) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0e1c14] via-[#101416] to-[#0A0A0C] p-4 shadow-lg shadow-emerald-500/5 ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Crown size={18} weight="fill" className="text-[#D9A52E]" />
            <span>LayarRika VIP Member</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 px-2 py-0.5 uppercase tracking-wide border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>VIP Aktif</span>
          </span>
        </div>

        <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
          Status VIP Anda saat ini <strong className="text-emerald-400">Aktif</strong>. Nikmati akses tanpa batas ke semua film & serial tanpa jeda kuota.
        </p>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-2.5 px-3 text-xs font-bold text-emerald-400 shadow-sm">
            <CheckCircle size={16} weight="fill" />
            <span>Status Langganan: Aktif</span>
          </div>
          <Link
            href="/profile"
            className="text-center text-[11px] text-[#A1A1AA] hover:text-[#D9A52E] hover:underline pt-0.5 transition-colors"
          >
            Kelola Langganan di Profil &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#D9A52E]/30 bg-gradient-to-br from-[#1C180E] via-[#141416] to-[#0E0E12] p-4 shadow-lg shadow-[#D9A52E]/5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-[#D9A52E] font-bold text-sm">
          <Crown size={18} weight="fill" />
          <span>LayarRika VIP Member</span>
        </div>
        <span className="rounded bg-[#D9A52E]/20 text-[10px] font-bold text-[#D9A52E] px-2 py-0.5 uppercase tracking-wide border border-[#D9A52E]/30">
          Eksklusif
        </span>
      </div>

      <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
        Nonton semua film & episode tanpa batas, kualitas Full HD, dan bebas jeda kuota.
      </p>

      <Link
        href="/pricing"
        className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-[#D9A52E] via-[#e5b342] to-[#D9A52E] py-2.5 px-3 text-xs font-bold text-[#0A0A0A] shadow-md shadow-[#D9A52E]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <span>Aktifkan VIP Member</span>
        <span className="text-base leading-none">&rarr;</span>
      </Link>
    </div>
  );
}
