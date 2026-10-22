"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play,
  CalendarBlank,
  Clock,
  Star,
  Television,
  Spinner,
  ShieldCheck,
} from "@phosphor-icons/react";
import { TmdbTvSeasonSummary, TmdbTvEpisode } from "@/lib/tmdb/types";
import { getTmdbStillUrl } from "@/lib/tmdb/images";
import { EmbeddedPlayer } from "@/components/player/EmbeddedPlayer";
import { getSeasonEpisodesAction } from "@/app/actions/tv";

export interface TvSeasonEpisodeBrowserProps {
  seriesId: number;
  seriesName: string;
  posterPath?: string | null;
  seasons: TmdbTvSeasonSummary[];
  initialSeasonNumber: number;
  initialEpisodes: TmdbTvEpisode[];
  youtubeKey?: string | null;
}

export function TvSeasonEpisodeBrowser({
  seriesId,
  seriesName,
  posterPath = null,
  seasons,
  initialSeasonNumber,
  initialEpisodes,
  youtubeKey = null,
}: TvSeasonEpisodeBrowserProps) {
  // Hanya tampilkan musim reguler (> 0) terlebih dahulu, atau semua musim jika tidak ada musim reguler
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const seasonsToDisplay = validSeasons.length > 0 ? validSeasons : seasons;

  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(initialSeasonNumber);
  const [episodes, setEpisodes] = useState<TmdbTvEpisode[]>(initialEpisodes);
  const [isLoadingSeason, setIsLoadingSeason] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Inisialisasi episode aktif dengan episode 1 (jika tersedia)
  const [activeEpisode, setActiveEpisode] = useState<TmdbTvEpisode | null>(
    initialEpisodes.length > 0 ? initialEpisodes[0] : null
  );

  const handleSelectSeason = async (seasonNum: number) => {
    if (seasonNum === activeSeasonNumber) return;

    setActiveSeasonNumber(seasonNum);
    setIsLoadingSeason(true);
    setLoadError(null);

    try {
      const res = await getSeasonEpisodesAction(seriesId, seasonNum);
      if (res.success && res.season?.episodes) {
        setEpisodes(res.season.episodes);
        if (res.season.episodes.length > 0) {
          setActiveEpisode(res.season.episodes[0]);
        }
      } else {
        setLoadError(res.error || "Gagal memuat episode musim ini.");
      }
    } catch {
      setLoadError("Terjadi kesalahan jaringan saat mengambil data episode.");
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
      setActiveEpisode(nextEp);
      // Smooth scroll kembali ke player
      document.getElementById("tv-player-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="tv-player-section" className="space-y-6 scroll-mt-24">
      {/* 1. Pemutar Streaming Multi-Provider (Adopsi Streambert) */}
      {activeEpisode && (
        <div className="space-y-3 rounded-2xl border border-[#D9A52E]/30 bg-[#121212] p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#292929]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F5F5F5]">
              <span className="h-3 w-1 rounded-full bg-[#D9A52E]" />
              <span>
                Sedang Memutar: Musim {activeEpisode.season_number} Episode {activeEpisode.episode_number} — {activeEpisode.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded bg-[#D9A52E]/10 border border-[#D9A52E]/30 px-2 py-0.5 text-[11px] font-bold text-[#D9A52E]">
                Stream Multi-Server
              </span>
            </div>
          </div>

          <EmbeddedPlayer
            tmdbId={seriesId}
            mediaType="TV"
            title={seriesName}
            posterPath={posterPath}
            backdropPath={activeEpisode.still_path || posterPath}
            seasonNumber={activeEpisode.season_number}
            episodeNumber={activeEpisode.episode_number}
            episodeTitle={activeEpisode.name}
            youtubeKey={youtubeKey}
            hasNextEpisode={hasNextEpisode}
            onNextEpisode={handleNextEpisode}
          />
        </div>
      )}

      {/* 2. Header & Navigasi Tab Pilihan Musim (Seasons Selector) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
            <Television size={20} className="text-[#D9A52E]" />
            <span>Pilih Episode & Musim</span>
          </h3>
          <span className="text-xs text-[#737373]">
            {episodes.length} Episode di Musim {activeSeasonNumber}
          </span>
        </div>

        {/* Horizontal Scrollable Season Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {seasonsToDisplay.map((season) => {
            const isActive = season.season_number === activeSeasonNumber;
            return (
              <button
                key={season.id}
                type="button"
                onClick={() => handleSelectSeason(season.season_number)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                  isActive
                    ? "border-[#D9A52E] bg-[#D9A52E] text-[#0A0A0A] shadow-md shadow-[#D9A52E]/10"
                    : "border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#D9A52E]/40 hover:text-[#F5F5F5]"
                }`}
              >
                <span>{season.name || `Musim ${season.season_number}`}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-black/20 text-[#0A0A0A]" : "bg-[#242424] text-[#737373]"
                  }`}
                >
                  {season.episode_count} eps
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Daftar Episode Musim Aktif */}
      {isLoadingSeason ? (
        <div className="flex h-48 w-full flex-col items-center justify-center rounded-2xl border border-[#292929] bg-[#141414]">
          <Spinner size={36} className="animate-spin text-[#D9A52E]" />
          <span className="mt-3 text-xs text-[#A3A3A3]">
            Memuat daftar episode musim {activeSeasonNumber}...
          </span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-xs text-red-400">
          {loadError}
        </div>
      ) : episodes.length === 0 ? (
        <div className="rounded-xl border border-[#292929] bg-[#141414] p-8 text-center text-xs text-[#737373]">
          Belum ada informasi episode yang dirilis untuk musim ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {episodes.map((ep) => {
            const stillUrl = getTmdbStillUrl(ep.still_path, "w300");
            const isPlayingThis =
              activeEpisode?.episode_number === ep.episode_number &&
              activeEpisode?.season_number === ep.season_number;

            return (
              <div
                key={ep.id}
                onClick={() => {
                  setActiveEpisode(ep);
                  document.getElementById("tv-player-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-[#171717] p-4 cursor-pointer transition-all duration-200 ${
                  isPlayingThis
                    ? "border-[#D9A52E] bg-[#1c1a14] ring-1 ring-[#D9A52E]/50 shadow-lg shadow-[#D9A52E]/5"
                    : "border-[#292929] hover:border-[#D9A52E]/50 hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail Still Image */}
                  <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg border border-[#292929] bg-[#0A0A0A]">
                    {stillUrl ? (
                      <Image
                        src={stillUrl}
                        alt={`Still ${ep.name}`}
                        fill
                        sizes="130px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#737373]">
                        <Television size={24} />
                      </div>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9A52E] text-[#0A0A0A] shadow-md">
                        <Play size={14} weight="fill" className="ml-0.5" />
                      </div>
                    </div>

                    {/* Badge Nomor Episode */}
                    <div className="absolute top-1 left-1 rounded bg-[#0A0A0A]/85 px-1.5 py-0.5 text-[10px] font-bold text-[#D9A52E] backdrop-blur-xs">
                      E{ep.episode_number}
                    </div>
                  </div>

                  {/* Info Episode */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4
                      className={`text-sm font-bold transition line-clamp-1 ${
                        isPlayingThis ? "text-[#D9A52E]" : "text-[#F5F5F5] group-hover:text-[#D9A52E]"
                      }`}
                    >
                      {ep.episode_number}. {ep.name}
                    </h4>

                    {/* Metrics: Durasi, Air Date, Rating */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#737373]">
                      {ep.runtime && ep.runtime > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{ep.runtime}m</span>
                        </span>
                      )}
                      {ep.air_date && (
                        <span className="flex items-center gap-1">
                          <CalendarBlank size={12} />
                          <span>{ep.air_date.substring(0, 4)}</span>
                        </span>
                      )}
                      {ep.vote_average && ep.vote_average > 0 ? (
                        <span className="flex items-center gap-1 text-[#D9A52E]">
                          <Star size={12} weight="fill" />
                          <span>{ep.vote_average.toFixed(1)}</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Sinopsis Singkat */}
                    <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
                      {ep.overview || "Sinopsis episode ini belum tersedia dalam database."}
                    </p>
                  </div>
                </div>

                {/* Tombol Status Episode */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#242424] text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-[#737373]">
                    <ShieldCheck size={14} className="text-[#D9A52E]" />
                    <span>Terverifikasi TMDB</span>
                  </span>

                  <span
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      isPlayingThis
                        ? "border-[#D9A52E] bg-[#D9A52E] text-[#0A0A0A]"
                        : "border-[#292929] bg-[#212121] text-[#F5F5F5] group-hover:border-[#D9A52E] group-hover:text-[#D9A52E]"
                    }`}
                  >
                    <Play size={12} weight="fill" />
                    <span>{isPlayingThis ? "Sedang Diputar" : "Putar Episode"}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
