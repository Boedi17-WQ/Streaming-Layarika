import { NextRequest, NextResponse } from "next/server";
import { getMovieGenres, getTvGenres, isTmdbConfigured } from "@/lib/tmdb/client";
import { TmdbGenre } from "@/lib/tmdb/types";

// Fallback genres ketika TMDB belum terpasang
const FALLBACK_MOVIE_GENRES: TmdbGenre[] = [
  { id: 28, name: "Aksi" },
  { id: 12, name: "Petualangan" },
  { id: 16, name: "Animasi" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Kejahatan" },
  { id: 99, name: "Dokumenter" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Keluarga" },
  { id: 14, name: "Fantasi" },
  { id: 27, name: "Horor" },
  { id: 9648, name: "Misteri" },
  { id: 10749, name: "Romansa" },
  { id: 878, name: "Fiksi Ilmiah" },
  { id: 53, name: "Thriller" },
];

const FALLBACK_TV_GENRES: TmdbGenre[] = [
  { id: 10759, name: "Aksi & Petualangan" },
  { id: 16, name: "Animasi" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Kejahatan" },
  { id: 99, name: "Dokumenter" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Keluarga" },
  { id: 10762, name: "Anak-anak" },
  { id: 9648, name: "Misteri" },
  { id: 10765, name: "Sci-Fi & Fantasi" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawType = searchParams.get("type") || "movie";
  const type = rawType === "tv" ? "tv" : rawType === "all" ? "all" : "movie";

  try {
    if (!isTmdbConfigured()) {
      if (type === "tv") {
        return NextResponse.json({ success: true, genres: FALLBACK_TV_GENRES });
      }
      return NextResponse.json({ success: true, genres: FALLBACK_MOVIE_GENRES });
    }

    if (type === "tv") {
      const genres = await getTvGenres();
      return NextResponse.json(
        { success: true, genres: genres.length > 0 ? genres : FALLBACK_TV_GENRES },
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          },
        }
      );
    }

    if (type === "all") {
      // Mode Semua: Ambil genre universal yang tidak ambigu
      const [movieGenres, tvGenres] = await Promise.all([
        getMovieGenres(),
        getTvGenres(),
      ]);

      // Gabungkan genre yang nama atau ID-nya bersesuaian, utamakan nama yang bersih
      const genreMap = new Map<number, string>();
      movieGenres.forEach((g) => genreMap.set(g.id, g.name));
      tvGenres.forEach((g) => {
        if (!genreMap.has(g.id)) {
          genreMap.set(g.id, g.name);
        }
      });

      const combined = Array.from(genreMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      return NextResponse.json(
        { success: true, genres: combined.length > 0 ? combined : FALLBACK_MOVIE_GENRES },
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          },
        }
      );
    }

    // Default movie
    const genres = await getMovieGenres();
    return NextResponse.json(
      { success: true, genres: genres.length > 0 ? genres : FALLBACK_MOVIE_GENRES },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/genres] Gagal memuat genre:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil daftar genre dari TMDB.",
        genres: type === "tv" ? FALLBACK_TV_GENRES : FALLBACK_MOVIE_GENRES,
      },
      { status: 500 }
    );
  }
}
