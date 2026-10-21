import "server-only";

import { db } from "@/lib/db";
import { validateWatchProgress } from "@/lib/validations/progress";
import { MediaType } from "@prisma/client";

export interface SaveProgressPayload {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  progressSeconds: number;
  durationSeconds?: number | null;
  playbackAssetId?: string | null;
}

/**
 * Menyimpan atau memperbarui progres tontonan pengguna.
 * Seluruh input divalidasi terlebih dahulu secara server-side.
 */
export async function saveWatchProgress(userId: string, payload: SaveProgressPayload) {
  if (!userId) throw new Error("User ID wajib disertakan");

  // Validasi ketat aturan progres dan durasi
  const validation = validateWatchProgress(payload);
  if (!validation.success || !validation.data) {
    throw new Error(`Validasi gagal: ${validation.error}`);
  }

  const {
    tmdbId,
    mediaType,
    title,
    posterPath,
    seasonNumber = null,
    episodeNumber = null,
    progressSeconds,
    durationSeconds = null,
    playbackAssetId = null,
  } = validation.data;

  // Anggap tontonan selesai jika progres telah mencapai >= 90% total durasi
  const isCompleted =
    durationSeconds && durationSeconds > 0
      ? progressSeconds >= durationSeconds * 0.9
      : false;

  // Cari entri riwayat tontonan spesifik pengguna
  const existing = await db.watchHistory.findFirst({
    where: {
      userId,
      mediaType,
      tmdbId,
      seasonNumber: seasonNumber ?? null,
      episodeNumber: episodeNumber ?? null,
    },
  });

  if (existing) {
    return db.watchHistory.update({
      where: { id: existing.id },
      data: {
        title,
        posterPath,
        progressSeconds,
        durationSeconds,
        completed: isCompleted,
        playbackAssetId,
        lastWatchedAt: new Date(),
      },
    });
  }

  return db.watchHistory.create({
    data: {
      userId,
      tmdbId,
      mediaType,
      title,
      posterPath,
      seasonNumber: seasonNumber ?? null,
      episodeNumber: episodeNumber ?? null,
      progressSeconds,
      durationSeconds,
      completed: isCompleted,
      playbackAssetId,
    },
  });
}

/**
 * Mengambil seluruh riwayat tontonan pengguna terurut waktu tonton terakhir.
 */
export async function getUserWatchHistory(userId: string, limit = 50) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchHistory.findMany({
    where: { userId },
    orderBy: { lastWatchedAt: "desc" },
    take: limit,
  });
}

/**
 * Mengambil daftar tontonan yang belum selesai untuk fitur "Lanjutkan Menonton" (Resume Playback).
 */
export async function getResumePlaybackList(userId: string, limit = 10) {
  if (!userId) return [];

  return db.watchHistory.findMany({
    where: {
      userId,
      completed: false,
      progressSeconds: { gt: 0 },
    },
    orderBy: { lastWatchedAt: "desc" },
    take: limit,
  });
}

/**
 * Mengambil titik waktu progres terakhir pengguna untuk resume playback film atau serial tertentu.
 */
export async function getMediaProgress(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
  seasonNumber: number | null = null,
  episodeNumber: number | null = null
) {
  if (!userId) return null;

  return db.watchHistory.findFirst({
    where: {
      userId,
      tmdbId,
      mediaType,
      seasonNumber: seasonNumber ?? undefined,
      episodeNumber: episodeNumber ?? undefined,
    },
  });
}

/**
 * Menghapus satu item dari riwayat tontonan pengguna.
 */
export async function deleteWatchHistory(userId: string, historyId: string) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchHistory.deleteMany({
    where: {
      id: historyId,
      userId,
    },
  });
}

/**
 * Membersihkan seluruh riwayat tontonan milik pengguna.
 */
export async function clearUserWatchHistory(userId: string) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchHistory.deleteMany({
    where: { userId },
  });
}
