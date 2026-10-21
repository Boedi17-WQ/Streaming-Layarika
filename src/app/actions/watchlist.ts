"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  addToWatchlist,
  removeFromWatchlist,
  isItemInWatchlist,
  deleteWatchlistById,
  AddWatchlistInput,
} from "@/services/watchlist.service";
import { z } from "zod";

const watchlistInputSchema = z.object({
  tmdbId: z.number().int().positive("ID TMDB harus bernilai positif"),
  mediaType: z.enum(["MOVIE", "TV"], { message: "Jenis media harus MOVIE atau TV" }),
  title: z.string().min(1, "Judul wajib disertakan"),
  posterPath: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
});

export interface WatchlistActionResult {
  success: boolean;
  inWatchlist?: boolean;
  unauthenticated?: boolean;
  message?: string;
  error?: string;
}

/**
 * Server Action untuk menambah atau menghapus konten dari watchlist (Toggle).
 * Memverifikasi sesi pengguna di sisi server dan mengeksekusi operasi database yang aman.
 */
export async function toggleWatchlistAction(
  rawInput: AddWatchlistInput
): Promise<WatchlistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Anda harus masuk terlebih dahulu untuk menyimpan watchlist.",
    };
  }

  const parsed = watchlistInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data input tidak valid",
    };
  }

  const { tmdbId, mediaType, title, posterPath, rating, releaseYear } = parsed.data;
  const userId = session.user.id;

  try {
    const currentlyInList = await isItemInWatchlist(userId, tmdbId, mediaType);

    if (currentlyInList) {
      await removeFromWatchlist(userId, tmdbId, mediaType);
      revalidatePath(`/movie/${tmdbId}`);
      revalidatePath(`/tv/${tmdbId}`);
      revalidatePath("/profile");
      revalidatePath("/");

      return {
        success: true,
        inWatchlist: false,
        message: `"${title}" berhasil dihapus dari Watchlist`,
      };
    } else {
      await addToWatchlist(userId, {
        tmdbId,
        mediaType,
        title,
        posterPath,
        rating,
        releaseYear,
      });

      revalidatePath(`/movie/${tmdbId}`);
      revalidatePath(`/tv/${tmdbId}`);
      revalidatePath("/profile");
      revalidatePath("/");

      return {
        success: true,
        inWatchlist: true,
        message: `"${title}" berhasil ditambahkan ke Watchlist`,
      };
    }
  } catch (error) {
    console.error("Gagal melakukan toggle watchlist:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui watchlist. Silakan coba kembali.",
    };
  }
}

/**
 * Server Action untuk menghapus item dari watchlist berdasarkan TMDB ID dan jenis media.
 */
export async function removeFromWatchlistAction(
  tmdbId: number,
  mediaType: "MOVIE" | "TV"
): Promise<WatchlistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  try {
    await removeFromWatchlist(session.user.id, tmdbId, mediaType);
    revalidatePath("/profile");
    revalidatePath(`/movie/${tmdbId}`);
    revalidatePath(`/tv/${tmdbId}`);

    return {
      success: true,
      inWatchlist: false,
      message: "Konten berhasil dihapus dari Watchlist",
    };
  } catch (error) {
    console.error("Gagal menghapus dari watchlist:", error);
    return {
      success: false,
      error: "Gagal menghapus konten dari watchlist.",
    };
  }
}

/**
 * Server Action untuk menghapus item watchlist berdasarkan ID entri database (dari halaman profil).
 */
export async function removeWatchlistByIdAction(id: string): Promise<WatchlistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  try {
    await deleteWatchlistById(session.user.id, id);
    revalidatePath("/profile");

    return {
      success: true,
      message: "Item berhasil dihapus dari koleksi",
    };
  } catch (error) {
    console.error("Gagal menghapus item watchlist:", error);
    return {
      success: false,
      error: "Gagal menghapus item dari koleksi.",
    };
  }
}
