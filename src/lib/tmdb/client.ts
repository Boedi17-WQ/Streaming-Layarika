import "server-only";

import { TMDB_API_BASE_URL, TMDB_ENDPOINTS } from "./endpoints";
import {
  TmdbMovie,
  TmdbTvShow,
  TmdbMovieDetails,
  TmdbTvDetails,
  TmdbTvSeasonDetails,
  TmdbCreditsResponse,
  TmdbPaginatedResponse,
  TmdbMultiSearchResult,
  TmdbVideo,
  TmdbVideosResponse,
} from "./types";

/**
 * Mengambil token autentikasi TMDB dari environment variables server.
 * Mendukung TMDB_API_READ_ACCESS_TOKEN atau TMDB_ACCESS_TOKEN atau TMDB_API_KEY.
 */
function getTmdbToken(): string | null {
  const token =
    process.env.TMDB_API_READ_ACCESS_TOKEN ||
    process.env.TMDB_ACCESS_TOKEN ||
    process.env.TMDB_API_KEY;

  if (!token || token.trim() === "" || token.includes("your_tmdb_")) {
    return null;
  }
  return token.trim();
}

/**
 * Mengecek apakah kredensial API TMDB telah dikonfigurasi dengan benar di environment server.
 */
export function isTmdbConfigured(): boolean {
  return getTmdbToken() !== null;
}

/**
 * Klien fetch server-side terpusat untuk API TMDB.
 * Mendukung caching Next.js, timeout 8 detik, dan penanganan HTTP errors.
 */
async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidateSeconds: number = 3600
): Promise<T | null> {
  const token = getTmdbToken();
  if (!token) {
    return null;
  }

  const url = new URL(`${TMDB_API_BASE_URL}${path}`);

  // Default bahasa metadata bahasa Indonesia dengan fallback en-US bila diperlukan
  url.searchParams.set("language", "id-ID");

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.set(key, val);
    }
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // Jika token berupa Read Access Token (panjang / JWT), gunakan Bearer Auth
  if (token.length > 40 || token.startsWith("eyJ")) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Jika berupa API Key v3 standar pendek
    url.searchParams.set("api_key", token);
  }

  try {
    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(8000), // Timeout 8 detik
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      // Log error generik tanpa membocorkan token
      console.error(`[TMDB API Error] ${response.status} pada path ${path}`);
      return null;
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    // Tangani network error / timeout secara aman
    console.error(`[TMDB Network Failure] Gagal memanggil ${path}:`, error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

// -----------------------------------------------------------------------------
// Endpoint Katalog Film
// -----------------------------------------------------------------------------

export async function getPopularMovies(page = 1): Promise<TmdbMovie[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
    TMDB_ENDPOINTS.moviePopular,
    { page: String(page) }
  );
  return res?.results || [];
}

export async function getTopRatedMovies(page = 1): Promise<TmdbMovie[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
    TMDB_ENDPOINTS.movieTopRated,
    { page: String(page) }
  );
  return res?.results || [];
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbMovie[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
    TMDB_ENDPOINTS.movieNowPlaying,
    { page: String(page) }
  );
  return res?.results || [];
}

export async function getUpcomingMovies(page = 1): Promise<TmdbMovie[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
    TMDB_ENDPOINTS.movieUpcoming,
    { page: String(page) }
  );
  return res?.results || [];
}

export async function getMovieDetails(id: string | number): Promise<TmdbMovieDetails | null> {
  return tmdbFetch<TmdbMovieDetails>(TMDB_ENDPOINTS.movieDetails(id));
}

export async function getMovieCredits(id: string | number): Promise<TmdbCreditsResponse | null> {
  return tmdbFetch<TmdbCreditsResponse>(TMDB_ENDPOINTS.movieCredits(id));
}

export async function getMovieRecommendations(id: string | number): Promise<TmdbMovie[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbMovie>>(
    TMDB_ENDPOINTS.movieRecommendations(id)
  );
  return res?.results || [];
}

export async function getMovieVideos(id: string | number): Promise<TmdbVideo[]> {
  const res = await tmdbFetch<TmdbVideosResponse>(TMDB_ENDPOINTS.movieVideos(id));
  return res?.results || [];
}

// -----------------------------------------------------------------------------
// Endpoint Katalog Serial TV
// -----------------------------------------------------------------------------

export async function getPopularTvShows(page = 1): Promise<TmdbTvShow[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbTvShow>>(
    TMDB_ENDPOINTS.tvPopular,
    { page: String(page) }
  );
  return res?.results || [];
}

export async function getTopRatedTvShows(page = 1): Promise<TmdbTvShow[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbTvShow>>(
    TMDB_ENDPOINTS.tvTopRated,
    { page: String(page) }
  );
  return res?.results || [];
}

export async function getTvDetails(id: string | number): Promise<TmdbTvDetails | null> {
  return tmdbFetch<TmdbTvDetails>(TMDB_ENDPOINTS.tvDetails(id));
}

export async function getTvCredits(id: string | number): Promise<TmdbCreditsResponse | null> {
  return tmdbFetch<TmdbCreditsResponse>(TMDB_ENDPOINTS.tvCredits(id));
}

export async function getTvRecommendations(id: string | number): Promise<TmdbTvShow[]> {
  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbTvShow>>(
    TMDB_ENDPOINTS.tvRecommendations(id)
  );
  return res?.results || [];
}

export async function getTvVideos(id: string | number): Promise<TmdbVideo[]> {
  const res = await tmdbFetch<TmdbVideosResponse>(TMDB_ENDPOINTS.tvVideos(id));
  return res?.results || [];
}

export async function getTvSeasonDetails(
  id: string | number,
  seasonNumber: number
): Promise<TmdbTvSeasonDetails | null> {
  return tmdbFetch<TmdbTvSeasonDetails>(
    TMDB_ENDPOINTS.tvSeasonDetails(id, seasonNumber)
  );
}

// -----------------------------------------------------------------------------
// Endpoint Pencarian Multi (Film & Serial)
// -----------------------------------------------------------------------------

export async function searchMultiCatalog(
  query: string,
  page = 1
): Promise<{
  movies: TmdbMovie[];
  tvShows: TmdbTvShow[];
  totalResults: number;
  totalPages: number;
}> {
  if (!query || query.trim() === "") {
    return { movies: [], tvShows: [], totalResults: 0, totalPages: 0 };
  }

  const res = await tmdbFetch<TmdbPaginatedResponse<TmdbMultiSearchResult>>(
    TMDB_ENDPOINTS.searchMulti,
    { query: query.trim(), page: String(page) },
    600 // Caching 10 menit untuk pencarian
  );

  if (!res || !res.results) {
    return { movies: [], tvShows: [], totalResults: 0, totalPages: 0 };
  }

  const movies: TmdbMovie[] = [];
  const tvShows: TmdbTvShow[] = [];

  for (const item of res.results) {
    if (item.media_type === "movie" && item.title) {
      movies.push({
        id: item.id,
        title: item.title,
        overview: item.overview || "",
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        release_date: item.release_date || "",
        vote_average: item.vote_average || 0,
        vote_count: 0,
        popularity: item.popularity || 0,
        media_type: "movie",
      });
    } else if (item.media_type === "tv" && item.name) {
      tvShows.push({
        id: item.id,
        name: item.name,
        overview: item.overview || "",
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        first_air_date: item.first_air_date || "",
        vote_average: item.vote_average || 0,
        vote_count: 0,
        popularity: item.popularity || 0,
        media_type: "tv",
      });
    }
  }

  return {
    movies,
    tvShows,
    totalResults: res.total_results,
    totalPages: res.total_pages,
  };
}
