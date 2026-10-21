import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { MovieCard } from "@/components/home/MovieCard";
import {
  getTvDetails,
  getTvCredits,
  getTvRecommendations,
  isTmdbConfigured,
} from "@/lib/tmdb/client";
import {
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
  getTmdbProfileUrl,
} from "@/lib/tmdb/images";
import { mapTmdbTvToMovie } from "@/lib/tmdb/mappers";
import { MOCK_SERIES } from "@/data/mockMovies";
import { auth } from "@/auth";
import { isItemInWatchlist } from "@/services/watchlist.service";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import {
  Star,
  Television,
  CalendarBlank,
  ArrowLeft,
  Play,
  Users,
  ShieldCheck,
  Stack,
} from "@phosphor-icons/react/dist/ssr";

export const instant = false;

interface TvDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TvDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  if (isTmdbConfigured()) {
    const tv = await getTvDetails(id);
    if (tv) {
      const year = tv.first_air_date
        ? ` (${tv.first_air_date.substring(0, 4)})`
        : "";
      return {
        title: `${tv.name}${year} — LayarRika Serial`,
        description: tv.overview || "Detail serial di katalog LayarRika.",
      };
    }
  }

  return {
    title: "Detail Serial TV — LayarRika",
    description: "Informasi dan episode serial di LayarRika.",
  };
}

