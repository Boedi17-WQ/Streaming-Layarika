export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbPosterSize = "w185" | "w342" | "w500" | "w780" | "original";
export type TmdbBackdropSize = "w300" | "w780" | "w1280" | "original";
export type TmdbProfileSize = "w185" | "h632" | "original";
export type TmdbStillSize = "w185" | "w300" | "original";

/**
 * Merangkai URL poster TMDB yang valid dan aman.
 * Mengembalikan null jika path tidak tersedia.
 */
export function getTmdbPosterUrl(
  path: string | null | undefined,
  size: TmdbPosterSize = "w500"
): string | null {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return null;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Merangkai URL backdrop TMDB resolusi tinggi untuk Hero atau Background.
 * Mengembalikan null jika path tidak tersedia.
 */
export function getTmdbBackdropUrl(
  path: string | null | undefined,
  size: TmdbBackdropSize = "w1280"
): string | null {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return null;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Merangkai URL foto profil pemeran/cast TMDB.
 */
export function getTmdbProfileUrl(
  path: string | null | undefined,
  size: TmdbProfileSize = "w185"
): string | null {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return null;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Merangkai URL gambar cuplikan episode (still) TMDB.
 */
export function getTmdbStillUrl(
  path: string | null | undefined,
  size: TmdbStillSize = "w300"
): string | null {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return null;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}
