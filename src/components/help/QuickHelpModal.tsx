"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Question,
  X,
  Play,
  Crown,
  ArrowsClockwise,
  ArrowRight,
  Television,
} from "@phosphor-icons/react";

export interface QuickHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType?: "MOVIE" | "TV";
  mediaTitle?: string;
}

export function QuickHelpModal({
  isOpen,
  onClose,
  mediaType = "TV",
  mediaTitle,
}: QuickHelpModalProps) {
  // Tangani penutupan dengan tombol Escape untuk aksesibilitas keyboard
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-[#18181b] via-[#111113] to-[#0a0a0c] p-5 sm:p-6 shadow-2xl shadow-black/90 text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Tutup jendela bantuan"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E]">
            <Question size={22} weight="bold" />
          </div>
          <div>
            <h2 id="help-modal-title" className="text-base sm:text-lg font-bold text-white leading-tight">
              Pusat Bantuan & Tips Menonton
            </h2>
            <p className="text-xs text-neutral-400">
              {mediaTitle ? `Panduan pemutaran untuk "${mediaTitle}"` : "Panduan pemutar streaming LayarRika"}
            </p>
          </div>
        </div>

        {/* Konten Tips Praktis */}
        <div className="space-y-3.5 text-xs text-neutral-300">
          {/* 1. Pemilihan Server */}
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Play size={15} weight="fill" className="text-[#D9A52E]" />
              <span>Pilihan Server Pemutar</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Tersedia <strong className="text-white">Server 1 (HD)</strong> dan <strong className="text-white">Server 2 (MULTI)</strong>. Jika salah satu server mengalami kendala jaringan atau buffering, cukup klik tombol server lain pada bar kontrol di bawah pemutar untuk beralih instan.
            </p>
          </div>

          {/* 2. Serial & Episode (Khusus TV) */}
          {mediaType === "TV" && (
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Television size={15} weight="fill" className="text-blue-400" />
                <span>Navigasi Musim & Episode</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Pilih nomor episode pada daftar untuk langsung menonton. Episode 1 sampai 5 dapat diakses gratis oleh semua pengguna. Gunakan tombol <strong className="text-white">&quot;Eps Selanjutnya&quot;</strong> untuk melanjutkan maraton serial secara otomatis.
              </p>
            </div>
          )}

          {/* 3. Akses VIP Member */}
          <div className="rounded-xl border border-[#D9A52E]/20 bg-[#D9A52E]/5 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[#D9A52E] font-semibold">
              <Crown size={15} weight="fill" />
              <span>Akses VIP Member</span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Pengguna <strong className="text-[#D9A52E]">VIP Member</strong> menikmati kebebasan menonton tanpa kuota harian, membuka episode 6 ke atas pada semua serial, server prioritas berkecepatan tinggi, dan unduhan invoice bukti pembayaran resmi.
            </p>
          </div>

          {/* 4. Solusi Buffering atau Video Tidak Muncul */}
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ArrowsClockwise size={15} weight="bold" className="text-emerald-400" />
              <span>Solusi Video Terkendala / Blank?</span>
            </div>
            <ul className="text-neutral-400 text-[11px] space-y-1 list-disc list-inside">
              <li>Coba beralih antara Server 1 dan Server 2.</li>
              <li>Periksa koneksi internet Anda atau nonaktifkan ekstensi pemblokir iklan (adblocker) yang terlalu agresif.</li>
              <li>Muat ulang (refresh) halaman peramban Anda jika pemutar tidak merespons.</li>
            </ul>
          </div>
        </div>

        {/* Footer Tombol Tindakan */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/help"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
          >
            <span>Buka Panduan Lengkap Website</span>
            <ArrowRight size={14} weight="bold" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D9A52E] hover:bg-[#c49226] text-black text-xs font-bold transition cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