export default async function TvDetailPage({ params }: TvDetailPageProps) {
  const { id } = await params;
  const hasTmdb = isTmdbConfigured();

  let tv = null;
  let credits = null;
  let recommendations: ReturnType<typeof mapTmdbTvToMovie>[] = [];

  if (hasTmdb) {
    const [tvData, creditsData, recsData] = await Promise.all([
      getTvDetails(id),
      getTvCredits(id),
      getTvRecommendations(id),
    ]);

    if (!tvData) {
      notFound();
    }

    tv = tvData;
    credits = creditsData;
    recommendations = (recsData || []).map(mapTmdbTvToMovie);
  } else {
    // Mode fallback: cari di mock data
    const mockFound = MOCK_SERIES.find((s) => s.id === id);
    if (!mockFound && !id.startsWith("series-")) {
      notFound();
    }

    tv = {
      id: 888888,
      name: mockFound?.title || "Chronicles of Nusantara",
      original_name: mockFound?.originalTitle || "Chronicles of Nusantara",
      overview:
        mockFound?.overview ||
        "Serial demo lokal untuk pengujian tampilan episode dan musim di LayarRika.",
      poster_path: null,
      backdrop_path: null,
      first_air_date: `${mockFound?.releaseYear || 2024}-03-15`,
      vote_average: mockFound?.rating || 9.0,
      vote_count: 85,
      popularity: 88.0,
      number_of_seasons: mockFound?.totalSeasons || 2,
      number_of_episodes: 16,
      status: "Returning Series",
      tagline: "Sebuah perjalanan lintas masa dan samudra.",
      genres: (mockFound?.genres || ["Petualangan", "Misteri"]).map((name, i) => ({
        id: i + 1,
        name,
      })),
      seasons: [
        {
          id: 101,
          name: "Musim 1: Asal Usul",
          episode_count: 8,
          season_number: 1,
          overview: "Awal mula penemuan artefak kuno di palung samudra.",
          poster_path: null,
          air_date: "2024-03-15",
        },
        {
          id: 102,
          name: "Musim 2: Kebangkitan",
          episode_count: 8,
          season_number: 2,
          overview: "Pertarungan menjaga rahasia maritim nusantara.",
          poster_path: null,
          air_date: "2024-09-20",
        },
      ],
    };
    recommendations = MOCK_SERIES.filter((s) => s.id !== id);
  }

  const backdropUrl = getTmdbBackdropUrl(tv.backdrop_path, "w1280");
  const posterUrl = getTmdbPosterUrl(tv.poster_path, "w500");
  const releaseYear = tv.first_air_date
    ? tv.first_air_date.substring(0, 4)
    : "—";

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 text-[#F5F5F5]">
      {/* 1. Backdrop Header Sinematik */}
      <div className="relative min-h-[480px] w-full overflow-hidden border-b border-[#292929] bg-[#121212]">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={`Backdrop ${tv.name}`}
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

      {/* 2. Main Content Info */}
      <Container className="relative -mt-64 z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Kolom Kiri: Poster & Status */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-[#292929] bg-[#171717] shadow-2xl">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={`Poster ${tv.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#1C1C1C] to-[#0A0A0A]">
                    <Television size={56} className="text-[#D9A52E]/40 mb-3" />
                    <span className="text-sm font-bold text-[#F5F5F5]">{tv.name}</span>
                  </div>
                )}
              </div>

              {/* Status Pemutaran */}
              <div className="rounded-xl border border-[#292929] bg-[#171717] p-4 text-xs space-y-2 text-[#A3A3A3]">
                <div className="flex items-center gap-1.5 font-semibold text-[#D9A52E]">
                  <ShieldCheck size={16} />
                  <span>Status Episode Serial</span>
                </div>
                <p>
                  Metadata musim dan episode bersumber dari TMDB. Pemutar video full episode mandiri akan diimplementasikan pada <strong>Tahap 6</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Detail Serial */}
          <div className="md:col-span-8 lg:col-span-9 space-y-8">
            {/* Judul & Status */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#D9A52E]/15 px-2.5 py-0.5 text-xs font-bold text-[#D9A52E] border border-[#D9A52E]/30">
                  Serial TV
                </span>
                {tv.status && (
                  <span className="rounded bg-[#171717] px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3] border border-[#292929]">
                    {tv.status}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F5F5F5]">
                {tv.name}
              </h1>

              {tv.tagline && (
                <p className="text-sm sm:text-base italic text-[#D9A52E]">
                  &ldquo;{tv.tagline}&rdquo;
                </p>
              )}
            </div>

            {/* Quick Metrics Bar: Rating, Year, Seasons, Episodes */}
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[#292929] bg-[#171717]/60 p-4 backdrop-blur-sm text-sm">
              <div className="flex items-center gap-2">
                <Star size={20} weight="fill" className="text-[#D9A52E]" />
                <div>
                  <div className="font-extrabold text-[#F5F5F5]">
                    {tv.vote_average ? tv.vote_average.toFixed(1) : "—"} / 10
                  </div>
                  <div className="text-[10px] text-[#737373]">
                    {tv.vote_count ? `${tv.vote_count} ulasan` : "Skor TMDB"}
                  </div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-[#292929]" />

              <div className="flex items-center gap-2">
                <CalendarBlank size={20} className="text-[#A3A3A3]" />
                <div>
                  <div className="font-bold text-[#F5F5F5]">{releaseYear}</div>
                  <div className="text-[10px] text-[#737373]">Tayang Perdana</div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-[#292929]" />

              <div className="flex items-center gap-2">
                <Stack size={20} className="text-[#A3A3A3]" />
                <div>
                  <div className="font-bold text-[#F5F5F5]">
                    {tv.number_of_seasons || 1} Musim ({tv.number_of_episodes || "—"} Ep)
                  </div>
                  <div className="text-[10px] text-[#737373]">Total Konten</div>
                </div>
              </div>
            </div>

            {/* Genre Pills */}
            {tv.genres && tv.genres.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Genre
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tv.genres.map((g) => (
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

            {/* Sinopsis */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#D9A52E]" />
                Sinopsis Serial
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-[#A3A3A3]">
                {tv.overview || "Sinopsis belum tersedia untuk serial ini."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                title="Fitur pemutaran episode aktif di Tahap 6"
                className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-6 py-2.5 text-sm font-bold text-[#0A0A0A] shadow-md transition hover:bg-[#c49226]"
              >
                <Play size={18} weight="fill" />
                <span>Nonton Episode 1</span>
              </button>

              <Suspense
                fallback={
                  <div className="flex h-11 w-44 items-center justify-center rounded-xl border border-[#292929] bg-[#171717] animate-pulse" />
                }
              >
                <TvWatchlistSlot
                  tmdbId={tv.id}
                  title={tv.name}
                  posterPath={tv.poster_path}
                  rating={tv.vote_average}
                  releaseYear={releaseYear !== "—" ? parseInt(releaseYear, 10) : undefined}
                />
              </Suspense>
            </div>

            {/* Daftar Musim (Seasons List) */}
            {tv.seasons && tv.seasons.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#292929]">
                <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Stack size={20} className="text-[#D9A52E]" />
                  Daftar Musim ({tv.seasons.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tv.seasons.map((season) => (
                    <div
                      key={season.id}
                      className="flex items-center justify-between rounded-xl border border-[#292929] bg-[#171717] p-4 transition hover:border-[#D9A52E]/50"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[#F5F5F5]">
                          {season.name}
                        </h4>
                        <p className="text-xs text-[#737373]">
                          {season.episode_count} Episode • {season.air_date ? season.air_date.substring(0, 4) : "—"}
                        </p>
                      </div>
                      <span className="rounded bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-[#D9A52E] border border-[#292929]">
                        Musim {season.season_number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pemeran Utama (Credits) */}
            {credits && credits.cast && credits.cast.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#292929]">
                <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Users size={20} className="text-[#D9A52E]" />
                  Pemeran Serial
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

            {/* Rekomendasi Serial Serupa */}
            {recommendations.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-[#292929]">
                <h3 className="text-xl font-bold text-[#F5F5F5]">
                  Serial Terkait yang Direkomendasikan
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

async function TvWatchlistSlot({
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
    ? await isItemInWatchlist(session.user.id, tmdbId, "TV")
    : false;

  return (
    <WatchlistButton
      tmdbId={tmdbId}
      mediaType="TV"
      title={title}
      posterPath={posterPath}
      rating={rating}
      releaseYear={releaseYear}
      initialInWatchlist={isInWatchlist}
    />
  );
}
