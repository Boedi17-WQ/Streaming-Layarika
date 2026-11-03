import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  CatalogBrowser,
  CatalogMediaType,
} from "@/components/search/CatalogBrowser";
import {
  getMovieGenres,
  getTvGenres,
  getCatalogItems,
  isTmdbConfigured,
} from "@/lib/tmdb/client";
import { mapTmdbMovieToMovie, mapTmdbTvToMovie } from "@/lib/tmdb/mappers";
import { MOCK_FEATURED_MOVIES, MOCK_SERIES } from "@/data/mockMovies";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    genre?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q, type, genre } = await searchParams;
  const query = q?.trim();
  const mediaLabel =
    type === "movie" ? "Film" : type === "tv" ? "Serial TV" : "Film & Serial";

  if (query) {
    return {
      title: `Pencarian: "${query}" (${mediaLabel}) — LayarRika`,
      description: `Hasil pencarian katalog ${mediaLabel} untuk "${query}" di LayarRika.`,
    };
  }

  if (genre) {
    return {
      title: `Katalog ${mediaLabel} Berdasarkan Genre — LayarRika`,
      description: `Jelajahi koleksi ${mediaLabel} terlengkap berdasarkan filter genre pilihan Anda di LayarRika.`,
    };
  }

  return {
    title: "Katalog & Pencarian Film & Serial — LayarRika",
    description: "Cari dan jelajahi ribuan judul film dan serial menarik dengan filter genre dinamis di LayarRika.",
  };
}

// Fallback genres ketika TMDB belum terpasang atau offline
const DEFAULT_MOVIE_GENRES = [
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

const DEFAULT_TV_GENRES = [
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

async function SearchCatalogLoader({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const initialQuery = resolvedParams.q?.trim() || "";

  const rawType = resolvedParams.type;
  const initialType: CatalogMediaType =
    rawType === "movie" ? "movie" : rawType === "tv" ? "tv" : "all";

  let initialGenreId: number | null = null;
  if (resolvedParams.genre) {
    const parsed = parseInt(resolvedParams.genre, 10);
    if (!isNaN(parsed) && parsed > 0) {
      initialGenreId = parsed;
    }
  }

  let initialPage = 1;
  if (resolvedParams.page) {
    const parsed = parseInt(resolvedParams.page, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      initialPage = parsed;
    }
  }

  // Ambil genre dinamis dari TMDB API secara aman di server
  let movieGenres = DEFAULT_MOVIE_GENRES;
  let tvGenres = DEFAULT_TV_GENRES;

  const hasTmdb = isTmdbConfigured();

  let initialMovies = MOCK_FEATURED_MOVIES;
  let initialTvShows = MOCK_SERIES;
  let initialTotalResults = initialMovies.length + initialTvShows.length;
  let initialTotalPages = 1;

  if (hasTmdb) {
    try {
      const [fetchedMovieGenres, fetchedTvGenres, catalogData] = await Promise.all([
        getMovieGenres(),
        getTvGenres(),
        getCatalogItems({
          type: initialType,
          genreId: initialGenreId,
          query: initialQuery,
          page: initialPage,
        }),
      ]);

      if (fetchedMovieGenres.length > 0) {
        movieGenres = fetchedMovieGenres;
      }
      if (fetchedTvGenres.length > 0) {
        tvGenres = fetchedTvGenres;
      }

      initialMovies = catalogData.movies.map(mapTmdbMovieToMovie);
      initialTvShows = catalogData.tvShows.map(mapTmdbTvToMovie);
      initialTotalResults = catalogData.totalResults;
      initialTotalPages = catalogData.totalPages;
    } catch (err) {
      console.error("[SearchPage Server Fetch Error]", err);
    }
  }

  return (
    <CatalogBrowser
      key={`${initialQuery}-${initialType}-${initialGenreId ?? "all"}-${initialPage}`}
      initialMovies={initialMovies}
      initialTvShows={initialTvShows}
      initialTotalResults={initialTotalResults}
      initialTotalPages={initialTotalPages}
      initialQuery={initialQuery}
      initialType={initialType}
      initialGenreId={initialGenreId}
      initialPage={initialPage}
      movieGenres={movieGenres}
      tvGenres={tvGenres}
    />
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 sm:py-14 pb-24 text-[#F5F5F5]">
      <Container className="space-y-10">
        {/* Header Katalog Sinematik */}
        <div className="max-w-2xl mx-auto space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3 py-1 text-xs font-semibold text-[#D9A52E]">
            <Sparkle size={13} weight="fill" />
            <span>Katalog & Pencarian Real-Time</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F5]">
            Jelajahi Sinema & Serial Pilihanmu
          </h1>

          <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-lg mx-auto leading-relaxed">
            Temukan judul film dan serial TV favoritmu secara instan, saring berdasarkan genre resmi TMDB, atau cari kata kunci apapun.
          </p>
        </div>

        {/* Dynamic Data Loader dibungkus Suspense agar tidak men-suspend shell rute */}
        <Suspense fallback={<CatalogBrowserSkeleton />}>
          <SearchCatalogLoader searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

function CatalogBrowserSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-12 w-full max-w-3xl mx-auto rounded-2xl bg-[#171717]" />
      <div className="h-28 w-full rounded-2xl bg-[#141414]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col space-y-3 rounded-xl border border-[#292929] bg-[#171717] p-3"
          >
            <div className="aspect-[2/3] w-full rounded-lg bg-[#242424]" />
            <div className="h-4 w-3/4 rounded bg-[#242424]" />
            <div className="h-3 w-1/2 rounded bg-[#1F1F1F]" />
          </div>
        ))}
      </div>
    </div>
  );
}
