"use client";

import { useState } from "react";
import {
  FilmStrip,
  Television,
  Plus,
  MagnifyingGlass,
  Play,
  PencilSimple,
  Trash,
  Crown,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { AssetFormModal, PlaybackAssetFormData } from "./AssetFormModal";
import { AssetPreviewModal, PreviewAssetData } from "./AssetPreviewModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export interface PlaybackAssetItem {
  id: string;
  title: string;
  mediaType: "MOVIE" | "TV";
  tmdbId?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  videoUrl: string;
  mimeType: string;
  quality: string;
  durationSeconds?: number | null;
  isPublic: boolean;
  isPremiumRequired: boolean;
  sourceAttribution?: string | null;
  createdAt: Date;
}

interface AdminAssetsClientProps {
  initialAssets: PlaybackAssetItem[];
}

export function AdminAssetsClient({
  initialAssets,
}: AdminAssetsClientProps) {
  const [assets] = useState(initialAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"ALL" | "MOVIE" | "TV">("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PlaybackAssetFormData | null>(null);
  const [previewAsset, setPreviewAsset] = useState<PreviewAssetData | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<{ id: string; title: string } | null>(null);

  // Client-side filtering
  const filteredAssets = assets.filter((asset) => {
    if (mediaTypeFilter !== "ALL" && asset.mediaType !== mediaTypeFilter) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = asset.title.toLowerCase().includes(q);
      const matchTmdb = asset.tmdbId ? String(asset.tmdbId).includes(q) : false;
      const matchAttr = asset.sourceAttribution ? asset.sourceAttribution.toLowerCase().includes(q) : false;
      return matchTitle || matchTmdb || matchAttr;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Manajemen Aset Video Legal
          </h2>
          <p className="text-xs text-neutral-400">
            Daftarkan dan kelola URL video sah (HLS .m3u8 / MP4), sesuaikan kualitas, dan tentukan hak akses VIP.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAsset(null);
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-xs font-bold uppercase tracking-wider hover:from-[#e5b33d] hover:to-[#c49226] transition shadow-md shadow-[#D9A52E]/15 cursor-pointer shrink-0"
        >
          <Plus size={16} weight="bold" />
          <span>Tambah Aset Video</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-neutral-800 bg-[#121212]">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul aset, TMDB ID, atau atribusi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D9A52E] transition"
          />
        </div>

        {/* Media Type Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => setMediaTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mediaTypeFilter === "ALL"
                ? "bg-[#D9A52E] text-neutral-950"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Semua ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setMediaTypeFilter("MOVIE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              mediaTypeFilter === "MOVIE"
                ? "bg-[#D9A52E] text-neutral-950"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FilmStrip size={14} />
            <span>Film</span>
          </button>
          <button
            type="button"
            onClick={() => setMediaTypeFilter("TV")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              mediaTypeFilter === "TV"
                ? "bg-[#D9A52E] text-neutral-950"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Television size={14} />
            <span>Serial</span>
          </button>
        </div>
      </div>

      {/* Assets Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-200">
            <thead className="border-b border-neutral-800 bg-neutral-900/80 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Aset & Judul
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Tipe & TMDB ID
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Kualitas & Format
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Akses VIP
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                    Tidak ada aset video yang cocok dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-neutral-900/40 transition">
                    {/* Judul & URL */}
                    <td className="px-5 py-4 max-w-xs sm:max-w-sm">
                      <div className="space-y-1">
                        <p className="font-bold text-white text-sm truncate">
                          {asset.title}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-400 truncate max-w-xs">
                          {asset.videoUrl}
                        </p>
                        {asset.sourceAttribution && (
                          <span className="inline-block text-[10px] text-[#D9A52E] truncate">
                            {asset.sourceAttribution}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tipe & TMDB ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-700 text-[11px] font-semibold text-neutral-300">
                          {asset.mediaType === "MOVIE" ? (
                            <>
                              <FilmStrip size={13} />
                              <span>Film</span>
                            </>
                          ) : (
                            <>
                              <Television size={13} />
                              <span>
                                S{asset.seasonNumber || 1} E{asset.episodeNumber || 1}
                              </span>
                            </>
                          )}
                        </span>
                        {asset.tmdbId && (
                          <p className="text-[10px] text-neutral-400">
                            TMDB: <strong className="text-neutral-300">{asset.tmdbId}</strong>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Kualitas & MIME */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                          {asset.quality}
                        </span>
                        <p className="text-[10px] text-neutral-400 truncate">
                          {asset.mimeType?.includes("mpegURL") ? "HLS (.m3u8)" : "MP4 Video"}
                        </p>
                      </div>
                    </td>

                    {/* VIP Required */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {asset.isPremiumRequired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/30 text-[10px] font-black uppercase">
                          <Crown size={12} weight="fill" />
                          <span>Wajib VIP</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold">
                          Free & VIP
                        </span>
                      )}
                    </td>

                    {/* Status Publik */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {asset.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle size={14} weight="fill" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-neutral-500 text-[11px] font-semibold">
                          <XCircle size={14} weight="fill" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewAsset(asset)}
                          title="Test Putar Video"
                          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-[#D9A52E] hover:border-[#D9A52E]/50 transition cursor-pointer"
                        >
                          <Play size={15} weight="fill" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingAsset(asset);
                            setIsAddOpen(true);
                          }}
                          title="Edit Aset"
                          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
                        >
                          <PencilSimple size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingAsset({ id: asset.id, title: asset.title })}
                          title="Hapus Aset"
                          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-red-400 hover:border-red-500/50 transition cursor-pointer"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AssetFormModal
        isOpen={isAddOpen}
        initialData={editingAsset}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAsset(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Preview Player Modal */}
      <AssetPreviewModal
        isOpen={Boolean(previewAsset)}
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingAsset)}
        asset={deletingAsset}
        onClose={() => setDeletingAsset(null)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
