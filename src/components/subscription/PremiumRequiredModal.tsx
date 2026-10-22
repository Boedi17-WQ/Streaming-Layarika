"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Television,
  FilmReel,
  X,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";

export type PremiumGateReason =
  | "EPISODE_LIMIT_REACHED"
  | "MOVIE_LIMIT_REACHED"
  | "EXPIRED"
  | "GENERIC";

export interface PremiumRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: PremiumGateReason;
  usedEpisodes?: number;
  episodeLimit?: number;
  remainingEpisodes?: number;
  consumedSeconds?: number;
  movieLimitSeconds?: number;
  userPlanName?: string;
  customMessage?: string;
}

export function PremiumRequiredModal({
  isOpen,
  onClose,
  reason = "EPISODE_LIMIT_REACHED",
  usedEpisodes = 5,
  episodeLimit = 5,
  remainingEpisodes = 0,
  consumedSeconds = 3600,
  movieLimitSeconds = 3600,
  userPlanName = "Paket Free",
  customMessage,
}: PremiumRequiredModalProps) {
  // Aksesibilitas keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMovieLimit = reason === "MOVIE_LIMIT_REACHED";

  // Judul & Deskripsi resmi sesuai Addendum Tahap 9 Bagian 4
  const title = isMovieLimit
    ? "Batas 60 Menit Film Tercapai"
    : "Kuota 5 episode gratis hari ini telah habis.";

  const description = isMovieLimit
    ? (customMessage ||
      "Batas tontonan Free untuk film ini (60 menit pemutaran aktual) telah tercapai. Aktifkan Premium VIP untuk melanjutkan menonton hingga selesai tanpa jeda batas.")
    : (customMessage ||
      "Kamu sudah menggunakan seluruh kuota episode untuk paket Free. Aktifkan Premium VIP untuk membuka semua episode tanpa batas kuota Free.");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-gate-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#D9A52E]/40 bg-gradient-to-b from-[#1c1810] via-[#141414] to-[#0d0d0d] p-6 sm:p-8 shadow-2xl shadow-black/90 text-center">
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Tutup paywall"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#D9A52E]/10 border border-[#D9A52E]/30 flex items-center justify-center mx-auto mb-3 shadow-inner shadow-[#D9A52E]/20 text-[#D9A52E]">
          {isMovieLimit ? (
            <FilmReel size={36} weight="duotone" />
          ) : (
            <Crown size={38} weight="duotone" />
          )}
        </div>

        {/* Badge Jenis Batas */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkle size={12} weight="fill" />
          <span>{isMovieLimit ? "Batas Durasi Film Free" : "Batas Kuota Serial Free"}</span>
        </span>

        {/* Judul Utama Resmi */}
        <h2
          id="premium-gate-title"
          className="text-xl sm:text-2xl font-black text-[#F5F5F5] tracking-tight mb-2"
        >
          {title}
        </h2>

        {/* Deskripsi Resmi */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-5 max-w-md mx-auto">
          {description}
        </p>

        {/* Ringkasan Kuota & Status Pengguna */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="rounded-xl border border-[#2b2b2b] bg-[#121212] p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {isMovieLimit ? "Durasi Terpakai" : "Episode Terpakai"}
            </span>
            <div className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
              {isMovieLimit ? (
                <>
                  <Clock size={14} className="text-[#D9A52E]" />
                  <span>
                    {Math.round(consumedSeconds / 60)} / {Math.round(movieLimitSeconds / 60)} Menit
                  </span>
                </>
              ) : (
                <>
                  <Television size={14} className="text-[#D9A52E]" />
                  <span>
                    {usedEpisodes} dari {episodeLimit} Episode
                  </span>
                </>
              )}
            </div>
            <p className="text-[10px] text-neutral-400">
              {isMovieLimit ? "Sisa kuota: 0 detik" : `Sisa kuota: ${remainingEpisodes} episode`}
            </p>
          </div>

          <div className="rounded-xl border border-[#2b2b2b] bg-[#121212] p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Paket Saat Ini
            </span>
            <div className="text-sm font-bold text-[#D9A52E] flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>{userPlanName}</span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Reset: 00:00 WIB (Asia/Jakarta)
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Tombol Lihat Paket Premium */}
          <Link
            href="/pricing"
            className="w-full flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] hover:from-[#e5b338] hover:to-[#c49226] text-[#0A0A0A] font-extrabold text-sm py-3 px-5 shadow-lg shadow-[#D9A52E]/20 transition duration-200"
          >
            <Crown size={18} weight="fill" />
            <span>Lihat Paket Premium</span>
            <ArrowRight size={16} weight="bold" />
          </Link>

          {/* Tombol Kembali ke Katalog */}
          <Link
            href="/catalog"
            className="w-full sm:w-auto rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-3 px-4 transition duration-200"
          >
            Kembali ke Katalog
          </Link>
        </div>

        {/* Footer Info */}
        <p className="mt-4 text-[11px] text-neutral-400">
          Langganan VIP bersifat simulasi akademik. Tanpa kartu kredit atau biaya nyata.
        </p>
      </div>
    </div>
  );
}
