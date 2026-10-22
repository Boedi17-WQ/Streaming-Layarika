"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  Play,
  Stop,
} from "@phosphor-icons/react";
import { recordWatchProgressAction } from "@/app/actions/history";

export interface EmbeddedPlayerProps {
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
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
  backdropPath = null,
  seasonNumber = 1,
  episodeNumber = 1,
  episodeTitle = null,
  youtubeKey = null,
  licensedUrl = null,
  hasNextEpisode = false,
  onNextEpisode,
}: EmbeddedPlayerProps) {
  const [activeProvider, setActiveProvider] = useState<StreamingProviderId>("trailer");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMarkingCompleted, setIsMarkingCompleted] = useState<boolean>(false);

  // Referensi DOM untuk kontrol stop aman & pembebasan memori
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Deteksi navigasi rute Next.js untuk menghentikan pemutaran
  const pathname = usePathname();
  const activePathRef = useRef<string>(pathname);

  /**
   * Menghentikan seluruh aktivitas pemutaran video secara menyeluruh:
   * 1. Mengirim perintah pause & stop ke YouTube IFrame API via postMessage.
   * 2. Mengosongkan src iframe menjadi about:blank untuk melepaskan resource audio/video.
   * 3. Mem-pause elemen HTMLVideoElement dan melepaskan src.
   * 4. Mereset state isPlaying menjadi false.
   */
  const stopAllPlayback = useCallback(() => {
    // A. Hentikan YouTube Iframe API via postMessage
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "stopVideo", args: "" }),
          "*"
        );
      } catch {
        // Fallback untuk iframe lintas origin
      }

      try {
        iframeRef.current.src = "about:blank";
      } catch {
        // Abaikan jika tidak diizinkan browser
      }
    }

    // B. Hentikan HTML5 Video
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {
        // Abaikan jika sudah unloaded
      }
    }

    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  // 1. Hentikan pemutaran jika pengguna berpindah ke halaman lain (Next.js route change)
  useEffect(() => {
    if (activePathRef.current !== pathname) {
      stopAllPlayback();
      activePathRef.current = pathname;
    }
  }, [pathname, stopAllPlayback]);

  // 2. Hentikan pemutaran saat tab diminimize, halaman disembunyikan oleh Cache Components, atau pagehide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllPlayback();
      }
    };

    const handlePageHide = () => {
      stopAllPlayback();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      stopAllPlayback();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [stopAllPlayback]);

  // Auto-dismiss loading overlay setelah 2 detik
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeProvider, refreshKey, seasonNumber, episodeNumber, isPlaying]);

  // Otomatis catat tontonan ke database (Tahap 5 Watch History) saat media/episode berganti
  useEffect(() => {
    if (!isPlaying) return;
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
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, activeProvider, title, posterPath, isPlaying]);

  const rawStreamUrl = getStreamUrl({
    providerId: activeProvider,
    mediaType,
    tmdbId,
    seasonNumber,
    episodeNumber,
    youtubeKey: youtubeKey || undefined,
    licensedUrl: licensedUrl || undefined,
  });

  // Saat pengguna secara eksplisit menekan tombol Play, aktifkan autoplay=1 pada URL embed
  const streamUrl = rawStreamUrl
    ? rawStreamUrl.includes("enablejsapi=1")
      ? rawStreamUrl.replace("autoplay=0", "autoplay=1")
      : rawStreamUrl
    : null;

  const handleStartPlay = () => {
    setIsLoading(true);
    setIsPlaying(true);
  };

  const handleSelectProvider = (providerId: StreamingProviderId) => {
    if (activeProvider !== providerId) {
      stopAllPlayback();
      setActiveProvider(providerId);
      setIsCompleted(false);
      // Jika pengguna sebelumnya sudah memutar, lanjutkan ke provider baru
      if (isPlaying) {
        setIsLoading(true);
        setIsPlaying(true);
      }
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
    setIsPlaying(true);
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

  // Gambar sampul pratinjau elegan
  const previewCoverUrl =
    backdropPath
      ? `https://image.tmdb.org/t/p/w1280${backdropPath}`
      : posterPath
      ? `https://image.tmdb.org/t/p/w1280${posterPath}`
      : null;

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

        {/* Tombol Aksi Kanan (Stop, Reload, Tandai Selesai, Next Episode) */}
        <div className="flex items-center gap-2">
          {/* Tombol Hentikan Pemutaran Eksplisit */}
          {isPlaying && (
            <button
              type="button"
              onClick={stopAllPlayback}
              title="Hentikan Pemutaran Video"
              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-900/50"
            >
              <Stop size={14} weight="fill" />
              <span>Hentikan</span>
            </button>
          )}

          {/* Tombol Muat Ulang */}
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
        {/* Loading Spinner saat memuat */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-xs text-[#F5F5F5] transition-opacity duration-300">
            <Spinner size={42} className="animate-spin text-[#D9A52E]" />
            <p className="mt-3 text-xs font-medium text-[#A3A3A3]">
              Menghubungkan ke {currentProvider.name}...
            </p>
          </div>
        )}

        {/* =========================================================================
            STATE 1: SIKLUS NON-PLAYING (Tampilan Sampul Pratinjau & Tombol Play)
            Mencegah autoplay tanpa persetujuan pengguna & menghentikan audio latar belakang
            ========================================================================= */}
        {!isPlaying && activeProvider !== "licensed" && (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-t from-[#0A0A0A] via-[#121212] to-[#171717] flex flex-col items-center justify-center p-6 text-center">
            {previewCoverUrl && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={previewCoverUrl}
                  alt={`Sampul ${title}`}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover opacity-25 filter blur-[2px]"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center max-w-md space-y-4">
              <button
                type="button"
                onClick={handleStartPlay}
                aria-label={`Mulai putar ${currentProvider.name}`}
                className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-[#D9A52E] text-[#0A0A0A] shadow-2xl shadow-[#D9A52E]/30 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#D9A52E]/40"
              >
                <span className="absolute -inset-2 rounded-full border-2 border-[#D9A52E]/40 animate-ping opacity-60 pointer-events-none" />
                <Play size={36} weight="fill" className="ml-1 text-[#0A0A0A]" />
              </button>

              <div className="space-y-1">
                <span className="rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3 py-1 text-[11px] font-bold text-[#D9A52E] uppercase tracking-wider">
                  {currentProvider.name}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-[#F5F5F5] line-clamp-1 pt-1">
                  {title}
                </h4>
                {mediaType === "TV" && (
                  <p className="text-xs text-[#A3A3A3]">
                    Musim {seasonNumber} • Episode {episodeNumber} {episodeTitle ? `— ${episodeTitle}` : ""}
                  </p>
                )}
                <p className="text-[11px] text-[#737373]">
                  Klik tombol putar untuk memulai video. Audio tidak diputar di latar belakang.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: SIKLUS PLAYING (Iframe & Video Player Aktif)
            ========================================================================= */}
        {isPlaying && (
          <>
            {/* Kondisi 1: Trailer Resmi via YouTube No-Cookie (Sandboxed & Enable JS API) */}
            {activeProvider === "trailer" && streamUrl && (
              <iframe
                ref={iframeRef}
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
                ref={iframeRef}
                key={`stream-${activeProvider}-${seasonNumber}-${episodeNumber}-${refreshKey}`}
                src={streamUrl}
                title={`Pemutar Streaming ${title}`}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                onLoad={() => setIsLoading(false)}
                className="h-full w-full border-0"
              />
            )}

            {/* Kondisi 3: Trailer Tidak Ditemukan di TMDB */}
            {activeProvider === "trailer" && !streamUrl && (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d0d0d] p-6 text-center text-[#A3A3A3]">
                <FilmStrip size={48} className="text-[#D9A52E]/60 mb-3" />
                <h3 className="text-base font-bold text-[#F5F5F5]">Cuplikan Resmi Belum Tersedia</h3>
                <p className="mt-1.5 max-w-md text-xs text-[#737373] leading-relaxed">
                  Trailer resmi untuk judul ini belum didistribusikan oleh studio produksi melalui database TMDB. Silakan pilih Server 1 atau Server 2 untuk menonton film penuh.
                </p>
              </div>
            )}

            {/* Kondisi 4: Demo Pemutar HLS / MP4 (Creative Commons - Sintel) */}
            {activeProvider === "demo" && (
              <div className="relative h-full w-full bg-[#050505]">
                <video
                  ref={videoRef}
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
          </>
        )}

        {/* Kondisi 5: Tab Stream Penuh Berlisensi (Informasi Kepatuhan & Staging) */}
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
