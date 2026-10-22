"use client";

import React from "react";
import Link from "next/link";
import {
  Crown,
  Sparkle,
  Television,
  FilmReel,
  X,
  SignIn,
  ArrowRight,
} from "@phosphor-icons/react";

export type PaywallReason =
  | "EPISODE_LIMIT_REACHED"
  | "MOVIE_LIMIT_REACHED"
  | "UNAUTHENTICATED"
  | "EXPIRED"
  | "GENERIC";

export interface PaywallModalProps {
  isOpen: boolean;
  onClose?: () => void;
  reason: PaywallReason;
  customMessage?: string;
  message?: string;
  allowClose?: boolean;
}

export function PaywallModal({
  isOpen,
  onClose,
  reason,
  customMessage,
  message,
  allowClose = true,
}: PaywallModalProps) {
  if (!isOpen) return null;

  const resolvedCustomMessage = customMessage || message;

  const getReasonContent = () => {
    switch (reason) {
      case "EPISODE_LIMIT_REACHED":
        return {
          icon: <Television size={40} className="text-[#D9A52E]" weight="duotone" />,
          title: "Kuota 5 episode gratis hari ini telah habis.",
          badge: "Batas Kuota Serial Free",
          defaultMessage:
            "Kamu sudah menggunakan seluruh kuota episode untuk paket Free. Aktifkan Premium VIP untuk membuka semua episode tanpa batas kuota Free.",
          ctaText: "Lihat Paket Premium",
          ctaHref: "/pricing",
          secondaryText: "Kembali ke Katalog",
          secondaryHref: "/catalog",
        };
      case "MOVIE_LIMIT_REACHED":
        return {
          icon: <FilmReel size={40} className="text-[#D9A52E]" weight="duotone" />,
          title: "Batas 60 Menit Film Tercapai",
          badge: "Batas Durasi Film",
          defaultMessage:
            "Batas tontonan Free untuk film ini (60 menit pemutaran aktual) telah tercapai. Aktifkan Premium VIP untuk melanjutkan menonton hingga selesai tanpa jeda batas.",
          ctaText: "Lanjutkan dengan Premium VIP",
          ctaHref: "/pricing",
          secondaryText: "Buka Halaman Pricing",
        };
      case "UNAUTHENTICATED":
        return {
          icon: <SignIn size={40} className="text-[#D9A52E]" weight="duotone" />,
          title: "Masuk untuk Memutar",
          badge: "Autentikasi Akun",
          defaultMessage:
            "Silakan masuk ke akun LayarRika Anda agar kuota tontonan dan riwayat pemutaran dapat dicatat secara aman.",
          ctaText: "Masuk Sekarang",
          ctaHref: "/login",
          secondaryText: "Belum Punya Akun? Daftar",
        };
      case "EXPIRED":
        return {
          icon: <Crown size={40} className="text-[#D9A52E]" weight="duotone" />,
          title: "Masa Langganan Berakhir",
          badge: "Perpanjangan VIP",
          defaultMessage:
            "Masa aktif paket Premium VIP Anda telah berakhir. Perpanjang status VIP Anda untuk kembali menikmati streaming tanpa batas.",
          ctaText: "Perpanjang Status VIP",
          ctaHref: "/pricing",
          secondaryText: "Lihat Paket Langganan",
        };
      default:
        return {
          icon: <Sparkle size={40} className="text-[#D9A52E]" weight="duotone" />,
          title: "Akses Konten Eksklusif",
          badge: "Fitur Premium",
          defaultMessage:
            customMessage ||
            "Konten ini memerlukan paket langganan aktif. Silakan pilih paket terbaik Anda.",
          ctaText: "Lihat Pilihan Paket",
          ctaHref: "/pricing",
          secondaryText: "Buka Pricing",
        };
    }
  };

  const content = getReasonContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#D9A52E]/30 bg-gradient-to-b from-[#1c1810] via-[#121212] to-[#0d0d0d] p-6 sm:p-8 shadow-2xl shadow-black/80 text-center">
        {/* Close Button if Allowed */}
        {allowClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Tutup paywall"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#D9A52E]/10 border border-[#D9A52E]/30 flex items-center justify-center mx-auto mb-4 shadow-inner shadow-[#D9A52E]/20">
          {content.icon}
        </div>

        {/* Badge */}
        <span className="inline-block px-3 py-1 rounded-full bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E] text-xs font-bold uppercase tracking-wider mb-2">
          {content.badge}
        </span>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] tracking-tight mb-3">
          {content.title}
        </h3>

        {/* Message */}
        <p className="text-sm text-neutral-300 leading-relaxed mb-6 max-w-md mx-auto">
          {resolvedCustomMessage || content.defaultMessage}
        </p>

        {/* Tier Comparison Mini-Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Paket Free
            </div>
            <ul className="text-xs text-neutral-400 space-y-1">
              <li>• Maks. 5 episode/hari</li>
              <li>• Maks. 60 menit per film</li>
              <li>• Reset kuota harian</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-[#D9A52E]/40 bg-[#D9A52E]/10 relative overflow-hidden">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#D9A52E] mb-1">
              <Crown size={14} weight="fill" />
              <span>Premium VIP</span>
            </div>
            <ul className="text-xs text-neutral-200 space-y-1">
              <li>✓ Tanpa batas episode Free</li>
              <li>✓ Nonton film penuh 100%</li>
              <li>✓ Lencana resmi VIP Member</li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {content.secondaryHref && (
            <Link
              href={content.secondaryHref}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition text-center"
            >
              {content.secondaryText}
            </Link>
          )}

          {allowClose && onClose && !content.secondaryHref && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition cursor-pointer"
            >
              Tutup Pemutar
            </button>
          )}

          <Link
            href={content.ctaHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] hover:from-[#e5b33d] hover:to-[#c49226] text-neutral-950 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-[#D9A52E]/20 transition cursor-pointer"
          >
            <Crown size={16} weight="bold" />
            <span>{content.ctaText}</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export { PremiumRequiredModal } from "./PremiumRequiredModal";
