"use client";

import { useState, useEffect } from "react";
import {
  STREAMING_PROVIDERS,
  ACTIVE_PLAYABLE_PROVIDERS,
  StreamingProviderId,
  getStreamUrl,
} from "@/lib/streaming/providers";
import {
  ArrowClockwise,
  CheckCircle,
  FastForward,
  ShieldCheck,
  Spinner,
  FilmStrip,
  LockKey,
} from "@phosphor-icons/react";
import { recordWatchProgressAction } from "@/app/actions/history";

export interface EmbeddedPlayerProps {
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  youtubeKey?: string | null;
  licensedUrl?: string | null;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
}

export function EmbeddedPlayer({
  tmdbId,
  mediaType,
  title,
  posterPath = null,
  seasonNumber = 1,
  episodeNumber = 1,
  episodeTitle = null,
  youtubeKey = null,
  licensedUrl = null,
  hasNextEpisode = false,
  onNextEpisode,
}: EmbeddedPlayerProps) {
  const [activeProvider, setActiveProvider] = useState<StreamingProviderId>("trailer");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMarkingCompleted, setIsMarkingCompleted] = useState<boolean>(false);

  // Auto-dismiss loading overlay setelah 2 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeProvider, refreshKey, seasonNumber, episodeNumber]);

  // Otomatis catat tontonan awal ke database (Tahap 5 Watch History) saat media/episode berganti
  useEffect(() => {
    recordWatchProgressAction({
      tmdbId,
      mediaType,
      title,
      posterPath,
      seasonNumber: mediaType === "TV" ? seasonNumber : null,
      episodeNumber: mediaType === "TV" ? episodeNumber : null,
      progressSeconds: 30,
      durationSeconds: 3600,
    }).catch(() => {});
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, activeProvider, title, posterPath]);

  const streamUrl = getStreamUrl({
    providerId: activeProvider,
    mediaType,
    tmdbId,
    seasonNumber,
    episodeNumber,
    youtubeKey: youtubeKey || undefined,
    licensedUrl: licensedUrl || undefined,
  });

  const handleSelectProvider = (providerId: StreamingProviderId) => {
    if (activeProvider !== providerId) {
      setIsLoading(true);
      setActiveProvider(providerId);
      setIsCompleted(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleMarkCompleted = async () => {
    setIsMarkingCompleted(true);
    try {
      await recordWatchProgressAction({
        tmdbId,
        mediaType,
        title,
        posterPath,
        seasonNumber: mediaType === "TV" ? seasonNumber : null,
        episodeNumber: mediaType === "TV" ? episodeNumber : null,
        progressSeconds: 3600,
        durationSeconds: 3600,
      });
      setIsCompleted(true);
    } catch (err) {
      console.warn("Gagal menandai tontonan:", err);
    } finally {
      setIsMarkingCompleted(false);
    }
  };

  const currentProvider = STREAMING_PROVIDERS[activeProvider] || STREAMING_PROVIDERS.trailer;

  return (
    <div className="space-y-4 rounded-2xl border border-[#292929] bg-[#121212] p-4 sm:p-6 shadow-2xl">
      {/* 1. Header Bar: Server Switcher & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#222222] pb-4">
        {/* Tab Pemilihan Sumber */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mr-1">
            Sumber:
          </span>
          {ACTIVE_PLAYABLE_PROVIDERS.map((p) => {
            const isActive = activeProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProvider(p.id)}
                className={`group flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition shadow-sm ${
                  isActive
                    ? "bg-[#D9A52E] text-[#0A0A0A] shadow-[#D9A52E]/20"
                    : "border border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#D9A52E]/50 hover:text-[#F5F5F5]"
                }`}
              >
                {/* Indikator Status Sumber */}
                <span className="relative flex h-2 w-2">
                  {p.isPlayable && (
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isActive ? "bg-[#0A0A0A] animate-ping" : "bg-emerald-400"
                      }`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isActive
                        ? "bg-[#0A0A0A]"
                        : p.isPlayable
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  />
                </span>
                <span>{p.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    isActive ? "bg-black/20 text-[#0A0A0A]" : "bg-[#292929] text-[#737373]"
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tombol Aksi Kanan (Reload, Tandai Selesai, Next Episode) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat Ulang Pemutar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#292929] bg-[#1c1c1c] text-[#A3A3A3] transition hover:border-[#D9A52E] hover:text-[#F5F5F5]"
          >
            <ArrowClockwise size={16} />
          </button>

          {/* Tombol Tandai Selesai */}
          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={isCompleted || isMarkingCompleted}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              isCompleted
                ? "border-emerald-600 bg-emerald-500/10 text-emerald-400 cursor-default"
                : "border-[#292929] bg-[#1c1c1c] text-[#A3A3A3] hover:border-emerald-500 hover:text-emerald-400"
            }`}
          >
            <CheckCircle size={14} weight={isCompleted ? "fill" : "regular"} />
            <span>{isCompleted ? "Telah Selesai" : "Tandai Selesai"}</span>
          </button>

          {/* Tombol Episode Selanjutnya (Khusus Serial TV) */}
          {mediaType === "TV" && hasNextEpisode && onNextEpisode && (
            <button
              type="button"
              onClick={onNextEpisode}
              className="flex items-center gap-1.5 rounded-lg border border-[#D9A52E] bg-[#D9A52E]/15 px-3 py-1.5 text-xs font-bold text-[#D9A52E] transition hover:bg-[#D9A52E] hover:text-[#0A0A0A]"
            >
              <span>Eps Selanjutnya</span>
              <FastForward size={14} weight="fill" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Container Video Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#292929] bg-[#000000] shadow-2xl">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-xs text-[#F5F5F5] transition-opacity duration-300">
            <Spinner size={42} className="animate-spin text-[#D9A52E]" />
            <p className="mt-3 text-xs font-medium text-[#A3A3A3]">
              Menghubungkan ke {currentProvider.name}...
            </p>
          </div>
        )}

        {/* Kondisi 1: Trailer Resmi via YouTube No-Cookie (Sandboxed) */}
        {activeProvider === "trailer" && streamUrl && (
          <iframe
            key={`trailer-${streamUrl}-${refreshKey}`}
            src={streamUrl}
            title={`Trailer Resmi ${title}`}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            onLoad={() => setIsLoading(false)}
            className="h-full w-full border-0"
          />
        )}

        {/* Kondisi 2: Pemutar Film & Episode Penuh (MultiEmbed / VidSrc) */}
        {(activeProvider === "multiembed" || activeProvider === "vidsrc") && streamUrl && (
          <iframe
            key={`stream-${activeProvider}-${seasonNumber}-${episodeNumber}-${refreshKey}`}
            src={streamUrl}
            title={`Pemutar Streaming ${title}`}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            onLoad={() => setIsLoading(false)}
            className="h-full w-full border-0"
          />
        )}

        {/* Kondisi 2: Trailer Tidak Ditemukan di TMDB */}
        {activeProvider === "trailer" && !streamUrl && (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d0d0d] p-6 text-center text-[#A3A3A3]">
            <FilmStrip size={48} className="text-[#D9A52E]/60 mb-3" />
            <h3 className="text-base font-bold text-[#F5F5F5]">Cuplikan Resmi Belum Tersedia</h3>
            <p className="mt-1.5 max-w-md text-xs text-[#737373] leading-relaxed">
              Trailer resmi untuk judul ini belum didistribusikan oleh studio produksi melalui database TMDB. Silakan periksa tab Demo HLS untuk menguji pemutar media.
            </p>
          </div>
        )}

        {/* Kondisi 3: Demo Pemutar HLS / MP4 (Creative Commons - Sintel) */}
        {activeProvider === "demo" && (
          <div className="relative h-full w-full bg-[#050505]">
            <video
              key={`demo-video-${refreshKey}`}
              controls
              autoPlay
              playsInline
              poster={posterPath ? `https://image.tmdb.org/t/p/w1280${posterPath}` : undefined}
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
              className="h-full w-full object-contain"
              onLoadedData={() => setIsLoading(false)}
            >
              <track kind="captions" />
              Browser Anda tidak mendukung tag video HTML5.
            </video>
          </div>
        )}

        {/* Kondisi 4: Tab Stream Penuh Berlisensi (Informasi Kepatuhan & Staging) */}
        {activeProvider === "licensed" && (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d0d0d] p-6 sm:p-10 text-center text-[#A3A3A3]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9A52E]/30 bg-[#171717] text-[#D9A52E] mb-4">
              <LockKey size={32} weight="duotone" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5F5]">Endpoint Stream Berlisensi Belum Dikonfigurasi</h3>
            <p className="mt-2 max-w-lg text-xs text-[#8c8c8c] leading-relaxed">
              LayarRika beroperasi dengan prinsip keamanan, integritas data, dan kepatuhan penuh terhadap hak cipta penyiaran. Pemutaran film atau serial utuh memerlukan izin distribusi resmi serta manifest HLS/DASH berlisensi yang di-hosting pada infrastruktur aman.
            </p>
            <div className="mt-4 rounded-xl border border-[#292929] bg-[#141414] p-3 text-left text-[11px] text-[#A3A3A3] max-w-md space-y-1">
              <div className="font-semibold text-[#D9A52E] flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Petunjuk Integrasi Staging / Produksi:</span>
              </div>
              <p className="text-[#737373]">
                Konfigurasikan variabel <code className="text-[#F5F5F5]">LICENSED_STREAM_BASE_URL</code> pada dashboard deployment Anda (misal AWS CloudFront/S3 bertanda tangan aman atau penyedia DRM).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bar Informasi Kepatuhan Keamanan */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#737373] px-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-[#D9A52E]" />
          <span>
            {currentProvider.complianceNotice ||
              "Pemutar diisolasi dengan sandbox ketat. Sumber tidak berlisensi dinonaktifkan demi perlindungan hak cipta."}
          </span>
        </div>
        {mediaType === "TV" && (
          <div className="font-semibold text-[#A3A3A3]">
            Musim {seasonNumber} • Episode {episodeNumber} {episodeTitle ? `— ${episodeTitle}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
