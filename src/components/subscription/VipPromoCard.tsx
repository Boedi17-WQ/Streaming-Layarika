"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, Receipt } from "@phosphor-icons/react";
import { getUserEntitlementAction } from "@/app/actions/subscription";

export interface VipPromoCardProps {
  isVip?: boolean;
  className?: string;
}

export function VipPromoCard({ isVip: isVipProp = false, className = "" }: VipPromoCardProps) {
  const [liveVip, setLiveVip] = useState<boolean | null>(null);

  const isVip = liveVip !== null ? liveVip : isVipProp;

  // Sinkronisasi status VIP pengguna secara live dari server
  useEffect(() => {
    let isMounted = true;

    const syncVipStatus = async () => {
      try {
        const ent = await getUserEntitlementAction();
        if (isMounted && ent && typeof ent.isVip === "boolean") {
          setLiveVip(ent.isVip);
        }
      } catch {
        // Fallback aman
      }
    };

    syncVipStatus();

    window.addEventListener("focus", syncVipStatus);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncVipStatus);
    };
  }, []);

  if (isVip) {
    return (
      <div
        className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-emerald-500/25 bg-[#0D1612]/80 px-3.5 py-2.5 backdrop-blur-md transition-all hover:border-emerald-500/40 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <Crown size={16} weight="fill" className="text-[#D9A52E]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#F4F4F5] tracking-tight">VIP Member</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Aktif
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] truncate">
              Akses tanpa batas ke semua film & serial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/profile#riwayat-faktur"
            title="Lihat Bukti Pembayaran / Faktur VIP"
            className="flex items-center gap-1 rounded-lg border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-2 py-1 text-[11px] font-semibold text-[#D9A52E] hover:bg-[#D9A52E]/20 hover:border-[#D9A52E]/50 transition"
          >
            <Receipt size={13} weight="bold" />
            <span className="hidden sm:inline">Bukti Bayar</span>
            <span className="sm:hidden">Faktur</span>
          </Link>
          <Link
            href="/profile"
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#D4D4D8] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 transition"
          >
            Profil &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-[#D9A52E]/30 bg-gradient-to-r from-[#18150D] via-[#121215] to-[#121215] px-3.5 py-2.5 shadow-md shadow-[#D9A52E]/5 transition-all hover:border-[#D9A52E]/50 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D9A52E]/15 text-[#D9A52E] border border-[#D9A52E]/25">
          <Crown size={16} weight="fill" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#F4F4F5] tracking-tight">VIP Member</span>
            <span className="rounded bg-[#D9A52E]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D9A52E] border border-[#D9A52E]/30 uppercase">
              Eksklusif
            </span>
          </div>
          <p className="text-[11px] text-[#A1A1AA] truncate">
            Bebas kuota & nonton semua episode
          </p>
        </div>
      </div>

      <Link
        href="/pricing"
        className="shrink-0 rounded-lg bg-gradient-to-r from-[#D9A52E] via-[#e5b342] to-[#D9A52E] px-3 py-1.5 text-xs font-bold text-[#0A0A0A] shadow-sm shadow-[#D9A52E]/20 transition-all hover:scale-105 active:scale-95"
      >
        Aktifkan &rarr;
      </Link>
    </div>
  );
}
