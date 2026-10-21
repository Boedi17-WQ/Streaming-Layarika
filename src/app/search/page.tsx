import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SearchInput } from "@/components/search/SearchInput";
import { MovieCard } from "@/components/home/MovieCard";
import { searchMultiCatalog, isTmdbConfigured } from "@/lib/tmdb/client";
import { mapTmdbMovieToMovie, mapTmdbTvToMovie } from "@/lib/tmdb/mappers";
import { MOCK_FEATURED_MOVIES, MOCK_SERIES } from "@/data/mockMovies";
import {
  MagnifyingGlass,
  FilmReel,
  Television,
  WarningCircle,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  if (q && q.trim()) {
    return {
      title: `Pencarian: "${q.trim()}" — LayarRika`,
      description: `Hasil pencarian katalog film dan serial untuk "${q.trim()}" di LayarRika.`,
    };
  }
  return {
    title: "Cari Film & Serial — LayarRika",
    description: "Cari ribuan judul film dan serial menarik di katalog LayarRika.",
  };
}

// -----------------------------------------------------------------------------
// Async Search Results Component (Suspense Boundary Child)
// -----------------------------------------------------------------------------
async function SearchResults({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const hasTmdb = isTmdbConfigured();

  let movies: ReturnType<typeof mapTmdbMovieToMovie>[] = [];
  let tvShows: ReturnType<typeof mapTmdbTvToMovie>[] = [];
  let totalCount = 0;

  if (query) {
    if (hasTmdb) {
      const result = await searchMultiCatalog(query);
      movies = result.movies.map(mapTmdbMovieToMovie);
      tvShows = result.tvShows.map(mapTmdbTvToMovie);
      totalCount = movies.length + tvShows.length;
    } else {
      // Mock search mode ketika TMDB belum terpasang
      const qLower = query.toLowerCase();
      movies = MOCK_FEATURED_MOVIES.filter(
        (m) =>
          m.title.toLowerCase().includes(qLower) ||
          m.genres.some((g) => g.toLowerCase().includes(qLower))
      );
      tvShows = MOCK_SERIES.filter(
        (s) =>
          s.title.toLowerCase().includes(qLower) ||
          s.genres.some((g) => g.toLowerCase().includes(qLower))
      );
      totalCount = movies.length + tvShows.length;
    }
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-2xl border border-dashed border-[#292929] bg-[#121212]/50 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171717] border border-[#292929] text-[#737373]">
          <MagnifyingGlass size={28} />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-bold text-[#F5F5F5]">
            Mulai Menjelajahi Katalog
          </h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            Ketikkan kata kunci seperti nama film, judul serial, atau pahlawan super favorit pada kolom pencarian di atas.
          </p>
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-2xl border border-[#292929] bg-[#171717] p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0A0A] border border-amber-500/30 text-amber-400">
          <WarningCircle size={28} />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-bold text-[#F5F5F5]">
            Tidak Ada Hasil untuk &ldquo;{query}&rdquo;
          </h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            Kami tidak menemukan judul film atau serial yang cocok dengan kata kunci tersebut. Coba gunakan ejaan yang berbeda atau cari kata kunci yang lebih umum.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Result Summary Bar */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-4 text-sm">
        <div className="text-[#A3A3A3]">
          Ditemukan <span className="font-bold text-[#D9A52E]">{totalCount}</span> hasil untuk kata kunci{" "}
          <span className="font-semibold text-[#F5F5F5]">&ldquo;{query}&rdquo;</span>
        </div>
        <div className="text-xs text-[#737373]">
          {movies.length} Film • {tvShows.length} Serial
        </div>
      </div>

      {/* Bagian Film Ditemukan */}
      {movies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FilmReel size={20} className="text-[#D9A52E]" />
            <h2 className="text-xl font-bold text-[#F5F5F5]">
              Film ({movies.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {movies.map((movie) => (
              <MovieCard key={`movie-${movie.id}`} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Bagian Serial Ditemukan */}
      {tvShows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Television size={20} className="text-[#D9A52E]" />
            <h2 className="text-xl font-bold text-[#F5F5F5]">
              Serial TV ({tvShows.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {tvShows.map((tv) => (
              <MovieCard key={`tv-${tv.id}`} movie={tv} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Loading Skeleton untuk Hasil Pencarian
// -----------------------------------------------------------------------------
function SearchResultsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-48 rounded bg-[#1F1F1F]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
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

// -----------------------------------------------------------------------------
// Main Search Page
// -----------------------------------------------------------------------------
export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Ambil query secara aman untuk inisialisasi input search bar
  const resolvedParams = await searchParams;
  const initialQuery = resolvedParams.q?.trim() || "";

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 sm:py-14 pb-24 text-[#F5F5F5]">
      <Container className="space-y-10">
        {/* Search Header & Input Bar (Selalu Render Cepat / Instan) */}
        <div className="max-w-2xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3 py-1 text-xs font-semibold text-[#D9A52E]">
            <Sparkle size={13} weight="fill" />
            <span>Pencarian Multi-Katalog</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F5]">
            Temukan Film & Serial Pilihanmu
          </h1>

          <p className="text-xs sm:text-sm text-[#A3A3A3]">
            Cari judul, genre, atau serial favoritmu di seluruh koleksi LayarRika.
          </p>

          <div className="pt-2">
            <SearchInput initialQuery={initialQuery} autoFocus={!initialQuery} />
          </div>
        </div>

        {/* Content Area yang dibungkus Suspense agar navigasi instan */}
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}
