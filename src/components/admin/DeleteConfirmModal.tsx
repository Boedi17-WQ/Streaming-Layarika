"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash, Warning, Spinner } from "@phosphor-icons/react";
import { deletePlaybackAssetAction } from "@/app/actions/admin";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: {
    id: string;
    title: string;
  } | null;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (typeof document === "undefined" || !isOpen || !asset) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await deletePlaybackAssetAction(asset.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus aset video.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan internal.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#161212] p-6 shadow-2xl text-neutral-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400">
            <Trash size={24} weight="fill" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Hapus Aset Video</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus aset video{" "}
              <strong className="text-red-300">&ldquo;{asset.title}&rdquo;</strong>? Tindakan
              ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
            <Warning size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-red-900/30"
          >
            {loading ? (
              <>
                <Spinner size={14} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash size={14} weight="bold" />
                <span>Ya, Hapus Aset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
