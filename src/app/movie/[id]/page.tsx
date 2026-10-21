import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { MovieCard } from "@/components/home/MovieCard";
import {
  getMovieDetails,
  getMovieCredits,
  getMovieRecommendations,
  isTmdbConfigured,
} from "@/lib/tmdb/client";
import {
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
  getTmdbProfileUrl,
} from "@/lib/tmdb/images";
import { mapTmdbMovieToMovie } from "@/lib/tmdb/mappers";
import { MOCK_FEATURED_MOVIES } from "@/data/mockMovies";
import { auth } from "@/auth";
import { isItemInWatchlist } from "@/services/watchlist.service";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import {
  Star,
  Clock,
  CalendarBlank,
  FilmReel,
  ArrowLeft,
  Play,
  Users,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

export const instant = false;

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MovieDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  if (isTmdbConfigured()) {
    const movie = await getMovieDetails(id);
    if (movie) {
      const year = movie.release_date
        ? ` (${movie.release_date.substring(0, 4)})`
        : "";
      return {
        title: `${movie.title}${year} — LayarRika`,
        description: movie.overview || "Detail film di katalog LayarRika.",
      };
    }
  }

  return {
    title: "Detail Film — LayarRika",
    description: "Informasi dan sinopsis film di LayarRika.",
  };
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params;

  // Cek apakah TMDB aktif atau gunakan fallback data lokal
  const hasTmdb = isTmdbConfigured();

  let movie = null;
  let credits = null;
  let recommendations: ReturnType<typeof mapTmdbMovieToMovie>[] = [];

  if (hasTmdb) {
    const [movieData, creditsData, recsData] = await Promise.all([
      getMovieDetails(id),
      getMovieCredits(id),
      getMovieRecommendations(id),
    ]);

    if (!movieData) {
      notFound();
    }

    movie = movieData;
    credits = creditsData;
    recommendations = (recsData || []).map(mapTmdbMovieToMovie);
  } else {
    // Mode fallback: cari di mock data
    const mockFound = MOCK_FEATURED_MOVIES.find((m) => m.id === id);
    if (!mockFound && id !== "hero-tears-of-steel") {
      notFound();
    }
    // Bentuk mock movie details jika belum ada TMDB token
    movie = {
      id: 999999,
      title: mockFound?.title || "Tears of Steel",
      original_title: mockFound?.originalTitle || "Project Mango",
      overview:
        mockFound?.overview ||
        "Film demo lokal open-source berkualitas tinggi untuk pengujian arsitektur antarmuka LayarRika.",
      poster_path: null,
      backdrop_path: null,
      release_date: `${mockFound?.releaseYear || 2024}-01-01`,
      vote_average: mockFound?.rating || 8.5,
      vote_count: 120,
      popularity: 95.5,
      runtime: mockFound?.durationMinutes || 72,
      status: "Released",
      tagline: "Eksplorasi sinematik masa depan.",
      genres: (mockFound?.genres || ["Sci-Fi", "Aksi"]).map((name, i) => ({
        id: i + 1,
        name,
      })),
    };
    recommendations = MOCK_FEATURED_MOVIES.filter((m) => m.id !== id);
  }

  const backdropUrl = getTmdbBackdropUrl(movie.backdrop_path, "w1280");
  const posterUrl = getTmdbPosterUrl(movie.poster_path, "w500");
  const releaseYear = movie.release_date
    ? movie.release_date.substring(0, 4)
    : "—";

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 text-[#F5F5F5]">
      {/* 1. Backdrop Header Sinematik */}
      <div className="relative min-h-[480px] w-full overflow-hidden border-b border-[#292929] bg-[#121212]">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={`Backdrop ${movie.title}`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-30"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1c] to-[#0A0A0A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />

        {/* Back Link Button */}
        <Container className="relative pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#292929] bg-[#171717]/80 px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] backdrop-blur-md transition hover:border-[#D9A52E] hover:text-[#F5F5F5]"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Katalog</span>
          </Link>
        </Container>
      </div>

      {/* 2. Main Content Info (Overlapping Hero) */}
      <Container className="relative -mt-64 z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Kolom Kiri: Poster */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-[#292929] bg-[#171717] shadow-2xl">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={`Poster ${movie.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#1C1C1C] to-[#0A0A0A]">
                    <FilmReel size={56} className="text-[#D9A52E]/40 mb-3" />
                    <span className="text-sm font-bold text-[#F5F5F5]">{movie.title}</span>
                  </div>
                )}
              </div>

              {/* Status Pemutaran Transparan */}
              <div className="rounded-xl border border-[#292929] bg-[#171717] p-4 text-xs space-y-2 text-[#A3A3A3]">
                <div className="flex items-center gap-1.5 font-semibold text-[#D9A52E]">
                  <ShieldCheck size={16} />
                  <span>Status Hak Tonton</span>
                </div>
                <p>
                  Metadata film bersumber dari TMDB. Fitur pemutaran video legal & HLS mandiri akan aktif pada <strong>Tahap 6</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Detail Informasi */}
          <div className="md:col-span-8 lg:col-span-9 space-y-8">
            {/* Judul & Tagline */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#D9A52E]/15 px-2.5 py-0.5 text-xs font-bold text-[#D9A52E] border border-[#D9A52E]/30">
                  Film
                </span>
                {movie.status && (
                  <span className="rounded bg-[#171717] px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3] border border-[#292929]">
                    {movie.status}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F5F5F5]">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-sm sm:text-base italic text-[#D9A52E]">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}
            </div>

            {/* Quick Metrics Bar: Rating, Release, Runtime */}
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[#292929] bg-[#171717]/60 p-4 backdrop-blur-sm text-sm">
              <div className="flex items-center gap-2">
                <Star size={20} weight="fill" className="text-[#D9A52E]" />
                <div>
                  <div className="font-extrabold text-[#F5F5F5]">
                    {movie.vote_average ? movie.vote_average.toFixed(1) : "—"} / 10
                  </div>
                  <div className="text-[10px] text-[#737373]">
                    {movie.vote_count ? `${movie.vote_count} ulasan` : "Skor TMDB"}
                  </div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-[#292929]" />

              <div className="flex items-center gap-2">
                <CalendarBlank size={20} className="text-[#A3A3A3]" />
                <div>
                  <div className="font-bold text-[#F5F5F5]">{releaseYear}</div>
                  <div className="text-[10px] text-[#737373]">Tahun Rilis</div>
                </div>
              </div>

              {movie.runtime && (
                <>
                  <div className="h-8 w-[1px] bg-[#292929]" />
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-[#A3A3A3]" />
                    <div>
                      <div className="font-bold text-[#F5F5F5]">{movie.runtime} Menit</div>
                      <div className="text-[10px] text-[#737373]">Durasi</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Genre Pills */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Genre
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-lg border border-[#292929] bg-[#171717] px-3 py-1 text-xs font-medium text-[#F5F5F5]"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Overview / Sinopsis */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#D9A52E]" />
                Sinopsis
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-[#A3A3A3]">
                {movie.overview || "Sinopsis belum tersedia untuk judul ini."}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                title="Fitur pemutaran video aktif di Tahap 6"
                className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-6 py-2.5 text-sm font-bold text-[#0A0A0A] shadow-md transition hover:bg-[#c49226]"
              >
                <Play size={18} weight="fill" />
                <span>Mulai Nonton</span>
              </button>

              <Suspense
                fallback={
                  <div className="flex h-11 w-44 items-center justify-center rounded-xl border border-[#292929] bg-[#171717] animate-pulse" />
                }
              >
                <MovieWatchlistSlot
                  tmdbId={movie.id}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  rating={movie.vote_average}
                  releaseYear={releaseYear !== "—" ? parseInt(releaseYear, 10) : undefined}
                />
              </Suspense>
            </div>

            {/* Pemeran Utama (Credits) */}
            {credits && credits.cast && credits.cast.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#292929]">
                <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Users size={20} className="text-[#D9A52E]" />
                  Pemeran Utama
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {credits.cast.slice(0, 8).map((actor) => {
                    const profileUrl = getTmdbProfileUrl(actor.profile_path, "w185");
                    return (
                      <div
                        key={actor.id}
                        className="flex items-center gap-3 rounded-lg border border-[#292929] bg-[#171717] p-2.5"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#292929] bg-[#0A0A0A]">
                          {profileUrl ? (
                            <Image
                              src={profileUrl}
                              alt={actor.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#737373]">
                              {actor.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-xs font-semibold text-[#F5F5F5]">
                            {actor.name}
                          </p>
                          <p className="line-clamp-1 text-[11px] text-[#737373]">
                            {actor.character || "Pemeran"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rekomendasi Film Terkait */}
            {recommendations.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-[#292929]">
                <h3 className="text-xl font-bold text-[#F5F5F5]">
                  Rekomendasi Film Serupa
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recommendations.slice(0, 8).map((rec) => (
                    <MovieCard key={rec.id} movie={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

async function MovieWatchlistSlot({
  tmdbId,
  title,
  posterPath,
  rating,
  releaseYear,
}: {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  rating?: number | null;
  releaseYear?: number;
}) {
  await connection();
  const session = await auth();
  const isInWatchlist = session?.user?.id
    ? await isItemInWatchlist(session.user.id, tmdbId, "MOVIE")
    : false;

  return (
    <WatchlistButton
      tmdbId={tmdbId}
      mediaType="MOVIE"
      title={title}
      posterPath={posterPath}
      rating={rating}
      releaseYear={releaseYear}
      initialInWatchlist={isInWatchlist}
    />
  );
}
