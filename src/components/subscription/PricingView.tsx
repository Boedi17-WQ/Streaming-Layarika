"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Sparkle,
  ShieldCheck,
  Spinner,
  Info,
  CalendarCheck,
} from "@phosphor-icons/react";
import { activateSimulatedVipAction } from "@/app/actions/subscription";

export interface PlanData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string[];
  episodeLimit: number | null;
  movieWatchSecondsLimit: number | null;
}

interface PricingViewProps {
  plans: PlanData[];
  currentUserPlanSlug: string;
  isVip: boolean;
  vipEndDate: Date | string | null;
  isAuthenticated: boolean;
  simulatedBillingEnabled: boolean;
}

export function PricingView({
  plans,
  currentUserPlanSlug,
  isVip,
  vipEndDate,
  isAuthenticated,
  simulatedBillingEnabled,
}: PricingViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleSimulatedUpgrade = () => {
    if (!isAuthenticated) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await activateSimulatedVipAction();

      if (result.unauthenticated) {
        router.push("/login?callbackUrl=/pricing");
        return;
      }

      if (result.success) {
        setFeedback({
          type: "success",
          message:
            result.message ||
            "Selamat! Paket Premium VIP berhasil diaktifkan. Anda kini dapat menonton tanpa batas kuota Free.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Gagal mengaktifkan simulasi VIP.",
        });
      }
    });
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkle size={18} weight="fill" className="shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline hover:opacity-80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {plans.map((plan) => {
          const isPlanVip = plan.slug === "premium-monthly" || plan.episodeLimit === null;
          const isCurrentActive =
            plan.slug === currentUserPlanSlug || (isPlanVip ? isVip : !isVip && isAuthenticated);

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition duration-300 ${
                isPlanVip
                  ? "border-2 border-[#D9A52E] bg-gradient-to-b from-[#1f190e] via-[#141414] to-[#0d0d0d] shadow-2xl shadow-[#D9A52E]/10"
                  : "border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
              }`}
            >
              {/* Highlight Badge for VIP */}
              {isPlanVip && (
                <div className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-[11px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1.5">
                  <Crown size={14} weight="fill" />
                  <span>Paling Populer</span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {plan.description || "Akses tontonan sinematik LayarRika."}
                    </p>
                  </div>
                  {isCurrentActive && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold whitespace-nowrap">
                      Paket Aktif Anda
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="py-6 border-y border-neutral-800/80 my-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {plan.price === 0
                        ? "Rp 0"
                        : `Rp ${plan.price.toLocaleString("id-ID")}`}
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">
                      {plan.price === 0 ? "/ selamanya" : "/ 30 hari"}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {plan.price === 0
                      ? "Akses gratis tanpa biaya langganan"
                      : "Simulasi pembayaran demo akademik (tanpa biaya nyata)"}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3.5 mb-8">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Fitur & Kuota:
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                        <Check
                          size={16}
                          weight="bold"
                          className={isPlanVip ? "text-[#D9A52E] shrink-0 mt-0.5" : "text-neutral-500 shrink-0 mt-0.5"}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-neutral-800/60">
                {isPlanVip ? (
                  isVip ? (
                    <div className="space-y-2 text-center">
                      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-full justify-center">
                        <ShieldCheck size={18} weight="fill" />
                        <span>VIP Member Aktif</span>
                      </div>
                      {vipEndDate && (
                        <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
                          <CalendarCheck size={14} />
                          <span>
                            Berlaku hingga{" "}
                            {new Date(vipEndDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : !isAuthenticated ? (
                    <Link
                      href="/login?callbackUrl=/pricing"
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] hover:from-[#e5b33d] hover:to-[#c49226] text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A52E]/20 transition cursor-pointer"
                    >
                      <span>Masuk untuk Aktivasi VIP</span>
                    </Link>
                  ) : simulatedBillingEnabled ? (
                    <button
                      type="button"
                      onClick={handleSimulatedUpgrade}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] hover:from-[#e5b33d] hover:to-[#c49226] text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A52E]/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isPending ? (
                        <>
                          <Spinner size={16} className="animate-spin" />
                          <span>Mengaktifkan VIP...</span>
                        </>
                      ) : (
                        <>
                          <Crown size={18} weight="bold" />
                          <span>Aktifkan Simulasi VIP (Gratis Demo)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-neutral-800 text-neutral-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed"
                    >
                      <span>Simulasi Billing Nonaktif</span>
                    </button>
                  )
                ) : (
                  // Free Plan Button
                  <div className="text-center">
                    {isAuthenticated && !isVip ? (
                      <div className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-400 text-xs font-semibold">
                        <span>Paket Bawaan Akun Anda</span>
                      </div>
                    ) : (
                      <Link
                        href={isAuthenticated ? "/catalog" : "/register"}
                        className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 bg-neutral-950 text-neutral-200 hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <span>{isAuthenticated ? "Mulai Menonton Free" : "Daftar Akun Free"}</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Academic Simulation Notice */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 text-xs text-neutral-400 flex items-start gap-3">
        <Info size={22} className="text-[#D9A52E] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">
            Catatan Simulasi Transaksi Akademik:
          </span>
          <p className="leading-relaxed">
            Platform LayarRika tidak memproses transaksi kartu kredit atau transfer perbankan nyata. Tombol &quot;Aktifkan Simulasi VIP&quot; berfungsi sebagai pengubah status hak akses internal akun di database Neon PostgreSQL untuk mendemonstrasikan penghilangan batas kuota episode dan film secara aman.
          </p>
        </div>
      </div>
    </div>
  );
}
