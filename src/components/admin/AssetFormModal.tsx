"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FilmStrip,
  Television,
  CheckCircle,
  Warning,
  Spinner,
  Sparkle,
} from "@phosphor-icons/react";
import {
  createPlaybackAssetAction,
  updatePlaybackAssetAction,
} from "@/app/actions/admin";

export interface PlaybackAssetFormData {
  id?: string;
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
}

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: PlaybackAssetFormData | null;
}

// Preset sumber video legal terverifikasi untuk kemudahan demo / pengujian
const PRESET_LEGAL_STREAMS = [
  {
    name: "Tears of Steel (MP4 1080p)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    mime: "video/mp4",
    attr: "Blender Foundation (CC BY 3.0)",
    duration: 734,
  },
  {
    name: "Big Buck Bunny (MP4 1080p)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    mime: "video/mp4",
    attr: "Blender Foundation (CC BY 3.0)",
    duration: 596,
  },
  {
    name: "Sintel (MP4 1080p)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    mime: "video/mp4",
    attr: "Blender Foundation (CC BY 3.0)",
    duration: 888,
  },
  {
    name: "Akamai Multi-Bitrate (HLS .m3u8)",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    mime: "application/x-mpegURL",
    attr: "Mux Open Test Stream (HLS)",
    duration: 634,
  },
];

