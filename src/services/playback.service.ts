import "server-only";

import { db } from "@/lib/db";
import { MediaType } from "@prisma/client";

export interface RegisterPlaybackAssetInput {
  title: string;
  mediaType: MediaType;
  tmdbId?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  videoUrl: string;
  mimeType?: string;
  quality?: string;
  durationSeconds?: number | null;
  isPublic?: boolean;
  isPremiumRequired?: boolean;
  sourceAttribution?: string | null;
}

/**
 * Mengambil aset video legal yang terdaftar berdasarkan TMDB ID dan jenis konten.
 */
export async function getPlaybackAssetForMedia(
  tmdbId: number,
  mediaType: MediaType,
  seasonNumber: number | null = null,
  episodeNumber: number | null = null
) {
  return db.playbackAsset.findFirst({
    where: {
      tmdbId,
      mediaType,
      seasonNumber: seasonNumber ?? undefined,
      episodeNumber: episodeNumber ?? undefined,
      isPublic: true,
    },
  });
}

/**
 * Mendaftarkan aset video sah baru ke dalam sistem (digunakan oleh admin/seed).
 */
export async function registerPlaybackAsset(data: RegisterPlaybackAssetInput) {
  if (!data.videoUrl || data.videoUrl.trim() === "") {
    throw new Error("URL video sah wajib disertakan");
  }

  return db.playbackAsset.create({
    data: {
      title: data.title,
      mediaType: data.mediaType,
      tmdbId: data.tmdbId,
      seasonNumber: data.seasonNumber,
      episodeNumber: data.episodeNumber,
      videoUrl: data.videoUrl,
      mimeType: data.mimeType || "application/x-mpegURL",
      quality: data.quality || "1080p",
      durationSeconds: data.durationSeconds,
      isPublic: data.isPublic ?? true,
      isPremiumRequired: data.isPremiumRequired ?? false,
      sourceAttribution: data.sourceAttribution,
    },
  });
}

/**
 * Mengambil detail aset video berdasarkan ID internal.
 */
export async function getPlaybackAssetById(id: string) {
  if (!id) return null;
  return db.playbackAsset.findUnique({
    where: { id },
  });
}
