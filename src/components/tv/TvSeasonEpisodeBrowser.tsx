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
  CaretRight,
  CaretDown,
  Info,
  X,
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
  originCountry?: string[];
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
  originCountry = [],
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

  // State untuk Redesign Tampilan Mobile Sesuai Referensi Gambar
  const [activeMobileTab, setActiveMobileTab] = useState<"foryou" | "detail" | "top10">("foryou");
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isAllEpisodesModalOpen, setIsAllEpisodesModalOpen] = useState<boolean>(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);
  const [showResourceHelp, setShowResourceHelp] = useState<boolean>(false);

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
          } else {
            // Auth mismatch: server menganggap unauthenticated padahal client sudah login
            // Paksa refresh sesi agar token sinkron
            console.warn("Auth mismatch detected, refreshing session...");
            window.location.reload();
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

  // Label negara asal untuk metadata serial
  const countryCode = originCountry && originCountry.length > 0 ? originCountry[0] : undefined;
  const countryLabel = (() => {
    if (!countryCode) return genres.length > 1 ? genres[1].name : null;
    const map: Record<string, string> = {
      KR: "Korea",
      US: "Amerika",
      ID: "Indonesia",
      JP: "Jepang",
      GB: "Inggris",
      TH: "Thailand",
      CN: "China",
      TW: "Taiwan",
      ES: "Spanyol",
      FR: "Prancis",
      IN: "India",
    };
    return map[countryCode.toUpperCase()] || countryCode;
  })();

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

  // Helper Widget: Episode Selector Grid (Digunakan di Mobile & Desktop Sidebar)
  const renderEpisodeSelector = () => (
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
  );

  // Helper Widget: Top 10 Serial Populer
  const renderTop10List = () => (
    top10Series.length > 0 ? (
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
                        unoptimized
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
    ) : null
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-0 sm:px-6 lg:px-8 pt-0 sm:pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* =========================================================================
            KOLOM KIRI: Player (Edge-to-Edge Mobile), Action Bar, Metadata, Pemeran,
            (DI MOBILE: VIP Card + Episode Selector + Top 10),
            Rekomendasi Serupa (~75%)
            ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-5">
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

          {/* =========================================================================
              TAMPILAN MOBILE (KHUSUS MOBILE SESUAI REFERENSI GAMBAR):
              Judul + Info >, Metadata Row, Pill Action Bar, Resources Section,
              Tabs (Untuk Anda - 3 Kolom Rekomendasi, Detail & Pemeran, Top 10)
              ========================================================================= */}
          <div className="block lg:hidden">
            {/* 1. Judul Serial & Tombol Info > */}
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-lg font-bold text-[#F4F4F5] tracking-tight line-clamp-2">
                  {seriesName}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="shrink-0 text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] flex items-center gap-0.5 cursor-pointer py-1 px-1 transition"
                >
                  <span>Info</span>
                  <CaretRight size={14} />
                </button>
              </div>

              {/* Sub-metadata baris tunggal: [TV] | ★ 6.9 | 2026 | Korea | Drama | 1 seasons */}
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#A1A1AA]">
                <span className="flex items-center gap-1 rounded bg-[#18181C] border border-[#27272A] px-1.5 py-0.5 text-[10px] font-bold text-[#E4E4E7]">
                  <Television size={11} className="text-[#D9A52E]" weight="fill" />
                  <span>TV</span>
                </span>
                <span className="text-[#3F3F46]">|</span>
                <div className="flex items-center gap-1 font-bold text-[#F4F4F5]">
                  <Star size={13} weight="fill" className="text-[#D9A52E]" />
                  <span>{voteAverage ? voteAverage.toFixed(1) : "8.5"}</span>
                </div>
                <span className="text-[#3F3F46]">|</span>
                <span>{releaseYear}</span>
                {countryLabel && (
                  <>
                    <span className="text-[#3F3F46]">|</span>
                    <span>{countryLabel}</span>
                  </>
                )}
                {genres && genres[0]?.name && (
                  <>
                    <span className="text-[#3F3F46]">|</span>
                    <span>{genres[0].name}</span>
                  </>
                )}
                <span className="text-[#3F3F46]">|</span>
                <span>{seasonsToDisplay.length} seasons</span>
              </div>
            </div>

            {/* 2. Baris Tombol Aksi (Pill Rounded) */}
            <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <WatchlistButton
                tmdbId={seriesId}
                mediaType="TV"
                title={seriesName}
                posterPath={posterPath}
                rating={voteAverage}
                releaseYear={releaseYear !== "—" ? parseInt(releaseYear, 10) : undefined}
                initialInWatchlist={initialInWatchlist}
                className="!rounded-full !px-3.5 !py-1.5 !text-xs !bg-[#141416] !border-[#27272A] text-white shrink-0 shadow-sm"
              />
              <MovieShareButton
                title={seriesName}
                className="!rounded-full !px-3.5 !py-1.5 !text-xs !bg-[#141416] !border-[#27272A] text-white shrink-0 shadow-sm"
              />
              <AddToPlaylistButton
                tmdbId={seriesId}
                mediaType="TV"
                title={seriesName}
                posterPath={posterPath}
                className="!rounded-full !px-3.5 !py-1.5 !text-xs !bg-[#141416] !border-[#27272A] text-white shrink-0 shadow-sm"
              />
              <Link
                href="/pricing"
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-[#D9A52E]/40 bg-[#D9A52E]/10 px-3.5 py-1.5 text-xs font-bold text-[#D9A52E] hover:bg-[#D9A52E]/20 transition shadow-sm"
              >
                <Crown size={14} weight="fill" />
                <span>{isVip ? "VIP Aktif" : "VIP Akses"}</span>
              </Link>
            </div>

            {/* 3. Section Resources: Dropdown Season & Row Episode [All] [01] [02] ... */}
            <div className="px-4 py-3 border-t border-[#1C1C20] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-bold text-white shrink-0">Resources</span>
                  <span className="text-xs text-[#71717A] truncate">
                    Uploaded by LayarRika Multi-Server
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowResourceHelp(!showResourceHelp)}
                    className="text-[#71717A] hover:text-white shrink-0 cursor-pointer"
                    aria-label="Info Sumber Video"
                  >
                    <Info size={14} />
                  </button>
                </div>
                <span className="text-xs text-[#71717A] font-mono shrink-0">
                  Eps {activeEpisode?.episode_number || 1}/{episodes.length}
                </span>
              </div>

              {showResourceHelp && (
                <div className="text-[11px] text-[#A1A1AA] bg-[#121215] border border-[#27272A] rounded-xl p-3 leading-relaxed space-y-1">
                  <p>
                    Streaming otomatis dialirkan dari server multi-sumber berkecepatan tinggi. Episode 1–5 gratis, episode 6 ke atas dapat diakses eksklusif oleh member VIP.
                  </p>
                  <p>
                    <Link href="/help" className="text-[#D9A52E] hover:underline font-semibold inline-flex items-center gap-1">
                      <span>Buka Pusat Bantuan & Panduan Lengkap</span>
                      <span>&rarr;</span>
                    </Link>
                  </p>
                </div>
              )}

              {/* Selector Season & Label Audio/Kualitas */}
              <div className="flex items-center gap-2">
                {seasonsToDisplay.length > 1 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#141416] px-3 py-1.5 text-xs font-semibold text-[#E4E4E7] hover:border-[#D9A52E] transition cursor-pointer"
                    >
                      <span>
                        {seasonsToDisplay.find((s) => s.season_number === activeSeasonNumber)?.name ||
                          `Musim ${activeSeasonNumber}`}
                      </span>
                      <CaretDown size={12} weight="bold" />
                    </button>
                    {isSeasonDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-[#27272A] bg-[#141418] py-1.5 shadow-2xl backdrop-blur-md">
                        {seasonsToDisplay.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              handleSelectSeason(s.season_number);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                              s.season_number === activeSeasonNumber
                                ? "text-[#D9A52E] bg-[#D9A52E]/10 font-bold"
                                : "text-[#D4D4D8] hover:bg-[#1E1E24]"
                            }`}
                          >
                            {s.name || `Musim ${s.season_number}`} ({s.episode_count} Eps)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#27272A] bg-[#141416] px-3 py-1 text-xs font-semibold text-[#A1A1AA]">
                    <span>{seasonsToDisplay[0]?.name || "Musim 1"}</span>
                  </div>
                )}

                <div className="rounded-lg border border-[#27272A] bg-[#141416] px-2.5 py-1 text-[11px] font-medium text-[#A1A1AA]">
                  Original Audio • HD
                </div>
              </div>

              {/* Baris Episode Horizontal Single-Line: [All] [01] [02] [03] ... */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsAllEpisodesModalOpen(true)}
                  className="shrink-0 rounded-lg border border-[#27272A] bg-[#18181C] px-3.5 h-10 flex items-center justify-center text-xs font-bold text-[#E4E4E7] hover:text-white hover:border-[#D9A52E] transition cursor-pointer"
                >
                  All
                </button>
                {episodes.map((ep) => {
                  const isPlaying =
                    activeEpisode?.episode_number === ep.episode_number &&
                    activeEpisode?.season_number === ep.season_number;
                  const isTvEpisodeVipOnly = ep.episode_number >= 6;
                  const isLocked = !isVip && isTvEpisodeVipOnly;
                  const epNumStr = String(ep.episode_number).padStart(2, "0");

                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleSelectEpisode(ep)}
                      className={`group relative shrink-0 rounded-lg w-12 h-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isPlaying
                          ? "border border-emerald-500 bg-emerald-950/70 text-emerald-400 font-black shadow-md shadow-emerald-500/20"
                          : isLocked
                          ? "border border-[#27272A] bg-[#121215] text-[#71717A] hover:border-[#D9A52E]/50 hover:text-[#D9A52E]"
                          : "border border-[#27272A] bg-[#18181C] text-[#E4E4E7] hover:border-[#D9A52E]/40 font-bold"
                      }`}
                    >
                      <span className="text-sm font-bold leading-none">
                        {epNumStr}
                      </span>
                      {isLocked ? (
                        <span className="mt-0.5 text-[8px] font-bold text-[#D9A52E] flex items-center gap-0.5">
                          <LockKey size={8} weight="fill" /> VIP
                        </span>
                      ) : isTvEpisodeVipOnly && isVip ? (
                        <span className="mt-0.5 text-[8px] font-bold text-[#D9A52E]">
                          VIP
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Tabs: Untuk Anda (For you) | Detail & Pemeran | Top 10 */}
            <div className="mt-1 border-t border-[#1C1C20]">
              <div className="px-4 flex items-center gap-6 border-b border-[#1C1C20]">
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("foryou")}
                  className={`py-3 text-sm font-bold relative transition cursor-pointer ${
                    activeMobileTab === "foryou"
                      ? "text-[#F4F4F5]"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  <span>Untuk Anda</span>
                  {activeMobileTab === "foryou" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A52E] rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMobileTab("detail")}
                  className={`py-3 text-sm font-bold relative transition cursor-pointer flex items-center gap-1.5 ${
                    activeMobileTab === "detail"
                      ? "text-[#F4F4F5]"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  <span>Detail & Pemeran</span>
                  {activeMobileTab === "detail" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A52E] rounded-full" />
                  )}
                </button>

                {top10Series.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab("top10")}
                    className={`py-3 text-sm font-bold relative transition cursor-pointer flex items-center gap-1.5 ${
                      activeMobileTab === "top10"
                        ? "text-[#F4F4F5]"
                        : "text-[#71717A] hover:text-[#A1A1AA]"
                    }`}
                  >
                    <span>Top 10</span>
                    {activeMobileTab === "top10" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A52E] rounded-full" />
                    )}
                  </button>
                )}
              </div>

              {/* Tab Content 1: Untuk Anda (3 Kolom Grid Sesuai Referensi Gambar) */}
              {activeMobileTab === "foryou" && (
                <div className="p-4 space-y-4">
                  {recommendations.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                      {recommendations.slice(0, 18).map((rec) => (
                        <MovieCard key={rec.id} movie={rec} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#71717A]">
                      Belum ada rekomendasi serial serupa saat ini.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 2: Detail & Pemeran */}
              {activeMobileTab === "detail" && (
                <div className="p-4 space-y-5">
                  <VipPromoCard isVip={isVip} />

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                      Sinopsis
                    </h4>
                    <MovieSynopsis overview={overview} />
                  </div>

                  {genres && genres.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                        Kategori Genre
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {genres.map((g) => (
                          <span
                            key={g.id}
                            className="rounded-md border border-[#27272A] bg-[#141416] px-2.5 py-1 text-xs text-[#D4D4D8] font-medium"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {allCrewAndCast.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#1C1C20]">
                      <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                        Pemeran & Kru
                      </h4>
                      <div className="flex items-start gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none">
                        {allCrewAndCast.map((person) => (
                          <div
                            key={`${person.id}-${person.role}`}
                            className="flex flex-col items-center shrink-0 w-16 text-center"
                          >
                            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#27272A] bg-[#141416]">
                              {person.profileUrl ? (
                                <Image
                                  src={person.profileUrl}
                                  alt={person.name}
                                  fill
                                  unoptimized
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-bold text-sm text-[#71717A]">
                                  {person.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <p className="mt-1.5 text-[11px] font-semibold text-[#F4F4F5] line-clamp-1 w-full">
                              {person.name}
                            </p>
                            <p className="text-[9px] text-[#71717A] line-clamp-1 w-full">
                              {person.role}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 3: Top 10 Serial Populer */}
              {activeMobileTab === "top10" && (
                <div className="p-4">
                  {renderTop10List()}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              TAMPILAN DESKTOP (WIDESCREEN STANDAR LAYAR LEBAR TETAP LENGKAP & ELEGAN):
              ========================================================================= */}
          <div className="hidden lg:block px-4 sm:px-0 space-y-5">
            {/* Action Bar di Bawah Player (Watchlist, Playlist, Share) */}
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

            {/* Detail Judul & Metadata Serial Desktop */}
            <div className="space-y-2.5 pt-1">
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#F4F4F5] tracking-tight">
                    {seriesName}
                  </h1>
                  {activeEpisode && (
                    <span className="text-sm sm:text-xl font-bold text-[#D9A52E] inline-flex items-center gap-1">
                      <span className="text-[#71717A]">›</span> Episode {activeEpisode.episode_number}
                    </span>
                  )}
                </div>
                {activeEpisode?.name && (
                  <p className="text-xs text-[#A1A1AA]">
                    {activeEpisode.name}
                  </p>
                )}
              </div>

              {/* Rating & Review Stat */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A1AA]">
                <div className="flex items-center gap-1.5 font-bold text-[#F4F4F5]">
                  <Star size={16} weight="fill" className="text-[#D9A52E]" />
                  <span className="text-[#D9A52E] font-bold">{voteAverage ? voteAverage.toFixed(1) : "8.5"}</span>
                  <span className="text-[#71717A] font-normal" suppressHydrationWarning>
                    ({voteCount ? `${voteCount.toLocaleString("id-ID")} ulasan` : "Skor TMDB"})
                  </span>
                </div>
                <span className="text-[#3F3F46]">•</span>
                <span className="text-[#D9A52E] font-medium">Beri Nilai</span>
              </div>

              {/* Badges Bar (TOP, Serial TV, Age, Year) */}
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
              </div>

              {/* Status Total Episode */}
              <div className="text-xs text-[#A1A1AA]">
                Musim {activeSeasonNumber} • Total {episodes.length} Episode
              </div>

              {/* Genre Pills */}
              {genres && genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
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
              <div className="pt-1">
                <MovieSynopsis overview={overview} />
              </div>
            </div>

            {/* Pemeran & Kru Desktop */}
            {allCrewAndCast.length > 0 && (
              <div className="pt-5 border-t border-[#1E1E22] space-y-3">
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
                            unoptimized
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

            {/* Rekomendasi Serial Serupa Desktop */}
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
        </div>

        {/* =========================================================================
            KOLOM KANAN: Sidebar VIP Banner, Episode Selector, & Top 10 Serial (DESKTOP ONLY ~25%)
            ========================================================================= */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
          <VipPromoCard isVip={isVip} />
          {renderEpisodeSelector()}
          {renderTop10List()}
        </div>
      </div>

      {/* Modal Info Detail Serial (Mobile) */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-neutral-800 bg-[#121215] p-5 sm:p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white line-clamp-1">
                {seriesName}
              </h3>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1 font-bold text-[#D9A52E]">
                <Star size={14} weight="fill" />
                <span>{voteAverage ? voteAverage.toFixed(1) : "8.5"}</span>
              </span>
              <span>•</span>
              <span>{releaseYear}</span>
              <span>•</span>
              <span>{seasonsToDisplay.length} Musim</span>
              <span>•</span>
              <span>{episodes.length} Episode</span>
            </div>

            {/* Sinopsis */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Sinopsis
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {overview || "Belum ada ringkasan sinopsis resmi untuk serial ini."}
              </p>
            </div>

            {/* Genre */}
            {genres && genres.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Kategori Genre
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pemeran Singkat */}
            {allCrewAndCast.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Pemeran & Sutradara
                </h4>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {allCrewAndCast.slice(0, 6).map((p) => (
                    <div key={`${p.id}-${p.role}`} className="shrink-0 text-center w-14">
                      <div className="relative h-12 w-12 mx-auto overflow-hidden rounded-full border border-neutral-700 bg-neutral-800">
                        {p.profileUrl ? (
                          <Image src={p.profileUrl} alt={p.name} fill unoptimized sizes="48px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                            {p.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-neutral-200 line-clamp-1">
                        {p.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Semua Episode (Mobile saat klik 'All') */}
      {isAllEpisodesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-neutral-800 bg-[#121215] p-5 sm:p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Semua Episode Musim {activeSeasonNumber}
                </h3>
                <p className="text-xs text-neutral-400">
                  Total {episodes.length} Episode
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllEpisodesModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
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
                    onClick={() => {
                      handleSelectEpisode(ep);
                      setIsAllEpisodesModalOpen(false);
                    }}
                    className={`group relative flex flex-col items-center justify-center rounded-xl py-2.5 px-1 transition-all text-center cursor-pointer ${
                      isPlaying
                        ? "border border-emerald-500 bg-emerald-950/70 text-emerald-400 font-black shadow-md shadow-emerald-500/30 scale-105"
                        : isLocked
                        ? "border border-[#27272A] bg-[#141418] text-[#71717A] hover:border-[#D9A52E]/60 hover:text-[#D9A52E]"
                        : "border border-[#27272A] bg-[#18181C] text-[#E4E4E7] hover:border-[#D9A52E]/40 font-bold"
                    }`}
                  >
                    <span className="text-sm font-bold leading-none">
                      {String(ep.episode_number).padStart(2, "0")}
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
          </div>
        </div>
      )}

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
