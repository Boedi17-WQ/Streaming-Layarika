"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Crown,
  Warning,
  Spinner,
  XCircle,
  X,
} from "@phosphor-icons/react";
import { grantUserVipAction, revokeUserVipAction } from "@/app/actions/admin";

interface UserVipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    isVip: boolean;
    vipEndDate: Date | string | null;
  } | null;
}

const PRESET_DURATIONS = [
  { label: "7 Hari (Trial)", days: 7 },
  { label: "30 Hari (1 Bulan)", days: 30 },
  { label: "90 Hari (3 Bulan)", days: 90 },
  { label: "365 Hari (1 Tahun)", days: 365 },
];

interface UserVipDialogProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    isVip: boolean;
    vipEndDate: Date | string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

function UserVipDialog({ user, onClose, onSuccess }: UserVipDialogProps) {
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGrant = async () => {
    setLoading(true);
    setErrorMessage(null);

    const days = isCustom ? parseInt(customDays, 10) : selectedDays;
    if (isNaN(days) || days < 1 || days > 365) {
      setErrorMessage("Durasi hari harus antara 1 sampai 365 hari.");
      setLoading(false);
      return;
    }

    try {
      const res = await grantUserVipAction(user.id, days);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal memberikan akses VIP.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(`Cabut status VIP pengguna ${user.name || user.email}?`)) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await revokeUserVipAction(user.id);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal mencabut status VIP.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const formattedEndDate = user.vipEndDate
    ? new Date(user.vipEndDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#141414] shadow-2xl p-6 sm:p-7 text-neutral-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E]">
              <Crown size={24} weight="fill" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Kelola Akses VIP Pengguna
              </h2>
              <p className="text-xs text-neutral-400">
                Aktivasi manual langganan LayarRika Premium VIP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-400">Target Akun:</p>
            <p className="text-sm font-bold text-white">{user.name || "Tanpa Nama"}</p>
            <p className="text-xs text-neutral-400">{user.email}</p>
          </div>
          <div>
            {user.isVip ? (
              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/40 text-[10px] font-black uppercase">
                  VIP Aktif
                </span>
                <p className="text-[10px] text-neutral-400 mt-1">s/d {formattedEndDate}</p>
              </div>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[10px] font-bold uppercase">
                Free Tier
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            <Warning size={16} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Duration Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-300 block">
            Pilih Durasi Tambahan VIP:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = !isCustom && selectedDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedDays(preset.days);
                  }}
                  className={`p-3 rounded-xl text-left border text-xs font-semibold transition ${
                    isSelected
                      ? "border-[#D9A52E] bg-[#D9A52E]/15 text-[#D9A52E] shadow-sm shadow-[#D9A52E]/10"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Duration Option */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="radio"
                name="customDuration"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="text-[#D9A52E] focus:ring-[#D9A52E]"
              />
              <span>Atur durasi kustom (hari):</span>
            </label>
            {isCustom && (
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Jumlah hari (misal: 14)"
                className="mt-2 w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800">
          {user.isVip ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleRevoke}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition disabled:opacity-50"
            >
              <XCircle size={16} />
              <span>Cabut Akses VIP</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleGrant}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-xs font-bold uppercase tracking-wider hover:from-[#e5b33d] hover:to-[#c49226] transition disabled:opacity-50 shadow-md shadow-[#D9A52E]/10"
            >
              {loading ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Crown size={16} weight="fill" />
                  <span>
                    {user.isVip ? "Perpanjang VIP" : "Aktifkan VIP Sekarang"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserVipModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: UserVipModalProps) {
  if (typeof document === "undefined" || !isOpen || !user) return null;

  return createPortal(
    <UserVipDialog
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
    document.body
  );
}
