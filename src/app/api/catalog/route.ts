import { NextRequest, NextResponse } from "next/server";
import { getCatalogItems, isTmdbConfigured } from "@/lib/tmdb/client";
import { mapTmdbMovieToMovie, mapTmdbTvToMovie } from "@/lib/tmdb/mappers";
import { MOCK_FEATURED_MOVIES, MOCK_SERIES } from "@/data/mockMovies";
import { Movie } from "@/types/movie";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Validasi Jenis Media (type)
  const rawType = searchParams.get("type");
  const type: "all" | "movie" | "tv" =
    rawType === "movie" ? "movie" : rawType === "tv" ? "tv" : "all";

  // 2. Validasi Genre ID
  const rawGenre = searchParams.get("genre");
  let genreId: number | null = null;
  if (rawGenre) {
    const parsed = parseInt(rawGenre, 10);
    if (!isNaN(parsed) && parsed > 0) {
      genreId = parsed;
    }
  }

  // 3. Validasi Query Pencarian (q)
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim().slice(0, 100); // Batasi panjang maksimal 100 karakter

  // 4. Validasi Pengurutan (sort)
  const rawSort = searchParams.get("sort") || "popularity.desc";
  const validSortOptions = ["popularity.desc", "vote_average.desc", "primary_release_date.desc"];
  const sortBy = validSortOptions.includes(rawSort) ? rawSort : "popularity.desc";

  // 5. Validasi Halaman (page)
  const rawPage = searchParams.get("page") || "1";
  let page = parseInt(rawPage, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (page > 100) {
    page = 100;
  }

  try {
    // Jalur 1: Menggunakan TMDB API Resmi
    if (isTmdbConfigured()) {
      const data = await getCatalogItems({
        type,
        genreId,
        query,
        sortBy,
        page,
      });

      const movies: Movie[] = data.movies.map(mapTmdbMovieToMovie);
      const tvShows: Movie[] = data.tvShows.map(mapTmdbTvToMovie);

      // Gabungkan hasil untuk mode "all" dengan urutan bergantian atau rating tertinggi
      const allResults: Movie[] =
        type === "movie"
          ? movies
          : type === "tv"
          ? tvShows
          : [...movies, ...tvShows].sort((a, b) => b.rating - a.rating);

      return NextResponse.json({
        success: true,
        movies,
        tvShows,
        allResults,
        totalResults: data.totalResults,
        totalPages: data.totalPages,
        page,
        type,
        genreId,
        query,
      });
    }

    // Jalur 2: Fallback Mock Data ketika kunci TMDB belum terpasang
    let filteredMovies = MOCK_FEATURED_MOVIES;
    let filteredTv = MOCK_SERIES;

    if (query) {
      const qLower = query.toLowerCase();
      filteredMovies = filteredMovies.filter(
        (m) =>
          m.title.toLowerCase().includes(qLower) ||
          m.genres.some((g) => g.toLowerCase().includes(qLower))
      );
      filteredTv = filteredTv.filter(
        (s) =>
          s.title.toLowerCase().includes(qLower) ||
          s.genres.some((g) => g.toLowerCase().includes(qLower))
      );
    }

    if (type === "movie") {
      filteredTv = [];
    } else if (type === "tv") {
      filteredMovies = [];
    }

    const allResults = [...filteredMovies, ...filteredTv];

    return NextResponse.json({
      success: true,
      movies: filteredMovies,
      tvShows: filteredTv,
      allResults,
      totalResults: allResults.length,
      totalPages: 1,
      page: 1,
      type,
      genreId,
      query,
    });
  } catch (error) {
    console.error("[GET /api/catalog] Kesalahan saat memuat katalog:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memproses permintaan katalog.",
        movies: [],
        tvShows: [],
        allResults: [],
        totalResults: 0,
        totalPages: 0,
        page: 1,
      },
      { status: 500 }
    );
  }
}
