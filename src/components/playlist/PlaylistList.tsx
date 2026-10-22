"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Trash,
  PencilSimple,
  FilmStrip,
  FolderOpen,
  Television,
  WarningCircle,
  Spinner,
  CaretRight,
} from "@phosphor-icons/react";
import {
  createPlaylistAction,
  updatePlaylistAction,
  deletePlaylistAction,
} from "@/app/actions/playlist";

interface PlaylistItemPreview {
  id: string;
  posterPath: string | null;
  title: string;
  mediaType: "MOVIE" | "TV";
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
  };
  items: PlaylistItemPreview[];
}

interface PlaylistListProps {
  initialPlaylists: PlaylistSummary[];
}

export function PlaylistList({ initialPlaylists }: PlaylistListProps) {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>(initialPlaylists);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (playlist: PlaylistSummary) => {
    setFormName(playlist.name);
    setFormDescription(playlist.description || "");
    setFormError(null);
    setEditingPlaylist(playlist);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Nama playlist wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await createPlaylistAction({
        name: formName.trim(),
        description: formDescription.trim() || null,
      });

      if (res.success && res.data) {
        const newPlaylist: PlaylistSummary = {
          id: res.data.id,
          name: res.data.name,
          description: formDescription.trim() || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { items: 0 },
          items: [],
        };
        setPlaylists((prev) => [newPlaylist, ...prev]);
        setIsCreateOpen(false);
        resetForm();
      } else {
        setFormError(res.error || "Gagal membuat playlist");
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;
    if (!formName.trim()) {
      setFormError("Nama playlist wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await updatePlaylistAction({
        id: editingPlaylist.id,
        name: formName.trim(),
        description: formDescription.trim() || null,
      });

      if (res.success) {
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === editingPlaylist.id
              ? {
                  ...p,
                  name: formName.trim(),
                  description: formDescription.trim() || null,
                  updatedAt: new Date(),
                }
              : p
          )
        );
        setEditingPlaylist(null);
        resetForm();
      } else {
        setFormError(res.error || "Gagal memperbarui playlist");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deletePlaylistAction(id);
      if (res.success) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        setDeletingId(null);
      } else {
        alert(res.error || "Gagal menghapus playlist");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Koleksi Pribadi ({playlists.length})
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Susun daftar tontonan kustom film dan serial TV favorit Anda
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold shadow-lg shadow-amber-500/10 transition cursor-pointer"
        >
          <Plus size={18} weight="bold" />
          <span>Buat Playlist Baru</span>
        </button>
      </div>

      {/* Playlist Grid */}
      {playlists.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800/60 flex items-center justify-center text-neutral-500 mb-4">
            <FolderOpen size={32} weight="duotone" />
          </div>
          <h3 className="text-lg font-semibold text-white">Belum Ada Playlist Kustom</h3>
          <p className="text-neutral-400 text-sm max-w-md mt-2 mb-6">
            Buat playlist pertama Anda sekarang untuk mengelompokkan film maraton, serial akhir pekan, atau favorit keluarga.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Mulai Buat Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => {
            const hasItems = playlist.items && playlist.items.length > 0;
            return (
              <div
                key={playlist.id}
                className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/50 hover:border-amber-500/40 hover:bg-neutral-900/80 transition duration-300 flex flex-col overflow-hidden"
              >
                {/* Thumbnail Preview Area */}
                <Link
                  href={`/playlists/${playlist.id}`}
                  className="relative aspect-video w-full bg-neutral-950/80 overflow-hidden block"
                >
                  {hasItems ? (
                    <div
                      className={`grid w-full h-full gap-1 p-1 ${
                        playlist.items.length === 1
                          ? "grid-cols-1"
                          : playlist.items.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 grid-rows-2"
                      }`}
                    >
                      {playlist.items.slice(0, 4).map((item, idx) => (
                        <div key={item.id || idx} className="relative w-full h-full bg-neutral-900 overflow-hidden rounded">
                          {item.posterPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              {item.mediaType === "MOVIE" ? <FilmStrip size={20} /> : <Television size={20} />}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-2">
                      <FolderOpen size={36} weight="light" />
                      <span className="text-xs uppercase tracking-wider font-medium text-neutral-500">
                        Playlist Kosong
                      </span>
                    </div>
                  )}

                  {/* Item Count Badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs font-medium text-neutral-300">
                    {playlist._count.items} Media
                  </div>
                </Link>

                {/* Details Area */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/playlists/${playlist.id}`}
                      className="group-hover:text-amber-400 text-white font-bold text-lg line-clamp-1 transition flex items-center justify-between"
                    >
                      <span>{playlist.name}</span>
                      <CaretRight size={16} className="text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                    </Link>
                    {playlist.description && (
                      <p className="text-sm text-neutral-400 line-clamp-2 mt-1.5">
                        {playlist.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-800/60 text-xs text-neutral-500">
                    <span>
                      Diperbarui {new Date(playlist.updatedAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(playlist)}
                        aria-label={`Edit ${playlist.name}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingId(playlist.id)}
                        aria-label={`Hapus ${playlist.name}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Buat Playlist */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Buat Playlist Baru</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Berikan judul yang menarik untuk koleksi film atau serial kustom Anda.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <WarningCircle size={16} weight="bold" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Nama Playlist <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={100}
                  placeholder="Misal: Maraton Marvel, Horor Malam Ini"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Catatan kecil tentang daftar tontonan ini..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                  <span>Simpan Playlist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Playlist */}
      {editingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Edit Playlist</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Perbarui judul atau deskripsi playlist Anda.
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
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
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
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Hapus Playlist Ini?</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Playlist beserta daftar item di dalamnya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
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
