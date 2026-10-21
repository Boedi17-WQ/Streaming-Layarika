import "server-only";

import { db } from "@/lib/db";
import { MediaType } from "@prisma/client";

export interface AddWatchlistInput {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  rating?: number | null;
  releaseYear?: number | null;
}

/**
 * Mengambil seluruh daftar watchlist milik pengguna tertentu.
 * Data diisolasi ketat hanya untuk userId yang terautentikasi.
 */
export async function getUserWatchlist(userId: string) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Menambahkan film atau serial ke watchlist pengguna.
 * Menggunakan upsert untuk mencegah error jika entri duplikat diajukan.
 */
export async function addToWatchlist(userId: string, data: AddWatchlistInput) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchlist.upsert({
    where: {
      userId_mediaType_tmdbId: {
        userId,
        mediaType: data.mediaType,
        tmdbId: data.tmdbId,
      },
    },
    update: {
      title: data.title,
      posterPath: data.posterPath,
      rating: data.rating,
      releaseYear: data.releaseYear,
    },
    create: {
      userId,
      tmdbId: data.tmdbId,
      mediaType: data.mediaType,
      title: data.title,
      posterPath: data.posterPath,
      rating: data.rating,
      releaseYear: data.releaseYear,
    },
  });
}

/**
 * Menghapus konten dari watchlist pengguna.
 * Verifikasi kepemilikan userId dilakukan secara eksplisit.
 */
export async function removeFromWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: MediaType
) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchlist.deleteMany({
    where: {
      userId,
      tmdbId,
      mediaType,
    },
  });
}

/**
 * Mengecek apakah konten tertentu sudah tersimpan dalam watchlist pengguna.
 */
export async function isItemInWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: MediaType
): Promise<boolean> {
  if (!userId) return false;

  const count = await db.watchlist.count({
    where: {
      userId,
      tmdbId,
      mediaType,
    },
  });

  return count > 0;
}

/**
 * Menghapus item watchlist berdasarkan ID spesifik dengan verifikasi userId.
 */
export async function deleteWatchlistById(userId: string, id: string) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.watchlist.deleteMany({
    where: {
      id,
      userId,
    },
  });
}
