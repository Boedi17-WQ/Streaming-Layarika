"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { SignOut, X, Spinner, ShieldCheck } from "@phosphor-icons/react";
import { handleSignOut } from "@/app/actions/auth";

export interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  userEmail?: string | null;
  onConfirmSignOut?: () => Promise<void> | void;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  onConfirmSignOut,
}: LogoutConfirmModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClose = useCallback(() => {
    if (isLoggingOut) return;
    setIsLoggingOut(false);
    onClose();
  }, [isLoggingOut, onClose]);

  // Keyboard accessibility: Tekan Escape untuk membatalkan
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoggingOut) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoggingOut, handleClose]);

  // Cegah scroll pada body saat modal konfirmasi terbuka
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      if (onConfirmSignOut) {
        await onConfirmSignOut();
      } else {
        await handleSignOut();
      }
    } catch (err) {
      console.warn("Sign out processing:", err);
    } finally {
      // Navigasi cepat dan pasti ke beranda sehingga sesi ter-reset instan tanpa blocking
      window.location.replace("/");
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onClick={(e) => {
        // Tutup jika klik pada backdrop luar
        if (e.target === e.currentTarget && !isLoggingOut) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/25 bg-gradient-to-b from-[#1c1414] via-[#141414] to-[#0d0d0d] p-6 sm:p-7 shadow-2xl shadow-black/90 text-center animate-in zoom-in-95 duration-200">
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer"
          aria-label="Tutup jendela konfirmasi"
        >
          <X size={18} />
        </button>

        {/* Brand Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 shadow-inner shadow-red-500/20 text-red-400">
          <SignOut size={32} weight="duotone" />
        </div>

        {/* Logo Text */}
        <div className="text-xs font-black tracking-widest uppercase text-neutral-400 mb-1">
          LAYAR<span className="text-[#D9A52E]">RIKA</span>
        </div>

        {/* Title */}
        <h2
          id="logout-confirm-title"
          className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] tracking-tight mb-2"
        >
          Keluar dari Akun?
        </h2>

        {/* Informasi Akun Aktif */}
        {(userName || userEmail) && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1c] border border-neutral-800 text-[11px] text-neutral-300 mb-4 max-w-full truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
            <span className="truncate font-medium">{userName || userEmail}</span>
          </div>
        )}

        {/* Deskripsi */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
          Apakah Anda yakin ingin keluar dari sesi akun LayarRika Anda? Watchlist, riwayat tontonan, dan status langganan VIP Anda akan tetap tersimpan aman di server kami.
        </p>

        {/* Tombol Aksi Konfirmasi */}
        <form onSubmit={handleSubmit} className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoggingOut}
            className="w-full sm:w-1/2 flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-40 px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-200 transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isLoggingOut}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-950/60 transition cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <Spinner size={16} className="animate-spin" />
                <span>Mengeluarkan...</span>
              </>
            ) : (
              <>
                <SignOut size={16} weight="bold" />
                <span>Ya, Keluar</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck size={14} className="text-[#D9A52E]" />
          <span>Sesi Anda akan ditutup dengan aman</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
