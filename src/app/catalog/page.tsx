import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  CatalogExplorer,
  CatalogMediaType,
} from "@/components/catalog/CatalogExplorer";
import {
  getMovieGenres,
  getTvGenres,
  getCatalogItems,
  isTmdbConfigured,
} from "@/lib/tmdb/client";
import { mapTmdbMovieToMovie, mapTmdbTvToMovie } from "@/lib/tmdb/mappers";
import { MOCK_FEATURED_MOVIES, MOCK_SERIES } from "@/data/mockMovies";
import { FilmReel, Television, Sparkle } from "@phosphor-icons/react/dist/ssr";

interface CatalogPageProps {
  searchParams: Promise<{
    type?: string;
    genre?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: CatalogPageProps): Promise<Metadata> {
  const { type, genre } = await searchParams;
  const mediaLabel =
    type === "movie" ? "Film" : type === "tv" ? "Serial TV" : "Film & Serial";

  if (genre) {
    return {
      title: `Katalog ${mediaLabel} Berdasarkan Genre — LayarRika`,
      description: `Eksplorasi ribuan judul ${mediaLabel} terlengkap berdasarkan genre resmi TMDB di LayarRika.`,
    };
  }

  return {
    title: `Katalog Lengkap ${mediaLabel} — LayarRika`,
    description: "Jelajahi seluruh koleksi sinema, serial televisi, dan mahakarya visual terbaik di LayarRika.",
  };
}

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

async function CatalogDataLoader({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;

  const rawType = resolvedParams.type;
  const initialType: CatalogMediaType =
    rawType === "movie" ? "movie" : rawType === "tv" ? "tv" : "all";

  // Fitur filter genre TMDB hanya aktif pada mode Katalog Umum (all), tidak digunakan pada page Series & Movies
  let initialGenreId: number | null = null;
  if (initialType === "all" && resolvedParams.genre) {
    const parsed = parseInt(resolvedParams.genre, 10);
    if (!isNaN(parsed) && parsed > 0) {
      initialGenreId = parsed;
    }
  }

  const rawSort = resolvedParams.sort || "popularity.desc";
  const validSorts = ["popularity.desc", "vote_average.desc", "primary_release_date.desc"];
  const initialSort = validSorts.includes(rawSort) ? rawSort : "popularity.desc";

  let initialPage = 1;
  if (resolvedParams.page) {
    const parsed = parseInt(resolvedParams.page, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      initialPage = parsed;
    }
  }

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
          sortBy: initialSort,
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
      console.error("[CatalogPage Server Fetch Error]", err);
    }
  } else {
    // Mode offline / mock data fallback: pisahkan movie vs tv show
    if (initialType === "movie") {
      initialTvShows = [];
      initialTotalResults = initialMovies.length;
    } else if (initialType === "tv") {
      initialMovies = [];
      initialTotalResults = initialTvShows.length;
    }
  }

  const isLockedType = initialType === "movie" || initialType === "tv";

  return (
    <CatalogExplorer
      key={`catalog-${initialType}-${initialGenreId ?? "all"}-${initialSort}-${initialPage}`}
      initialMovies={initialMovies}
      initialTvShows={initialTvShows}
      initialTotalResults={initialTotalResults}
      initialTotalPages={initialTotalPages}
      initialType={initialType}
      isLockedType={isLockedType}
      initialGenreId={initialGenreId}
      initialSort={initialSort}
      initialPage={initialPage}
      movieGenres={movieGenres}
      tvGenres={tvGenres}
    />
  );
}

export const instant = false;

async function CatalogHeader({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;
  const isMovie = resolvedParams.type === "movie";
  const isTv = resolvedParams.type === "tv";

  const badgeIcon = isMovie ? (
    <FilmReel size={13} weight="fill" />
  ) : isTv ? (
    <Television size={13} weight="fill" />
  ) : (
    <Sparkle size={13} weight="fill" />
  );

  const badgeText = isMovie
    ? "Galeri Movies & Bioskop Pilihan"
    : isTv
    ? "Koleksi TV Series & Serial Drama Lengkap"
    : "Eksplorasi Seluruh Katalog Sinema";

  const titleText = isMovie
    ? "Koleksi Movies Pilihan"
    : isTv
    ? "Serial TV & Drama Series"
    : "Katalog Lengkap Sinema & Serial";

  const descText = isMovie
    ? "Jelajahi ribuan judul film bioskop layar lebar terpopuler, film pemenang penghargaan, dan rilisan terbaru dunia sinema."
    : isTv
    ? "Streaming koleksi serial televisi terbaik, season lengkap, dan episode terbaru dari seluruh dunia tanpa jeda."
    : "Jelajahi seluruh film bioskop dan serial televisi, saring berdasarkan genre resmi, serta urutkan sesuai popularitas dan rating tertinggi.";

  return (
    <div className="max-w-2xl mx-auto space-y-3 text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3.5 py-1 text-xs font-semibold text-[#D9A52E]">
        {badgeIcon}
        <span>{badgeText}</span>
      </div>

      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F5]">
        {titleText}
      </h1>

      <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-lg mx-auto leading-relaxed">
        {descText}
      </p>
    </div>
  );
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 sm:py-14 pb-24 text-[#F5F5F5]">
      <Container className="space-y-10">
        {/* Header Eksplorasi Katalog Dinamis (Isolasi Suspense) */}
        <Suspense fallback={<CatalogHeaderSkeleton />}>
          <CatalogHeader searchParams={searchParams} />
        </Suspense>

        {/* Data Loader yang terisolasi dalam Suspense boundary */}
        <Suspense fallback={<CatalogExplorerSkeleton />}>
          <CatalogDataLoader searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

function CatalogHeaderSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-3 text-center animate-pulse">
      <div className="h-6 w-48 rounded-full bg-[#171717] mx-auto" />
      <div className="h-10 w-72 rounded-xl bg-[#171717] mx-auto" />
      <div className="h-4 w-96 rounded bg-[#141414] mx-auto" />
    </div>
  );
}

function CatalogExplorerSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
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
