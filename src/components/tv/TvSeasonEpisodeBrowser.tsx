"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Television,
  Spinner,
  LockKey,
  Crown,
  Fire,
} from "@phosphor-icons/react";
import {
  TmdbTvSeasonSummary,
  TmdbTvEpisode,
  TmdbCreditsResponse,
} from "@/lib/tmdb/types";
import { getTmdbProfileUrl } from "@/lib/tmdb/images";
import { EmbeddedPlayer } from "@/components/player/EmbeddedPlayer";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { AddToPlaylistButton } from "@/components/playlist/AddToPlaylistButton";
import { MovieShareButton } from "@/components/movie/MovieShareButton";
import { MovieSynopsis } from "@/components/movie/MovieSynopsis";
import { MovieCard } from "@/components/home/MovieCard";
import { VipPromoCard } from "@/components/subscription/VipPromoCard";
import { getSeasonEpisodesAction } from "@/app/actions/tv";
import {
  checkTvEpisodeAccessAction,
  getUserEntitlementAction,
} from "@/app/actions/subscription";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import {
  PremiumRequiredModal,
  PremiumGateReason,
} from "@/components/subscription/PremiumRequiredModal";
import { Movie } from "@/types/movie";

export interface TvSeasonEpisodeBrowserProps {
  seriesId: number;
  seriesName: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  voteAverage?: number;
  voteCount?: number;
  firstAirDate?: string;
  genres?: Array<{ id: number; name: string }>;
  seasons: TmdbTvSeasonSummary[];
  initialSeasonNumber: number;
  initialEpisodes: TmdbTvEpisode[];
  credits?: TmdbCreditsResponse | null;
  recommendations?: Movie[];
  top10Series?: Movie[];
  youtubeKey?: string | null;
  isAuthenticated?: boolean;
  isVipInitial?: boolean;
  initialInWatchlist?: boolean;
}