interface AssetFormDialogProps {
  initialData?: PlaybackAssetFormData | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AssetFormDialog({ initialData, onClose, onSuccess }: AssetFormDialogProps) {
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState<PlaybackAssetFormData>(() => {
    if (initialData) {
      return {
        id: initialData.id,
        title: initialData.title || "",
        mediaType: initialData.mediaType || "MOVIE",
        tmdbId: initialData.tmdbId ?? null,
        seasonNumber: initialData.seasonNumber ?? null,
        episodeNumber: initialData.episodeNumber ?? null,
        videoUrl: initialData.videoUrl || "",
        mimeType: initialData.mimeType || "application/x-mpegURL",
        quality: initialData.quality || "1080p",
        durationSeconds: initialData.durationSeconds ?? null,
        isPublic: initialData.isPublic ?? true,
        isPremiumRequired: initialData.isPremiumRequired ?? false,
        sourceAttribution: initialData.sourceAttribution || "",
      };
    }
    return {
      title: "",
      mediaType: "MOVIE",
      tmdbId: null,
      seasonNumber: null,
      episodeNumber: null,
      videoUrl: "",
      mimeType: "application/x-mpegURL",
      quality: "1080p",
      durationSeconds: null,
      isPublic: true,
      isPremiumRequired: false,
      sourceAttribution: "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isEditing && formData.id) {
        const res = await updatePlaybackAssetAction({
          id: formData.id,
          ...formData,
        });
        if (!res.success) {
          setErrorMessage(res.error || "Gagal memperbarui aset video.");
          setLoading(false);
          return;
        }
      } else {
        const res = await createPlaybackAssetAction(formData);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal mendaftarkan aset video.");
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: (typeof PRESET_LEGAL_STREAMS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      videoUrl: preset.url,
      mimeType: preset.mime,
      sourceAttribution: preset.attr,
      durationSeconds: preset.duration,
      title: prev.title || preset.name,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-[#141414] shadow-2xl p-6 sm:p-7 text-neutral-100 my-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E]">
              {formData.mediaType === "MOVIE" ? (
                <FilmStrip size={22} weight="fill" />
              ) : (
                <Television size={22} weight="fill" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? "Edit Aset Video Legal" : "Tambah Aset Video Legal Baru"}
              </h2>
              <p className="text-xs text-neutral-400">
                Hubungkan stream HLS atau MP4 legal dengan metadata katalog TMDB.
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

        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            <Warning size={18} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Presets */}
        {!isEditing && (
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D9A52E]">
              <Sparkle size={14} weight="fill" />
              <span>Gunakan Sampel Stream Legal (1-Klik):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_LEGAL_STREAMS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-[11px] font-medium text-neutral-300 hover:text-[#D9A52E] hover:border-[#D9A52E]/50 transition cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Judul & Tipe Media */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Judul Aset Video <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Tears of Steel — Official CC 3.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Tipe Media <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mediaType: "MOVIE" })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    formData.mediaType === "MOVIE"
                      ? "bg-[#D9A52E] text-neutral-950 shadow-sm"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <FilmStrip size={14} />
                  <span>Film</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mediaType: "TV" })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    formData.mediaType === "TV"
                      ? "bg-[#D9A52E] text-neutral-950 shadow-sm"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Television size={14} />
                  <span>Serial</span>
                </button>
              </div>
            </div>
          </div>

          {/* TMDB ID & TV Season/Episode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                TMDB ID <span className="text-neutral-500 font-normal">(Opsional)</span>
              </label>
              <input
                type="number"
                value={formData.tmdbId ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tmdbId: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                placeholder="Misal: 111111"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
              />
            </div>

            {formData.mediaType === "TV" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Nomor Season <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required={formData.mediaType === "TV"}
                    value={formData.seasonNumber ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seasonNumber: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Nomor Episode <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required={formData.mediaType === "TV"}
                    value={formData.episodeNumber ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        episodeNumber: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
                  />
                </div>
              </>
            )}
          </div>

          {/* Video URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              URL Video Sah (HLS .m3u8 atau MP4) <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.videoUrl}
              onChange={(e) => {
                const url = e.target.value;
                const mime = url.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4";
                setFormData({ ...formData, videoUrl: url, mimeType: mime });
              }}
              placeholder="https://domain-anda.com/video.m3u8 atau .mp4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white font-mono focus:outline-none focus:border-[#D9A52E] transition"
            />
          </div>

          {/* MIME Type, Kualitas & Durasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">MIME Type</label>
              <select
                value={formData.mimeType}
                onChange={(e) => setFormData({ ...formData, mimeType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D9A52E] transition"
              >
                <option value="application/x-mpegURL">HLS (.m3u8)</option>
                <option value="video/mp4">MP4 Video (.mp4)</option>
                <option value="video/webm">WebM Video (.webm)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Kualitas</label>
              <select
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-[#D9A52E] transition"
              >
                <option value="1080p">1080p Full HD</option>
                <option value="4K">4K Ultra HD</option>
                <option value="720p">720p HD</option>
                <option value="Adaptive">Adaptive Multi-Bitrate</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Durasi Detik <span className="text-neutral-500 font-normal">(Opsional)</span>
              </label>
              <input
                type="number"
                min={0}
                value={formData.durationSeconds ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationSeconds: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                placeholder="Misal: 7200"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
              />
            </div>
          </div>

          {/* Atribusi Sumber */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Atribusi Sumber / Lisensi Legal <span className="text-neutral-500 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={formData.sourceAttribution ?? ""}
              onChange={(e) => setFormData({ ...formData, sourceAttribution: e.target.value })}
              placeholder="Contoh: Blender Open Movie Project (Creative Commons CC BY 3.0)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#D9A52E] transition"
            />
          </div>

          {/* Checkboxes: isPublic & isPremiumRequired */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 cursor-pointer hover:border-neutral-700 transition">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mt-0.5 rounded border-neutral-700 text-[#D9A52E] focus:ring-[#D9A52E]"
              />
              <div>
                <span className="text-xs font-bold text-white block">Aset Publik (Aktif)</span>
                <span className="text-[11px] text-neutral-400 block">
                  Aset ini dapat diputar oleh pengguna di katalog LayarRika.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 cursor-pointer hover:border-neutral-700 transition">
              <input
                type="checkbox"
                checked={formData.isPremiumRequired}
                onChange={(e) =>
                  setFormData({ ...formData, isPremiumRequired: e.target.checked })
                }
                className="mt-0.5 rounded border-neutral-700 text-[#D9A52E] focus:ring-[#D9A52E]"
              />
              <div>
                <span className="text-xs font-bold text-[#D9A52E] block">
                  Wajib Premium VIP
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  Hanya pengguna dengan status VIP yang diizinkan memutar video ini.
                </span>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-xs font-bold uppercase tracking-wider hover:from-[#e5b33d] hover:to-[#c49226] transition disabled:opacity-50 shadow-md shadow-[#D9A52E]/10"
            >
              {loading ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} weight="bold" />
                  <span>{isEditing ? "Perbarui Aset" : "Simpan Aset"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssetFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AssetFormModalProps) {
  if (typeof document === "undefined" || !isOpen) return null;

  return createPortal(
    <AssetFormDialog
      key={initialData?.id || "new-asset"}
      initialData={initialData}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
    document.body
  );
}
