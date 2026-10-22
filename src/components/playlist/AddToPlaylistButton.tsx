"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Playlist as PlaylistIcon,
  Plus,
  Check,
  X,
  Spinner,
  FolderPlus,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  getPlaylistsForMediaAction,
  addPlaylistItemAction,
  removePlaylistItemAction,
  createPlaylistAction,
} from "@/app/actions/playlist";

interface MediaPlaylistStatus {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  containsMedia: boolean;
  mediaItemId: string | null;
}

interface AddToPlaylistButtonProps {
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  className?: string;
}

export function AddToPlaylistButton({
  tmdbId,
  mediaType,
  title,
  posterPath,
  className = "",
}: AddToPlaylistButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<MediaPlaylistStatus[]>([]);
  const [isPending, startTransition] = useTransition();

  // New playlist form inside modal
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal & fetch user's playlists status
  const handleOpenModal = async () => {
    setLoadingPlaylists(true);
    setIsOpen(true);
    setFormError(null);

    const result = await getPlaylistsForMediaAction(tmdbId, mediaType);
    setLoadingPlaylists(false);

    if (!result.authenticated) {
      const currentPath = mediaType === "MOVIE" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      setIsOpen(false);
      return;
    }

    setPlaylists(result.playlists);
  };

  // Toggle item in a playlist
  const handleTogglePlaylist = (playlist: MediaPlaylistStatus) => {
    setFormError(null);

    startTransition(async () => {
      if (playlist.containsMedia && playlist.mediaItemId) {
        // Hapus dari playlist
        const res = await removePlaylistItemAction(playlist.id, playlist.mediaItemId);
        if (res.success) {
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlist.id
                ? {
                    ...p,
                    containsMedia: false,
                    mediaItemId: null,
                    itemCount: Math.max(0, p.itemCount - 1),
                  }
                : p
            )
          );
        } else {
          setFormError(res.error || "Gagal menghapus dari playlist");
        }
      } else {
        // Tambahkan ke playlist
        const res = await addPlaylistItemAction({
          playlistId: playlist.id,
          tmdbId,
          mediaType,
          title,
          posterPath,
        });

        if (res.success && res.data && typeof res.data === "object" && "id" in res.data) {
          const newItemId = (res.data as { id: string }).id;
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlist.id
                ? {
                    ...p,
                    containsMedia: true,
                    mediaItemId: newItemId,
                    itemCount: p.itemCount + 1,
                  }
                : p
            )
          );
        } else {
          setFormError(res.error || "Gagal menambahkan ke playlist");
        }
      }
    });
  };

  // Create playlist and automatically add media to it
  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      setFormError("Nama playlist wajib diisi");
      return;
    }

    startTransition(async () => {
      const createRes = await createPlaylistAction({
        name: newPlaylistName.trim(),
      });

      if (!createRes.success || !createRes.data) {
        setFormError(createRes.error || "Gagal membuat playlist");
        return;
      }

      const newId = createRes.data.id;
      const addRes = await addPlaylistItemAction({
        playlistId: newId,
        tmdbId,
        mediaType,
        title,
        posterPath,
      });

      const newItemId =
        addRes.success && addRes.data && typeof addRes.data === "object" && "id" in addRes.data
          ? (addRes.data as { id: string }).id
          : null;

      setPlaylists((prev) => [
        {
          id: newId,
          name: createRes.data?.name || newPlaylistName.trim(),
          description: null,
          itemCount: 1,
          containsMedia: true,
          mediaItemId: newItemId,
        },
        ...prev,
      ]);

      setNewPlaylistName("");
      setShowCreateForm(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        title="Kelola koleksi playlist"
        className={`group relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] border border-neutral-800 bg-neutral-900 text-neutral-200 hover:border-amber-500/50 hover:bg-neutral-800 hover:text-white cursor-pointer ${className}`}
      >
        <PlaylistIcon size={18} weight="bold" className="text-amber-500 group-hover:scale-110 transition" />
        <span>+ Playlist</span>
      </button>

      {/* Playlist Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white">Tambahkan ke Playlist</h3>
                <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                  {title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Notification */}
            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <WarningCircle size={16} weight="bold" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Content / Playlist List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {loadingPlaylists ? (
                <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
                  <Spinner size={24} className="animate-spin text-amber-500 mb-2" />
                  <span className="text-xs">Memuat daftar playlist...</span>
                </div>
              ) : playlists.length === 0 && !showCreateForm ? (
                <div className="text-center py-8">
                  <FolderPlus size={36} className="text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">Belum Memiliki Playlist</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                    Buat playlist kustom pertama Anda untuk mengelompokkan tontonan ini.
                  </p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleTogglePlaylist(playlist)}
                    disabled={isPending}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left cursor-pointer ${
                      playlist.containsMedia
                        ? "border-amber-500/40 bg-amber-500/10 text-white"
                        : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-sm truncate">{playlist.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {playlist.itemCount} Media
                      </div>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
                        playlist.containsMedia
                          ? "bg-amber-500 text-neutral-950"
                          : "border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {playlist.containsMedia ? (
                        <Check size={16} weight="bold" />
                      ) : (
                        <Plus size={14} weight="bold" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer / Create Section */}
            <div className="pt-4 border-t border-neutral-800">
              {showCreateForm ? (
                <form onSubmit={handleCreateAndAdd} className="space-y-3">
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={100}
                    placeholder="Nama playlist baru..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      {isPending && <Spinner size={12} className="animate-spin" />}
                      <span>Buat & Simpan</span>
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-700 hover:border-amber-500/50 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                >
                  <Plus size={16} weight="bold" className="text-amber-500" />
                  <span>Buat Playlist Baru</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
