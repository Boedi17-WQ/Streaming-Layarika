"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { FilmReel, X, SignIn, ShieldCheck } from "@phosphor-icons/react";
import { signInWithGithubAction } from "@/app/actions/auth";

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

  const safeCallbackUrl = callbackUrl && !callbackUrl.startsWith("http") ? callbackUrl : "/";

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
          {/* Tombol Masuk dengan GitHub */}
          <form
            action={async () => {
              await signInWithGithubAction(safeCallbackUrl);
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-[#24292e] hover:bg-[#2b3137] px-4 py-3 text-sm font-bold text-white shadow-lg transition duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Masuk dengan GitHub</span>
            </button>
          </form>

          {/* Tombol Masuk dengan Email & Kata Sandi */}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D9A52E]/40 bg-[#D9A52E]/10 hover:bg-[#D9A52E]/20 px-4 py-2.5 text-xs font-bold text-[#D9A52E] transition duration-200"
          >
            <SignIn size={16} />
            <span>Masuk dengan Email & Kata Sandi</span>
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
