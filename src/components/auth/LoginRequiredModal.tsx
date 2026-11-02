"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { FilmReel, X, SignIn, ShieldCheck } from "@phosphor-icons/react";

export interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
  mediaTitle?: string;
  mediaType?: "MOVIE" | "TV";
  seasonNumber?: number;
  episodeNumber?: number;
  isAuthenticated?: boolean;
}

export function LoginRequiredModal({
  isOpen,
  onClose,
  callbackUrl = "/",
  mediaTitle,
  mediaType,
  seasonNumber,
  episodeNumber,
  isAuthenticated = false,
}: LoginRequiredModalProps) {

  // Tutup dengan tombol Escape untuk aksesibilitas keyboard
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

  if (!isOpen || isAuthenticated) return null;

  const safeCallbackUrl = callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#D9A52E]/30 bg-gradient-to-b from-[#1c1810] via-[#141414] to-[#0d0d0d] p-6 sm:p-8 shadow-2xl shadow-black/80 text-center">
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Tutup jendela masuk"
        >
          <X size={18} />
        </button>

        {/* Brand Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-[#D9A52E]/10 border border-[#D9A52E]/30 flex items-center justify-center mx-auto mb-4 shadow-inner shadow-[#D9A52E]/20 text-[#D9A52E]">
          <FilmReel size={36} weight="duotone" />
        </div>

        {/* Logo Text */}
        <div className="text-xs font-black tracking-widest uppercase text-neutral-400 mb-1">
          LAYAR<span className="text-[#D9A52E]">RIKA</span>
        </div>

        {/* Title Resmi Sesuai Ketentuan Addendum Tahap 9 */}
        <h2
          id="login-modal-title"
          className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] tracking-tight mb-2"
        >
          Masuk ke LayarRika untuk mulai menonton.
        </h2>

        {/* Konteks Media yang sedang dipilih */}
        {mediaTitle && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1c] border border-[#2b2b2b] text-[11px] text-[#A3A3A3] mb-4 max-w-full truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D9A52E] shrink-0" />
            <span className="truncate">
              {mediaTitle}
              {mediaType === "TV" && seasonNumber && episodeNumber
                ? ` • S${seasonNumber}:E${episodeNumber}`
                : ""}
            </span>
          </div>
        )}

        {/* Informasi Kebutuhan Login */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
          Login diperlukan untuk menyimpan riwayat tontonan Anda, mengelola kuota tontonan harian, dan memastikan akses streaming Anda tercatat aman.
        </p>

        {/* Tombol Aksi Masuk */}
        <div className="space-y-3">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] hover:from-[#e5b33d] hover:to-[#c49226] px-4 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-[#D9A52E]/20 transition duration-200 cursor-pointer"
          >
            <SignIn size={18} weight="bold" />
            <span>Masuk ke Akun Anda</span>
          </Link>
        </div>

        {/* Footer Info & Link Daftar */}
        <div className="mt-6 pt-4 border-t border-[#222222] text-xs text-neutral-400 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <ShieldCheck size={14} className="text-[#D9A52E]" />
            <span>Katalog metadata tetap dapat dijelajahi bebas tanpa login</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Belum punya akun?{" "}
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`}
              className="text-[#D9A52E] font-semibold hover:underline"
            >
              Daftar akun gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
