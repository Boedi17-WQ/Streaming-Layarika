"use server";

import { getTvSeasonDetails } from "@/lib/tmdb/client";
import { TmdbTvSeasonDetails } from "@/lib/tmdb/types";

export interface SeasonActionResult {
  success: boolean;
  season?: TmdbTvSeasonDetails | null;
  error?: string;
}

/**
 * Server Action untuk mengambil daftar episode dari musim serial TV tertentu secara on-demand.
 * Memvalidasi seriesId dan seasonNumber sebelum memanggil TMDB.
 */
export async function getSeasonEpisodesAction(
  seriesId: number,
  seasonNumber: number
): Promise<SeasonActionResult> {
  if (!seriesId || seriesId <= 0 || isNaN(seriesId)) {
    return { success: false, error: "ID serial TV tidak valid" };
  }

  if (seasonNumber < 0 || isNaN(seasonNumber)) {
    return { success: false, error: "Nomor musim tidak valid" };
  }

  try {
    const season = await getTvSeasonDetails(seriesId, seasonNumber);
    if (!season) {
      return { success: false, error: "Data musim tidak ditemukan" };
    }

    return {
      success: true,
      season,
    };
  } catch (err) {
    console.error(`Gagal memuat musim ${seasonNumber} untuk serial ${seriesId}:`, err);
    return {
      success: false,
      error: "Gagal memuat daftar episode dari TMDB.",
    };
  }
}