export function TvSeasonEpisodeBrowser({
  seriesId,
  seriesName,
  posterPath = null,
  backdropPath = null,
  overview = null,
  voteAverage = 8.5,
  voteCount = 0,
  firstAirDate,
  genres = [],
  seasons = [],
  initialSeasonNumber = 1,
  initialEpisodes = [],
  credits = null,
  recommendations = [],
  top10Series = [],
  youtubeKey = null,
  isAuthenticated = false,
  isVipInitial = false,
  initialInWatchlist = false,
}: TvSeasonEpisodeBrowserProps) {
  // Hanya tampilkan musim reguler (> 0) atau semua jika hanya ada 1 musim
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const seasonsToDisplay = validSeasons.length > 0 ? validSeasons : seasons;

  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(initialSeasonNumber);
  const [episodes, setEpisodes] = useState<TmdbTvEpisode[]>(initialEpisodes);
  const [isLoadingSeason, setIsLoadingSeason] = useState<boolean>(false);

  // Inisialisasi episode aktif dengan episode 1 (jika tersedia)
  const [activeEpisode, setActiveEpisode] = useState<TmdbTvEpisode | null>(
    initialEpisodes.length > 0 ? initialEpisodes[0] : null
  );

  // State Modal Autentikasi Wajib Login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [selectedEpisodeForLogin, setSelectedEpisodeForLogin] = useState<TmdbTvEpisode | null>(null);

  // State Modal Kuota Premium
  const [premiumModalState, setPremiumModalState] = useState<{
    isOpen: boolean;
    reason?: PremiumGateReason;
    usedEpisodes: number;
    episodeLimit: number;
    remainingEpisodes: number;
    message?: string;
  }>({
    isOpen: false,
    reason: "EPISODE_LIMIT_REACHED",
    usedEpisodes: 5,
    episodeLimit: 5,
    remainingEpisodes: 0,
  });

  // Sinkronkan status hak akses ketika jendela/tab kembali aktif (fokus)
  useEffect(() => {
    const handleFocus = async () => {
      if (activeEpisode) {
        try {
          const res = await checkTvEpisodeAccessAction({
            tmdbId: seriesId,
            seasonNumber: activeEpisode.season_number,
            episodeNumber: activeEpisode.episode_number,
          });
          if (res.allowed || res.reason !== "UNAUTHENTICATED") {
            setIsLoginModalOpen(false);
          }
        } catch {}
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [seriesId, activeEpisode]);

  const [liveVip, setLiveVip] = useState<boolean | null>(null);
  const isVip = liveVip !== null ? liveVip : isVipInitial;

  // Sinkronisasi status VIP pengguna secara live dari server
  useEffect(() => {
    let isMounted = true;

    const syncVipStatus = async () => {
      try {
        const ent = await getUserEntitlementAction();
        if (isMounted && ent && typeof ent.isVip === "boolean") {
          setLiveVip(ent.isVip);
        }
      } catch {}
    };

    syncVipStatus();

    window.addEventListener("focus", syncVipStatus);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncVipStatus);
    };
  }, []);

  // Memverifikasi izin tontonan episode ke server sebelum diputar
  const handleSelectEpisode = async (ep: TmdbTvEpisode) => {
    // Pengguna non-VIP dibatasi: Episode 6 dan seterusnya terkunci khusus VIP Member
    if (!isVip && ep.episode_number >= 6) {
      setPremiumModalState({
        isOpen: true,
        reason: "VIP_REQUIRED_FOR_EPISODE",
        usedEpisodes: 5,
        episodeLimit: 5,
        remainingEpisodes: 0,
        message: `Episode ${ep.episode_number} terkunci khusus untuk VIP Member. Buka akses tak terbatas ke seluruh episode serial ini dengan bergabung menjadi VIP LayarRika.`,
      });
      return;
    }

    try {
      const decision = await checkTvEpisodeAccessAction({
        tmdbId: seriesId,
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
      });

      if (decision.allowed) {
        setActiveEpisode(ep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (decision.reason === "UNAUTHENTICATED") {
          if (!isAuthenticated) {
            setSelectedEpisodeForLogin(ep);
            setIsLoginModalOpen(true);
          }
        } else if (decision.reason === "VIP_REQUIRED_FOR_EPISODE") {
          setPremiumModalState({
            isOpen: true,
            reason: "VIP_REQUIRED_FOR_EPISODE",
            usedEpisodes: 5,
            episodeLimit: 5,
            remainingEpisodes: 0,
            message: decision.message,
          });
        } else {
          setPremiumModalState({
            isOpen: true,
            reason: "EPISODE_LIMIT_REACHED",
            usedEpisodes: decision.usedEpisodes,
            episodeLimit: decision.episodeLimit || 5,
            remainingEpisodes: decision.remainingEpisodes || 0,
            message: decision.message,
          });
        }
      }
    } catch {
      setPremiumModalState({
        isOpen: true,
        reason: "EPISODE_LIMIT_REACHED",
        usedEpisodes: 5,
        episodeLimit: 5,
        remainingEpisodes: 0,
        message: "Terjadi kesalahan saat memverifikasi kuota tontonan Anda. Silakan coba kembali.",
      });
    }
  };

  const handleSelectSeason = async (seasonNum: number) => {
    if (seasonNum === activeSeasonNumber) return;

    setActiveSeasonNumber(seasonNum);
    setIsLoadingSeason(true);

    try {
      const res = await getSeasonEpisodesAction(seriesId, seasonNum);
      if (res.success && res.season?.episodes) {
        setEpisodes(res.season.episodes);
        if (res.season.episodes.length > 0) {
          setActiveEpisode(res.season.episodes[0]);
        }
      }
    } catch {
      console.warn("Gagal mengambil episode musim", seasonNum);
    } finally {
      setIsLoadingSeason(false);
    }
  };

  // Logika Next Episode
  const currentEpIndex = episodes.findIndex(
    (e) => e.episode_number === activeEpisode?.episode_number
  );
  const hasNextEpisode = currentEpIndex >= 0 && currentEpIndex < episodes.length - 1;

  const handleNextEpisode = () => {
    if (hasNextEpisode) {
      const nextEp = episodes[currentEpIndex + 1];
      handleSelectEpisode(nextEp);
    }
  };

  const releaseYear = firstAirDate ? firstAirDate.substring(0, 4) : "—";

  // Ambil Sutradara / Kreator dari Crew jika ada
  const directorOrCreator = credits?.crew?.find(
    (c) =>
      c.job === "Director" ||
      c.job === "Executive Producer" ||
      c.job === "Creator" ||
      c.department === "Directing"
  );

  // Format avatar bulat untuk kru utama & pemeran
  const allCrewAndCast = [
    ...(directorOrCreator
      ? [
          {
            id: directorOrCreator.id,
            name: directorOrCreator.name,
            role: "Kreator / Sutradara",
            profileUrl: getTmdbProfileUrl(directorOrCreator.profile_path, "w185"),
          },
        ]
      : []),
    ...(credits?.cast || []).slice(0, 7).map((actor) => ({
      id: actor.id,
      name: actor.name,
      role: actor.character || "Pemeran",
      profileUrl: getTmdbProfileUrl(actor.profile_path, "w185"),
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* =========================================================================
            KOLOM KIRI: Player, Action Bar, Info Serial, Pemeran, Rekomendasi (~75%)
            ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* A. Pemutar Streaming Langsung di Paling Atas */}
          <div className="w-full">
            <EmbeddedPlayer
              tmdbId={seriesId}
              mediaType="TV"
              title={seriesName}
              posterPath={posterPath}
              backdropPath={activeEpisode?.still_path || backdropPath || posterPath}
              seasonNumber={activeEpisode?.season_number || activeSeasonNumber}
              episodeNumber={activeEpisode?.episode_number || 1}
              episodeTitle={activeEpisode?.name}
              youtubeKey={youtubeKey}
              hasNextEpisode={hasNextEpisode}
              onNextEpisode={handleNextEpisode}
              isAuthenticated={isAuthenticated}
              isVipInitial={isVip}
            />
          </div>

          {/* B. Action Bar di Bawah Player (Watchlist, Playlist, Share) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-3 border-b border-[#1E1E22]">
            <div className="flex flex-wrap items-center gap-2">
              <WatchlistButton
                tmdbId={seriesId}
                mediaType="TV"
                title={seriesName}
                posterPath={posterPath}
                rating={voteAverage}
                releaseYear={releaseYear !== "—" ? parseInt(releaseYear, 10) : undefined}
                initialInWatchlist={initialInWatchlist}
              />

              <AddToPlaylistButton
                tmdbId={seriesId}
                mediaType="TV"
                title={seriesName}
                posterPath={posterPath}
              />

              <MovieShareButton title={seriesName} />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-[#D9A52E]/10 border border-[#D9A52E]/30 px-2.5 py-1 text-[11px] font-bold text-[#D9A52E]">
                Stream Multi-Server
              </span>
            </div>
          </div>

          {/* C. Detail Judul & Metadata Serial */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F4F4F5] tracking-tight">
                {seriesName}
              </h1>
              {activeEpisode && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D9A52E]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9A52E] animate-pulse" />
                  <span>
                    Sedang Memutar: Musim {activeEpisode.season_number} • Episode {activeEpisode.episode_number}{" "}
                    {activeEpisode.name ? `— ${activeEpisode.name}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Rating & Review Stat */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A1AA]">
              <div className="flex items-center gap-1.5 font-bold text-[#F4F4F5]">
                <Star size={16} weight="fill" className="text-[#D9A52E]" />
                <span>{voteAverage ? voteAverage.toFixed(1) : "8.5"}</span>
                <span className="text-[#71717A] font-normal">
                  ({voteCount ? `${voteCount.toLocaleString()} ulasan` : "Skor TMDB"})
                </span>
              </div>
              <span className="text-[#3F3F46]">•</span>
              <span className="text-[#D9A52E] font-medium">Beri Nilai</span>
            </div>

            {/* Badges Bar (TOP, Serial TV, Age, Year, Total Content) */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-bold text-emerald-400">
                TOP 1 Serial Populer
              </span>
              <span className="rounded bg-[#D9A52E]/15 border border-[#D9A52E]/30 px-2 py-0.5 font-bold text-[#D9A52E]">
                Serial TV
              </span>
              <span className="rounded bg-[#1C1C20] border border-[#27272A] px-2 py-0.5 font-semibold text-[#A1A1AA]">
                13+
              </span>
              <span className="rounded bg-[#1C1C20] border border-[#27272A] px-2 py-0.5 font-semibold text-[#A1A1AA]">
                {releaseYear}
              </span>
              <span className="rounded bg-[#1C1C20] border border-[#27272A] px-2 py-0.5 font-semibold text-[#A1A1AA]">
                Musim {activeSeasonNumber} • {episodes.length} Episode
              </span>
            </div>

            {/* Genre Pills */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {genres.map((g) => (
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
              <MovieSynopsis overview={overview} />
            </div>
          </div>

          {/* D. Pemeran & Kru (Format Circular Avatar Sesuai Desain Movie & Referensi) */}
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

          {/* E. Rekomendasi Serial Serupa (Recommended Section) */}
          {recommendations.length > 0 && (
            <div className="pt-6 border-t border-[#1E1E22] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F4F4F5]">
                  Rekomendasi Serupa
                </h3>
                <Link
                  href="/catalog?type=tv"
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
            KOLOM KANAN: Sidebar VIP Banner, Episode Selector, & Top 10 Serial (~25%)
            ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
          {/* 1. Banner VIP Member (Dinamis: Indikator Aktif jika sudah VIP, atau Tombol Aktifkan jika belum) */}
          <VipPromoCard isVip={isVip} />

          {/* 2. Episode Selector Widget (Desain Grid Angka Elegan Sesuai Gambar Referensi) */}
          <div className="rounded-2xl border border-[#1E1E22] bg-[#121215] p-4 space-y-3.5">
            {/* Header & Season Tabs */}
            <div className="space-y-2 border-b border-[#1E1E22] pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Television size={18} className="text-[#D9A52E]" weight="fill" />
                  <h3 className="text-sm font-bold text-[#F4F4F5] uppercase tracking-wide">
                    Pilih Episode
                  </h3>
                </div>
                <span className="text-[11px] text-[#71717A]">
                  {episodes.length} Episode
                </span>
              </div>

              {/* Horizontal Season Pills if multiple seasons */}
              {seasonsToDisplay.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                  {seasonsToDisplay.map((s) => {
                    const isSeasonActive = s.season_number === activeSeasonNumber;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSeason(s.season_number)}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          isSeasonActive
                            ? "bg-[#D9A52E] text-[#0A0A0A] shadow-sm shadow-[#D9A52E]/20 font-bold"
                            : "bg-[#18181C] text-[#A1A1AA] hover:bg-[#222228] hover:text-[#F4F4F5] border border-[#27272A]"
                        }`}
                      >
                        {s.name || `Musim ${s.season_number}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Episode Numbered Grid (1, 2, 3, 4, 5, 6, 7...) */}
            {isLoadingSeason ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl bg-[#0E0E12] border border-[#1E1E22]">
                <Spinner size={24} className="animate-spin text-[#D9A52E]" />
                <span className="mt-2 text-xs text-[#71717A]">Memuat episode...</span>
              </div>
            ) : episodes.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#71717A]">
                Belum ada episode di musim ini.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {episodes.map((ep) => {
                  const isPlaying =
                    activeEpisode?.episode_number === ep.episode_number &&
                    activeEpisode?.season_number === ep.season_number;
                  const isTvEpisodeVipOnly = ep.episode_number >= 6;
                  const isLocked = !isVip && isTvEpisodeVipOnly;

                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleSelectEpisode(ep)}
                      title={ep.name ? `Eps ${ep.episode_number}: ${ep.name}` : `Episode ${ep.episode_number}`}
                      className={`group relative flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all text-center cursor-pointer ${
                        isPlaying
                          ? "border border-[#D9A52E] bg-[#D9A52E] text-[#0A0A0A] font-black shadow-md shadow-[#D9A52E]/30 scale-105"
                          : isLocked
                          ? "border border-[#27272A] bg-[#141418] text-[#71717A] hover:border-[#D9A52E]/60 hover:text-[#D9A52E]"
                          : isTvEpisodeVipOnly && isVip
                          ? "border border-[#D9A52E]/30 bg-[#1A1812]/50 text-[#F5F5F5] hover:border-[#D9A52E]"
                          : "border border-[#27272A] bg-[#18181C] text-[#E4E4E7] hover:border-[#D9A52E]/50 hover:bg-[#202026]"
                      }`}
                    >
                      <span className="text-sm font-bold leading-none">
                        {ep.episode_number}
                      </span>
                      <span className="mt-1 text-[9px] uppercase tracking-wider font-semibold">
                        {isPlaying ? (
                          "Putar"
                        ) : isLocked ? (
                          <span className="flex items-center gap-0.5 text-[#D9A52E]">
                            <LockKey size={9} weight="fill" /> VIP
                          </span>
                        ) : isTvEpisodeVipOnly && isVip ? (
                          <span className="flex items-center gap-0.5 text-[#D9A52E] font-bold">
                            <Crown size={9} weight="fill" /> VIP
                          </span>
                        ) : (
                          "Free"
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Top 10 Serial Populer (Ranking List) */}
          {top10Series.length > 0 && (
            <div className="rounded-2xl border border-[#1E1E22] bg-[#121215] p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1E1E22] pb-3">
                <Fire size={18} weight="fill" className="text-[#D9A52E]" />
                <h3 className="text-sm font-bold text-[#F4F4F5] uppercase tracking-wide">
                  Top 10 Serial Populer
                </h3>
              </div>

              <div className="space-y-3">
                {top10Series.map((s, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;

                  if (isTop1) {
                    return (
                      <Link
                        key={s.id}
                        href={`/tv/${s.id}`}
                        className="group flex gap-3 rounded-xl border border-[#D9A52E]/30 bg-[#1A1812]/50 p-2.5 transition hover:border-[#D9A52E] hover:bg-[#1A1812]"
                      >
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#0A0A0A]">
                          {s.posterPath ? (
                            <Image
                              src={s.posterPath}
                              alt={s.title}
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
                            {s.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#A1A1AA]">
                            <span className="flex items-center gap-1 text-[#D9A52E] font-bold">
                              <Star size={11} weight="fill" />
                              {s.rating ? s.rating.toFixed(1) : "—"}
                            </span>
                            <span>•</span>
                            <span>{s.releaseYear || "2026"}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={s.id}
                      href={`/tv/${s.id}`}
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
                        {s.title}
                      </span>
                      {s.rating && (
                        <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] text-[#71717A]">
                          <Star size={10} weight="fill" className="text-[#D9A52E]" />
                          {s.rating.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Autentikasi Wajib Login */}
      <LoginRequiredModal
        isOpen={isLoginModalOpen && !isAuthenticated}
        onClose={() => setIsLoginModalOpen(false)}
        isAuthenticated={isAuthenticated}
        callbackUrl={`/tv/${seriesId}?season=${activeSeasonNumber}&episode=${selectedEpisodeForLogin?.episode_number || 1}`}
        mediaTitle={seriesName}
        mediaType="TV"
        seasonNumber={activeSeasonNumber}
        episodeNumber={selectedEpisodeForLogin?.episode_number || 1}
      />

      {/* Modal Paywall Kuota Premium */}
      <PremiumRequiredModal
        isOpen={premiumModalState.isOpen}
        onClose={() => setPremiumModalState((prev) => ({ ...prev, isOpen: false }))}
        reason={premiumModalState.reason}
        usedEpisodes={premiumModalState.usedEpisodes}
        episodeLimit={premiumModalState.episodeLimit}
        remainingEpisodes={premiumModalState.remainingEpisodes}
        customMessage={premiumModalState.message}
      />
    </div>
  );
}
