import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { MovieCard } from "@/components/home/MovieCard";
import {
  getMovieDetails,
  getMovieCredits,
  getMovieRecommendations,
  getMovieVideos,
  getPopularMovies,
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
import { getUserSubscriptionStatus } from "@/services/subscription.service";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { AddToPlaylistButton } from "@/components/playlist/AddToPlaylistButton";
import { EmbeddedPlayer } from "@/components/player/EmbeddedPlayer";
import { MovieShareButton } from "@/components/movie/MovieShareButton";
import { MovieSynopsis } from "@/components/movie/MovieSynopsis";
import { VipPromoCard } from "@/components/subscription/VipPromoCard";
import {
  Star,
  ArrowLeft,
  Fire,
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
      const backdropUrl = getTmdbBackdropUrl(movie.backdrop_path, "w1280");
      const posterUrl = getTmdbPosterUrl(movie.poster_path, "w500");
      const pageTitle = `${movie.title}${year} — LayarRika`;
      const pageDescription = movie.overview || "Detail film di katalog LayarRika.";

      return {
        title: pageTitle,
        description: pageDescription,
        openGraph: {
          title: pageTitle,
          description: pageDescription,
          type: "video.movie",
          images: backdropUrl ? [{ url: backdropUrl, width: 1280, height: 720, alt: movie.title }] : posterUrl ? [{ url: posterUrl, alt: movie.title }] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: pageTitle,
          description: pageDescription,
          images: backdropUrl ? [backdropUrl] : posterUrl ? [posterUrl] : [],
        },
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
  const hasTmdb = isTmdbConfigured();

  let movie = null;
  let credits = null;
  let recommendations: ReturnType<typeof mapTmdbMovieToMovie>[] = [];
  let youtubeKey: string | null = null;
  let top10Movies: ReturnType<typeof mapTmdbMovieToMovie>[] = [];

  if (hasTmdb) {
    const [movieData, creditsData, recsData, videosData, popularData] = await Promise.all([
      getMovieDetails(id),
      getMovieCredits(id),
      getMovieRecommendations(id),
      getMovieVideos(id),
      getPopularMovies(1),
    ]);

    if (!movieData) {
      notFound();
    }

    movie = movieData;
    credits = creditsData;
    recommendations = (recsData || []).map(mapTmdbMovieToMovie);
    top10Movies = (popularData || []).map(mapTmdbMovieToMovie).slice(0, 10);

    // Cari trailer resmi dari TMDB (YouTube)
    const officialTrailer =
      (videosData || []).find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser") && v.official) ||
      (videosData || []).find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) ||
      (videosData || []).find((v) => v.site === "YouTube");
    youtubeKey = officialTrailer?.key || null;
  } else {
    // Mode fallback: cari di mock data
    const mockFound = MOCK_FEATURED_MOVIES.find((m) => m.id === id);
    if (!mockFound && id !== "hero-tears-of-steel") {
      notFound();
    }
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
    top10Movies = MOCK_FEATURED_MOVIES.slice(0, 10);
  }

  const releaseYear = movie.release_date
    ? movie.release_date.substring(0, 4)
    : "—";

  // Data Pemeran & Sutradara (Format Circular Avatar)
  const director = credits?.crew?.find(
    (c) => c.job === "Director" || c.department === "Directing"
  );

  const directorEntry = director
    ? [
        {
          id: director.id,
          name: director.name,
          role: "Sutradara",
          profileUrl: getTmdbProfileUrl(director.profile_path, "w185"),
        },
      ]
    : [];

  const castEntries = (credits?.cast || []).slice(0, 9).map((actor) => ({
    id: actor.id,
    name: actor.name,
    role: actor.character || "Pemeran",
    profileUrl: getTmdbProfileUrl(actor.profile_path, "w185"),
  }));

  const allCrewAndCast = [...directorEntry, ...castEntries];

  // Sinkronisasi status autentikasi & langganan pengguna
  await connection();
  const session = await auth();
  const userId =
    session?.user?.id ||
    (session?.user as { sub?: string } | undefined)?.sub ||
    null;
  const subStatus = userId ? await getUserSubscriptionStatus(userId) : null;
  const isVip = subStatus?.isVip || false;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F5] pb-24">
      {/* 1. Sub-nav Breadcrumb Ringkas */}
      <div className="border-b border-[#1C1C20] bg-[#0E0E12]/80 backdrop-blur-md sticky top-16 z-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs">
          <Link
            href="/catalog?type=movie"
            className="inline-flex items-center gap-1.5 text-[#8E8E93] hover:text-[#D9A52E] transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            <span>Katalog Film</span>
          </Link>
          <div className="flex items-center gap-2 text-[#71717A] text-[11px] truncate max-w-[280px] sm:max-w-md">
            <span>Beranda</span>
            <span>/</span>
            <span>Film</span>
            <span>/</span>
            <span className="text-[#E4E4E7] truncate font-medium">{movie.title}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Desain Minimalis Streaming) */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* =========================================================================
              KOLOM KIRI: Player, Action Bar, Info Judul, Pemeran, Rekomendasi (~75%)
              ========================================================================= */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            {/* A. Pemutar Streaming Langsung di Paling Atas */}
            <div className="w-full">
              <Suspense
                fallback={
                  <div className="relative aspect-video w-full rounded-2xl border border-[#222226] bg-[#050505] flex items-center justify-center animate-pulse">
                    <span className="text-xs text-[#71717A]">Memuat pemutar video...</span>
                  </div>
                }
              >
                <MoviePlayerSlot
                  tmdbId={movie.id}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  backdropPath={movie.backdrop_path}
                  youtubeKey={youtubeKey}
                />
              </Suspense>
            </div>

            {/* B. Action Bar di Bawah Player (Watch Later, Playlist, Share) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-3 border-b border-[#1E1E22]">
              <div className="flex flex-wrap items-center gap-2">
                <Suspense
                  fallback={
                    <div className="h-8 w-28 rounded-lg bg-[#18181B] animate-pulse" />
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

                <AddToPlaylistButton
                  tmdbId={movie.id}
                  mediaType="MOVIE"
                  title={movie.title}
                  posterPath={movie.poster_path}
                />

                <MovieShareButton title={movie.title} />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-[#D9A52E]/10 border border-[#D9A52E]/30 px-2.5 py-1 text-[11px] font-bold text-[#D9A52E]">
                  Multi-Server Full HD
                </span>
              </div>
            </div>

            {/* C. Detail Judul & Metadata */}
            <div className="space-y-3 pt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F4F4F5] tracking-tight">
                {movie.title}
              </h1>

              {/* Rating & Review Stat */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A1AA]">
                <div className="flex items-center gap-1.5 font-bold text-[#F4F4F5]">
                  <Star size={16} weight="fill" className="text-[#D9A52E]" />
                  <span>{movie.vote_average ? movie.vote_average.toFixed(1) : "8.5"}</span>
                  <span className="text-[#71717A] font-normal">
                    ({movie.vote_count ? `${movie.vote_count.toLocaleString()} ulasan` : "Skor TMDB"})
                  </span>
                </div>
                <span className="text-[#3F3F46]">•</span>
                <span className="text-[#D9A52E] font-medium">Beri Nilai</span>
              </div>

              {/* Badges Bar (TOP, Film Bioskop, Age, Year, Duration) */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-bold text-emerald-400">
                  TOP 1 Film Populer
                </span>
                <span className="rounded bg-[#D9A52E]/15 border border-[#D9A52E]/30 px-2 py-0.5 font-bold text-[#D9A52E]">
                  Film Bioskop
                </span>
                <span className="rounded bg-[#1C1C20] border border-[#27272A] px-2 py-0.5 font-semibold text-[#A1A1AA]">
                  13+
                </span>
                <span className="rounded bg-[#1C1C20] border border-[#27272A] px-2 py-0.5 font-semibold text-[#A1A1AA]">
                  {releaseYear}
                </span>
                {movie.runtime ? (
                  <span className="rounded bg-[#1C1C20] border border-[#27272A] px-2 py-0.5 font-semibold text-[#A1A1AA]">
                    {Math.floor(movie.runtime / 60)}j {movie.runtime % 60}m
                  </span>
                ) : null}
              </div>

              {/* Genre Pills */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-md border border-[#27272A] bg-[#141416] px-2.5 py-1 text-xs text-[#D4D4D8] font-medium"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Sinopsis Expandable */}
              <div className="pt-2">
                <MovieSynopsis overview={movie.overview} />
              </div>
            </div>

            {/* D. Pemeran & Kru (Format Circular Avatar Sesuai Referensi) */}
            {allCrewAndCast.length > 0 && (
              <div className="pt-6 border-t border-[#1E1E22] space-y-3">
                <h3 className="text-base font-bold text-[#F4F4F5]">
                  Pemeran & Kru
                </h3>
                <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scrollbar-none">
                  {allCrewAndCast.map((person) => (
                    <div
                      key={`${person.id}-${person.role}`}
                      className="flex flex-col items-center shrink-0 w-16 sm:w-20 text-center group"
                    >
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-full border-2 border-[#27272A] bg-[#141416] transition-transform duration-300 group-hover:scale-105 group-hover:border-[#D9A52E]">
                        {person.profileUrl ? (
                          <Image
                            src={person.profileUrl}
                            alt={person.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-sm text-[#71717A] bg-gradient-to-b from-[#1F1F24] to-[#121214]">
                            {person.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#F4F4F5] line-clamp-1 w-full group-hover:text-[#D9A52E] transition-colors">
                        {person.name}
                      </p>
                      <p className="text-[10px] text-[#71717A] line-clamp-1 w-full">
                        {person.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E. Rekomendasi Film Serupa (Recommended Section) */}
            {recommendations.length > 0 && (
              <div className="pt-6 border-t border-[#1E1E22] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#F4F4F5]">
                    Rekomendasi Serupa
                  </h3>
                  <Link
                    href="/catalog?type=movie"
                    className="text-xs font-semibold text-[#D9A52E] hover:underline"
                  >
                    Lihat Semua &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {recommendations.slice(0, 12).map((rec) => (
                    <MovieCard key={rec.id} movie={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              KOLOM KANAN: Sidebar VIP Banner & Top 10 Film Populer (~25%)
              ========================================================================= */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
            
            {/* 1. Banner VIP Member (Dinamis: Indikator Aktif jika sudah VIP, atau Tombol Aktifkan jika belum) */}
            <VipPromoCard isVip={isVip} />

            {/* 2. Top 10 Film Populer (Ranking List) */}
            <div className="rounded-2xl border border-[#1E1E22] bg-[#121215] p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1E1E22] pb-3">
                <Fire size={18} weight="fill" className="text-[#D9A52E]" />
                <h3 className="text-sm font-bold text-[#F4F4F5] uppercase tracking-wide">
                  Top 10 Film Populer
                </h3>
              </div>

              <div className="space-y-3">
                {top10Movies.map((m, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;

                  if (isTop1) {
                    return (
                      <Link
                        key={m.id}
                        href={`/movie/${m.id}`}
                        className="group flex gap-3 rounded-xl border border-[#D9A52E]/30 bg-[#1A1812]/50 p-2.5 transition hover:border-[#D9A52E] hover:bg-[#1A1812]"
                      >
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#0A0A0A]">
                          {m.posterPath ? (
                            <Image
                              src={m.posterPath}
                              alt={m.title}
                              fill
                              sizes="60px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#71717A]">
                              1
                            </div>
                          )}
                          <span className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-[#D9A52E] text-[11px] font-black text-[#0A0A0A]">
                            1
                          </span>
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-[#D9A52E] uppercase">
                            #1 Paling Populer
                          </span>
                          <h4 className="text-xs font-bold text-[#F4F4F5] line-clamp-1 group-hover:text-[#D9A52E] transition-colors">
                            {m.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#A1A1AA]">
                            <span className="flex items-center gap-1 text-[#D9A52E] font-bold">
                              <Star size={11} weight="fill" />
                              {m.rating ? m.rating.toFixed(1) : "—"}
                            </span>
                            <span>•</span>
                            <span>{m.releaseYear || "2026"}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={m.id}
                      href={`/movie/${m.id}`}
                      className="group flex items-center gap-3 py-1 text-xs transition hover:text-[#D9A52E]"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                          rank <= 3
                            ? "bg-[#D9A52E]/15 text-[#D9A52E] font-black"
                            : "text-[#71717A]"
                        }`}
                      >
                        {rank}
                      </span>
                      <span className="min-w-0 truncate text-[#D4D4D8] group-hover:text-[#D9A52E] transition-colors">
                        {m.title}
                      </span>
                      {m.rating && (
                        <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] text-[#71717A]">
                          <Star size={10} weight="fill" className="text-[#D9A52E]" />
                          {m.rating.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

async function MoviePlayerSlot({
  tmdbId,
  title,
  posterPath,
  backdropPath,
  youtubeKey,
}: {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  youtubeKey: string | null;
}) {
  await connection();
  const session = await auth();
  const userId =
    session?.user?.id ||
    (session?.user as { sub?: string } | undefined)?.sub ||
    null;
  const subStatus = userId ? await getUserSubscriptionStatus(userId) : null;

  return (
    <EmbeddedPlayer
      tmdbId={tmdbId}
      mediaType="MOVIE"
      title={title}
      posterPath={posterPath}
      backdropPath={backdropPath}
      youtubeKey={youtubeKey}
      isAuthenticated={Boolean(userId)}
      isVipInitial={subStatus?.isVip || false}
    />
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
