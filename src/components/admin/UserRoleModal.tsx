"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  User,
  Warning,
  Spinner,
  CheckCircle,
  X,
} from "@phosphor-icons/react";
import { updateUserRoleAction } from "@/app/actions/admin";

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: "USER" | "ADMIN";
  } | null;
  currentAdminId: string;
}

interface UserRoleDialogProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: "USER" | "ADMIN";
  };
  currentAdminId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function UserRoleDialog({
  user,
  currentAdminId,
  onClose,
  onSuccess,
}: UserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<"USER" | "ADMIN">(user.role);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSelf = user.id === currentAdminId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelf && selectedRole !== "ADMIN") {
      setErrorMessage("Anda tidak dapat mencabut hak akses Admin dari akun Anda sendiri.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await updateUserRoleAction(user.id, selectedRole);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal mengubah role pengguna.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan internal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#141414] shadow-2xl p-6 text-neutral-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck size={22} weight="fill" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ubah Wewenang Akun</h3>
              <p className="text-xs text-neutral-400">Atur hak akses USER atau ADMIN</p>
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

        {/* Target Info */}
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <p className="text-xs text-neutral-400">Pengguna:</p>
          <p className="text-sm font-bold text-white">{user.name || "Tanpa Nama"}</p>
          <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            <Warning size={16} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Pilih Role Baru:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("USER")}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  selectedRole === "USER"
                    ? "border-[#D9A52E] bg-[#D9A52E]/15 text-[#D9A52E] shadow-sm shadow-[#D9A52E]/10"
                    : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span className="font-bold text-xs">USER</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Akses standar penonton streaming katalog LayarRika.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("ADMIN")}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  selectedRole === "ADMIN"
                    ? "border-[#D9A52E] bg-[#D9A52E]/15 text-[#D9A52E] shadow-sm shadow-[#D9A52E]/10"
                    : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} weight="fill" />
                  <span className="font-bold text-xs">ADMIN</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Akses penuh ke dashboard, aset video, dan manajemen user.
                </span>
              </button>
            </div>
          </div>

          {selectedRole === "ADMIN" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2">
              <Warning size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                Pengguna dengan role <strong>ADMIN</strong> memiliki wewenang mengelola aset video, mengubah status pengguna, dan memberi akses VIP gratis.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || (isSelf && selectedRole !== "ADMIN")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-xs font-bold uppercase tracking-wider hover:from-[#e5b33d] hover:to-[#c49226] transition disabled:opacity-50 shadow-md shadow-[#D9A52E]/10"
            >
              {loading ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} weight="bold" />
                  <span>Simpan Perubahan Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserRoleModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  currentAdminId,
}: UserRoleModalProps) {
  if (typeof document === "undefined" || !isOpen || !user) return null;

  return createPortal(
    <UserRoleDialog
      key={user.id}
      user={user}
      currentAdminId={currentAdminId}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
    document.body
  );
}
