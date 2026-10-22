"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash,
  PencilSimple,
  ArrowUp,
  ArrowDown,
  Play,
  FilmStrip,
  Television,
  Calendar,
  WarningCircle,
  Spinner,
  FolderOpen,
} from "@phosphor-icons/react";
import {
  updatePlaylistAction,
  deletePlaylistAction,
  removePlaylistItemAction,
  reorderPlaylistItemsAction,
} from "@/app/actions/playlist";

export interface DetailPlaylistItem {
  id: string;
  playlistId: string;
  mediaType: "MOVIE" | "TV";
  tmdbId: number;
  title: string;
  posterPath: string | null;
  order: number;
  addedAt: Date;
}

export interface DetailPlaylist {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: DetailPlaylistItem[];
  _count: {
    items: number;
  };
}

interface PlaylistDetailViewProps {
  initialPlaylist: DetailPlaylist;
}

export function PlaylistDetailView({ initialPlaylist }: PlaylistDetailViewProps) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<DetailPlaylist>(initialPlaylist);
  const [items, setItems] = useState<DetailPlaylistItem[]>(initialPlaylist.items);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(initialPlaylist.name);
  const [editDescription, setEditDescription] = useState(initialPlaylist.description || "");
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Playlist Handler
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setFormError("Nama playlist tidak boleh kosong");
      return;
    }

    startTransition(async () => {
      const res = await updatePlaylistAction({
        id: playlist.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
      });

      if (res.success) {
        setPlaylist((prev) => ({
          ...prev,
          name: editName.trim(),
          description: editDescription.trim() || null,
          updatedAt: new Date(),
        }));
        setIsEditOpen(false);
        setFormError(null);
      } else {
        setFormError(res.error || "Gagal memperbarui playlist");
      }
    });
  };

  // Delete Playlist Handler
  const handleDeletePlaylist = () => {
    startTransition(async () => {
      const res = await deletePlaylistAction(playlist.id);
      if (res.success) {
        router.push("/playlists");
      } else {
        alert(res.error || "Gagal menghapus playlist");
      }
    });
  };

  // Remove Item Handler
  const handleRemoveItem = (itemId: string, title: string) => {
    startTransition(async () => {
      // Optimistic update
      const previousItems = [...items];
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      const res = await removePlaylistItemAction(playlist.id, itemId);
      if (!res.success) {
        setItems(previousItems);
        alert(res.error || `Gagal menghapus "${title}" dari playlist`);
      }
    });
  };

  // Reorder Item Handler (Move up / down)
  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Update order numbers
    const reordered = newItems.map((item, idx) => ({ ...item, order: idx }));
    setItems(reordered);

    startTransition(async () => {
      const itemIds = reordered.map((it) => it.id);
      const res = await reorderPlaylistItemsAction(playlist.id, itemIds);
      if (!res.success) {
        setItems(items);
        alert(res.error || "Gagal menyimpan urutan baru");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/playlists"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition mb-6 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
          <span>Kembali ke Daftar Playlist</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-neutral-800">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {playlist.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                {items.length} Media
              </span>
            </div>
            {playlist.description ? (
              <p className="text-neutral-400 text-sm leading-relaxed">
                {playlist.description}
              </p>
            ) : (
              <p className="text-neutral-500 text-sm italic">
                Tidak ada deskripsi playlist
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1">
              <span>
                Dibuat {new Date(playlist.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>•</span>
              <span>
                Diperbarui {new Date(playlist.updatedAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-start">
            <button
              onClick={() => {
                setEditName(playlist.name);
                setEditDescription(playlist.description || "");
                setIsEditOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              <PencilSimple size={16} />
              <span>Edit Info</span>
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
            >
              <Trash size={16} />
              <span>Hapus Playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800/60 flex items-center justify-center text-neutral-500 mb-4">
            <FolderOpen size={32} weight="duotone" />
          </div>
          <h3 className="text-lg font-semibold text-white">Playlist Masih Kosong</h3>
          <p className="text-neutral-400 text-sm max-w-md mt-2 mb-6">
            Anda belum menambahkan film atau serial TV ke playlist ini. Jelajahi katalog dan tekan tombol &quot;+ Playlist&quot; di halaman detail media.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition cursor-pointer"
          >
            <Play size={16} weight="fill" />
            <span>Jelajahi Katalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const detailUrl = item.mediaType === "MOVIE" ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;
            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900/80 transition"
              >
                {/* Media Thumbnail & Title */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-xs font-bold text-neutral-500 w-6 text-center shrink-0">
                    #{index + 1}
                  </span>

                  <Link href={detailUrl} className="relative w-14 h-20 bg-neutral-950 rounded-lg overflow-hidden shrink-0">
                    {item.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                        alt={item.title}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        {item.mediaType === "MOVIE" ? <FilmStrip size={20} /> : <Television size={20} />}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300">
                        {item.mediaType === "MOVIE" ? "Film" : "Serial TV"}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.addedAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <Link
                      href={detailUrl}
                      className="text-white font-semibold text-sm sm:text-base hover:text-amber-400 transition truncate block"
                    >
                      {item.title}
                    </Link>
                  </div>
                </div>

                {/* Item Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                  {/* Reorder Buttons */}
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 mr-2">
                    <button
                      onClick={() => handleMoveItem(index, "up")}
                      disabled={index === 0 || isPending}
                      title="Pindahkan ke atas"
                      className="p-1.5 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition cursor-pointer"
                    >
                      <ArrowUp size={14} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleMoveItem(index, "down")}
                      disabled={index === items.length - 1 || isPending}
                      title="Pindahkan ke bawah"
                      className="p-1.5 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition cursor-pointer"
                    >
                      <ArrowDown size={14} weight="bold" />
                    </button>
                  </div>

                  {/* Play Link */}
                  <Link
                    href={detailUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-semibold transition cursor-pointer"
                  >
                    <Play size={12} weight="fill" />
                    <span>Tonton</span>
                  </Link>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id, item.title)}
                    disabled={isPending}
                    title="Hapus dari playlist"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Edit Playlist Info */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Edit Info Playlist</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Perbarui judul atau catatan untuk playlist ini.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <WarningCircle size={16} weight="bold" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Nama Playlist <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-sm font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Spinner size={16} className="animate-spin" />}
                  <span>Perbarui</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Playlist */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Hapus Playlist &quot;{playlist.name}&quot;?</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Seluruh daftar item di dalam playlist ini akan dihapus secara permanen dari akun Anda.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePlaylist}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                {isPending && <Spinner size={14} className="animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
