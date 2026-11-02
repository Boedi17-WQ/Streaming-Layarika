import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import {
  getTvDetails,
  getTvCredits,
  getTvRecommendations,
  getTvSeasonDetails,
  getTvVideos,
  getPopularTvShows,
  isTmdbConfigured,
} from "@/lib/tmdb/client";
import {
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
} from "@/lib/tmdb/images";
import { mapTmdbTvToMovie } from "@/lib/tmdb/mappers";
import { MOCK_SERIES } from "@/data/mockMovies";
import { auth } from "@/auth";
import { isItemInWatchlist } from "@/services/watchlist.service";
import { getUserSubscriptionStatus } from "@/services/subscription.service";
import { TvSeasonEpisodeBrowser } from "@/components/tv/TvSeasonEpisodeBrowser";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

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
      const backdropUrl = getTmdbBackdropUrl(tv.backdrop_path, "w1280");
      const posterUrl = getTmdbPosterUrl(tv.poster_path, "w500");
      const pageTitle = `${tv.name}${year} — LayarRika Serial`;
      const pageDescription = tv.overview || "Detail serial di katalog LayarRika.";

      return {
        title: pageTitle,
        description: pageDescription,
        openGraph: {
          title: pageTitle,
          description: pageDescription,
          type: "video.tv_show",
          images: backdropUrl
            ? [{ url: backdropUrl, width: 1280, height: 720, alt: tv.name }]
            : posterUrl
            ? [{ url: posterUrl, alt: tv.name }]
            : [],
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
  let top10Series: ReturnType<typeof mapTmdbTvToMovie>[] = [];
  let initialEpisodes: import("@/lib/tmdb/types").TmdbTvEpisode[] = [];
  let youtubeKey: string | null = null;

  if (hasTmdb) {
    const [tvData, creditsData, recsData, season1Data, videosData, popularTvData] = await Promise.all([
      getTvDetails(id),
      getTvCredits(id),
      getTvRecommendations(id),
      getTvSeasonDetails(id, 1),
      getTvVideos(id),
      getPopularTvShows(1),
    ]);

    if (!tvData) {
      notFound();
    }

    tv = tvData;
    credits = creditsData;
    recommendations = (recsData || []).map(mapTmdbTvToMovie);
    top10Series = (popularTvData || []).map(mapTmdbTvToMovie).slice(0, 10);
    initialEpisodes = season1Data?.episodes || [];

    // Trailer resmi serial TV
    const officialTrailer =
      (videosData || []).find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser") && v.official) ||
      (videosData || []).find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) ||
      (videosData || []).find((v) => v.site === "YouTube");
    youtubeKey = officialTrailer?.key || null;
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
    top10Series = MOCK_SERIES.slice(0, 10);
  }

  // Sinkronisasi status autentikasi & langganan pengguna
  await connection();
  const session = await auth();
  const userId =
    session?.user?.id ||
    (session?.user as { sub?: string } | undefined)?.sub ||
    null;
  const subStatus = userId ? await getUserSubscriptionStatus(userId) : null;
  const isInWatchlist = userId ? await isItemInWatchlist(userId, tv.id, "TV") : false;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F5] pb-24">
      {/* 1. Sub-nav Breadcrumb Ringkas */}
      <div className="border-b border-[#1C1C20] bg-[#0E0E12]/80 backdrop-blur-md sticky top-16 z-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs">
          <Link
            href="/catalog?type=tv"
            className="inline-flex items-center gap-1.5 text-[#8E8E93] hover:text-[#D9A52E] transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            <span>Katalog Serial</span>
          </Link>
          <div className="flex items-center gap-2 text-[#71717A] text-[11px] truncate max-w-[280px] sm:max-w-md">
            <span>Beranda</span>
            <span>/</span>
            <span>Serial</span>
            <span>/</span>
            <span className="text-[#E4E4E7] truncate font-medium">{tv.name}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Streaming View Sesuai Desain Minimalis Movie */}
      <TvSeasonEpisodeBrowser
        seriesId={tv.id}
        seriesName={tv.name}
        posterPath={tv.poster_path}
        backdropPath={tv.backdrop_path}
        overview={tv.overview}
        voteAverage={tv.vote_average}
        voteCount={tv.vote_count}
        firstAirDate={tv.first_air_date}
        originCountry={tv.origin_country || []}
        genres={tv.genres}
        seasons={tv.seasons || []}
        initialSeasonNumber={1}
        initialEpisodes={initialEpisodes}
        credits={credits}
        recommendations={recommendations}
        top10Series={top10Series}
        youtubeKey={youtubeKey}
        isAuthenticated={Boolean(userId)}
        isVipInitial={subStatus?.isVip || false}
        initialInWatchlist={isInWatchlist}
      />
    </div>
  );
}
