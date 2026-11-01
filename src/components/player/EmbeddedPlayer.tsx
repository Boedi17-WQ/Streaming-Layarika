"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  STREAMING_PROVIDERS,
  StreamingProviderId,
  getStreamUrl,
} from "@/lib/streaming/providers";
import {
  CheckCircle,
  FastForward,
  ShieldCheck,
  Spinner,
  FilmStrip,
  LockKey,
  Play,
  Crown,
  Clock,
  CornersOut,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { recordWatchProgressAction } from "@/app/actions/history";
import {
  checkMovieWatchAccessAction,
  recordMovieHeartbeatAction,
  getPlaybackSourceAction,
} from "@/app/actions/subscription";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { PremiumRequiredModal, PremiumGateReason } from "@/components/subscription/PremiumRequiredModal";

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
  isAuthenticated?: boolean;
  isVipInitial?: boolean;
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
  isAuthenticated = false,
  isVipInitial = false,
}: EmbeddedPlayerProps) {
  const [activeProvider, setActiveProvider] = useState<StreamingProviderId>("trailer");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMarkingCompleted, setIsMarkingCompleted] = useState<boolean>(false);
  const [serverStreamUrl, setServerStreamUrl] = useState<string | null>(null);
  const [demoVideoError, setDemoVideoError] = useState<boolean>(false);

  // Referensi DOM untuk kontrol stop aman & pembebasan memori
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // State Layar Penuh (Fullscreen)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as unknown as {
        fullscreenElement?: Element;
        webkitFullscreenElement?: Element;
        mozFullScreenElement?: Element;
        msFullscreenElement?: Element;
      };
      setIsFullscreen(
        Boolean(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);



  // State Modal Autentikasi Wajib Login (Addendum Tahap 9)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // State Modal Kuota Premium (Addendum Tahap 9)
  const [premiumModalState, setPremiumModalState] = useState<{
    isOpen: boolean;
    reason: PremiumGateReason;
    usedEpisodes?: number;
    episodeLimit?: number;
    remainingEpisodes?: number;
    message?: string;
  }>({
    isOpen: false,
    reason: "EPISODE_LIMIT_REACHED",
  });

  const [movieEntitlement, setMovieEntitlement] = useState<{
    allowed: boolean;
    isVip: boolean;
    consumedSeconds: number;
    remainingSeconds: number | null;
  } | null>(
    isVipInitial
      ? {
          allowed: true,
          isVip: true,
          consumedSeconds: 0,
          remainingSeconds: null,
        }
      : null
  );


  // Sinkronkan status hak akses ketika komponen dimuat atau jendela kembali aktif (fokus)
  useEffect(() => {
    let isMounted = true;

    const syncAccess = async () => {
      if (mediaType === "MOVIE") {
        try {
          const res = await checkMovieWatchAccessAction(tmdbId);
          if (isMounted) {
            if (res.allowed || res.reason !== "UNAUTHENTICATED") {
              setIsLoginModalOpen(false);
            }
            setMovieEntitlement({
              allowed: res.allowed,
              isVip: res.isVip,
              consumedSeconds: res.consumedSeconds,
              remainingSeconds: res.remainingSeconds,
            });
          }
        } catch {}
      }
    };

    syncAccess();

    window.addEventListener("focus", syncAccess);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncAccess);
    };
  }, [mediaType, tmdbId, isVipInitial]);

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

    setServerStreamUrl(null);
    setDemoVideoError(false);
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

  // Ambil data kuota film (Tahap 9) saat media berganti untuk indikator badge kontrol
  useEffect(() => {
    if (mediaType !== "MOVIE") return;

    let isMounted = true;
    checkMovieWatchAccessAction(tmdbId)
      .then((res) => {
        if (!isMounted) return;
        setMovieEntitlement({
          allowed: res.allowed,
          isVip: res.isVip,
          consumedSeconds: res.consumedSeconds,
          remainingSeconds: res.remainingSeconds,
        });
      })
      .catch((err) => {
        console.warn("Gagal memeriksa hak akses film:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [mediaType, tmdbId]);

  // Heartbeat konsumsi durasi film Free (interval 10 detik saat video sedang diputar)
  useEffect(() => {
    if (!isPlaying || mediaType !== "MOVIE") return;

    const HEARTBEAT_INTERVAL_MS = 10000;
    const DELTA_SECONDS = 10;

    const intervalId = setInterval(async () => {
      try {
        const result = await recordMovieHeartbeatAction({
          tmdbId,
          deltaSeconds: DELTA_SECONDS,
        });

        setMovieEntitlement((prev) => ({
          allowed: result.allowed,
          isVip: prev?.isVip ?? false,
          consumedSeconds: result.consumedSeconds,
          remainingSeconds: result.remainingSeconds,
        }));

        if (!result.allowed || result.reachedLimit) {
          // Hentikan pemutaran segera sesuai Acceptance Criteria 7.4
          stopAllPlayback();
          setPremiumModalState({
            isOpen: true,
            reason: "MOVIE_LIMIT_REACHED",
            message:
              result.message ||
              "Batas tontonan Free untuk film ini (60 menit pemutaran aktual) telah tercapai. Aktifkan Premium VIP untuk melanjutkan menonton hingga selesai tanpa jeda batas.",
          });
        }
      } catch (err) {
        console.warn("Heartbeat playback gagal:", err);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, mediaType, tmdbId, stopAllPlayback]);

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
  const streamUrl = serverStreamUrl || (isPlaying && rawStreamUrl
    ? rawStreamUrl.includes("enablejsapi=1")
      ? rawStreamUrl.replace("autoplay=0", "autoplay=1")
      : rawStreamUrl
    : null);

  const handleStartPlay = async (targetProvider?: StreamingProviderId) => {
    const providerToUse = targetProvider || activeProvider;
    setIsLoading(true);

    try {
      const result = await getPlaybackSourceAction({
        mediaType,
        tmdbId,
        seasonNumber: mediaType === "TV" ? seasonNumber : undefined,
        episodeNumber: mediaType === "TV" ? episodeNumber : undefined,
        providerId: providerToUse,
        youtubeKey: youtubeKey || undefined,
        licensedUrl: licensedUrl || undefined,
      });

      if (mediaType === "MOVIE" && result.consumedSeconds !== undefined) {
        setMovieEntitlement({
          allowed: result.allowed,
          isVip: result.isVip || false,
          consumedSeconds: result.consumedSeconds,
          remainingSeconds: result.remainingSeconds ?? null,
        });
      }

      if (!result.allowed) {
        setIsLoading(false);
        setServerStreamUrl(null);
        setIsPlaying(false);

        if (result.reason === "UNAUTHENTICATED") {
          if (!isAuthenticated) {
            setIsLoginModalOpen(true);
          }
        } else if (result.reason === "MOVIE_LIMIT_REACHED") {
          setPremiumModalState({
            isOpen: true,
            reason: "MOVIE_LIMIT_REACHED",
            message: result.message,
          });
        } else if (result.reason === "VIP_REQUIRED_FOR_EPISODE") {
          setPremiumModalState({
            isOpen: true,
            reason: "VIP_REQUIRED_FOR_EPISODE",
            usedEpisodes: result.usedEpisodes,
            episodeLimit: result.episodeLimit || 5,
            remainingEpisodes: result.remainingEpisodes || 0,
            message: result.message,
          });
        } else {
          setPremiumModalState({
            isOpen: true,
            reason: "EPISODE_LIMIT_REACHED",
            usedEpisodes: result.usedEpisodes,
            episodeLimit: result.episodeLimit || 5,
            remainingEpisodes: result.remainingEpisodes || 0,
            message: result.message,
          });
        }
        return;
      }

      setServerStreamUrl(result.streamUrl);
      setIsLoading(false);
      setIsPlaying(true);
    } catch (err) {
      console.warn("Gagal verifikasi izin putar:", err);
      setIsLoading(false);
      setServerStreamUrl(null);
      setIsPlaying(false);
    }
  };

  const handleSelectProvider = (providerId: StreamingProviderId) => {
    if (activeProvider !== providerId) {
      const wasPlaying = isPlaying;
      stopAllPlayback();
      setServerStreamUrl(null);
      setActiveProvider(providerId);
      setIsCompleted(false);
      setDemoVideoError(false);
      // Jika pengguna sebelumnya sedang memutar, langsung putar provider baru dengan parameter eksplisit
      if (wasPlaying) {
        handleStartPlay(providerId);
      }
    }
  };

  const handleRefresh = () => {
    setDemoVideoError(false);
    setRefreshKey((prev) => prev + 1);
    handleStartPlay();
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
    <div className="space-y-3 sm:space-y-4 rounded-none sm:rounded-3xl border-0 sm:border border-white/10 bg-transparent sm:bg-gradient-to-b sm:from-[#141414] sm:to-[#0c0c0c] p-0 sm:p-6 shadow-none sm:shadow-2xl backdrop-blur-none sm:backdrop-blur-xl">
      {/* 1. Header Bar: Sleek Floating Glass Capsule Dock & Status Akses (Mobile Responsive) */}
      <div className="px-4 sm:px-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2.5 sm:pb-3">
        {/* Floating Glass Capsule Dock Pemilihan Server (Scrollable di HP kecil) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#121212]/90 p-1 shadow-inner shadow-black/80 backdrop-blur-md shrink-0">
            {/* 1. Trailer Resmi */}
            <button
              type="button"
              onClick={() => handleSelectProvider("trailer")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeProvider === "trailer"
                  ? "bg-gradient-to-r from-[#D9A52E] via-[#e5b342] to-[#D9A52E] text-[#0A0A0A] font-bold shadow-[0_0_12px_rgba(217,165,46,0.35)]"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5"
              }`}
            >
              <FilmStrip size={14} weight={activeProvider === "trailer" ? "fill" : "regular"} />
              <span>Trailer</span>
            </button>

            {/* 2. Server 1 (MultiEmbed) */}
            <button
              type="button"
              onClick={() => handleSelectProvider("multiembed")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeProvider === "multiembed"
                  ? "bg-gradient-to-r from-[#D9A52E] via-[#e5b342] to-[#D9A52E] text-[#0A0A0A] font-bold shadow-[0_0_12px_rgba(217,165,46,0.35)]"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {activeProvider === "multiembed" && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#0A0A0A] opacity-75 animate-ping" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeProvider === "multiembed" ? "bg-[#0A0A0A]" : "bg-emerald-400"
                  }`}
                />
              </span>
              <span>Server 1</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  activeProvider === "multiembed" ? "bg-black/20 text-[#0A0A0A]" : "bg-white/10 text-[#737373]"
                }`}
              >
                HD
              </span>
            </button>

            {/* 3. Server 2 (VidSrc) */}
            <button
              type="button"
              onClick={() => handleSelectProvider("vidsrc")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeProvider === "vidsrc"
                  ? "bg-gradient-to-r from-[#D9A52E] via-[#e5b342] to-[#D9A52E] text-[#0A0A0A] font-bold shadow-[0_0_12px_rgba(217,165,46,0.35)]"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {activeProvider === "vidsrc" && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#0A0A0A] opacity-75 animate-ping" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeProvider === "vidsrc" ? "bg-[#0A0A0A]" : "bg-emerald-400"
                  }`}
                />
              </span>
              <span>Server 2</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  activeProvider === "vidsrc" ? "bg-black/20 text-[#0A0A0A]" : "bg-white/10 text-[#737373]"
                }`}
              >
                Multi
              </span>
            </button>

            {/* 4. Demo HLS (Cadangan / Developer Open Source) */}
            <button
              type="button"
              onClick={() => handleSelectProvider("demo")}
              title="Media Uji Demo Terbuka (Blender Foundation)"
              className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all ${
                activeProvider === "demo"
                  ? "bg-gradient-to-r from-[#D9A52E] via-[#e5b342] to-[#D9A52E] text-[#0A0A0A] font-bold shadow-[0_0_12px_rgba(217,165,46,0.35)]"
                  : "text-[#737373] hover:text-[#A3A3A3] hover:bg-white/5"
              }`}
            >
              <span>Demo</span>
            </button>
          </div>
        </div>

        {/* Status Akses & Tombol Aksi Kanan Rapi */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Indikator Kuota Film (Free vs VIP) — Tampilan Horizontal Bersih */}
          {mediaType === "MOVIE" && movieEntitlement && (
            movieEntitlement.isVip ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3 py-1.5 text-xs font-bold text-[#D9A52E] shadow-sm whitespace-nowrap">
                <Crown size={14} weight="fill" />
                <span>VIP Bebas Kuota</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#A3A3A3] whitespace-nowrap">
                <Clock size={13} className="text-[#D9A52E]" />
                <span>
                  {movieEntitlement.remainingSeconds !== null
                    ? `Sisa ${Math.max(0, Math.ceil(movieEntitlement.remainingSeconds / 60))}m`
                    : "Kuota 60m"}
                </span>
              </div>
            )
          )}

          {/* Tombol Episode Selanjutnya (Khusus Serial TV) */}
          {mediaType === "TV" && hasNextEpisode && onNextEpisode && (
            <button
              type="button"
              onClick={onNextEpisode}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E] bg-gradient-to-r from-[#D9A52E] to-[#e5b342] px-3.5 py-1.5 text-xs font-bold text-[#0A0A0A] shadow-md shadow-[#D9A52E]/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>Eps Selanjutnya</span>
              <FastForward size={13} weight="fill" />
            </button>
          )}

          {/* Tombol Tandai Selesai (Kapsul Modern Elegan) */}
          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={isCompleted || isMarkingCompleted}
            title={isCompleted ? "Telah ditandai selesai ditonton" : "Tandai judul ini telah selesai ditonton"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              isCompleted
                ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 cursor-default"
                : "border border-white/10 bg-white/5 text-[#A3A3A3] hover:border-[#D9A52E]/50 hover:text-[#F5F5F5]"
            }`}
          >
            <CheckCircle size={14} weight={isCompleted ? "fill" : "regular"} className={isCompleted ? "text-emerald-400" : "text-[#737373]"} />
            <span className="hidden sm:inline">{isCompleted ? "Selesai" : "Tandai Selesai"}</span>
          </button>
        </div>
      </div>

      {/* 2. Container Video Player (Edge-to-edge di Mobile Sesuai Referensi) */}
      <div
        ref={containerRef}
        className={`relative aspect-video w-full overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-white/10 bg-[#000000] shadow-2xl transition-all ${
          isFullscreen ? "fixed inset-0 z-50 !aspect-auto !h-screen !w-screen !rounded-none !border-0" : ""
        }`}
      >
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

            {(() => {
              const isTvEpisodeVipLocked = mediaType === "TV" && (episodeNumber || 1) >= 6 && !isVipInitial;
              return (
                <div className="relative z-10 flex flex-col items-center max-w-md space-y-4">
                  {isTvEpisodeVipLocked ? (
                    <button
                      type="button"
                      onClick={() => handleStartPlay()}
                      aria-label="Episode terkunci khusus VIP"
                      className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#D9A52E] via-[#F3C254] to-[#FFF0B3] shadow-2xl shadow-[#D9A52E]/30 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#D9A52E]/40 cursor-pointer"
                    >
                      <LockKey size={36} weight="fill" className="text-[#0A0A0A]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartPlay()}
                      aria-label={`Mulai putar ${currentProvider.name}`}
                      className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-[#D9A52E] text-[#0A0A0A] shadow-2xl shadow-[#D9A52E]/30 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#D9A52E]/40"
                    >
                      <span className="absolute -inset-2 rounded-full border-2 border-[#D9A52E]/40 animate-ping opacity-60 pointer-events-none" />
                      <Play size={36} weight="fill" className="ml-1 text-[#0A0A0A]" />
                    </button>
                  )}

                  <div className="space-y-1">
                    <span className="rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3 py-1 text-[11px] font-bold text-[#D9A52E] uppercase tracking-wider inline-flex items-center gap-1">
                      {isTvEpisodeVipLocked && <Crown size={12} weight="fill" />}
                      <span>{isTvEpisodeVipLocked ? "Khusus VIP Member" : currentProvider.name}</span>
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
                      {isTvEpisodeVipLocked
                        ? "Episode 6 dan seterusnya terkunci khusus member VIP. Beli paket VIP untuk menonton."
                        : "Klik tombol putar untuk memulai video. Audio tidak diputar di latar belakang."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            STATE 2: SIKLUS PLAYING (Iframe & Video Player Aktif)
            ========================================================================= */}
        {isPlaying && (
          <>
            {/* Kondisi 1: Trailer Resmi via YouTube No-Cookie (Enable JS API) */}
            {activeProvider === "trailer" && streamUrl && (
              <iframe
                ref={iframeRef}
                key={`trailer-${streamUrl}-${refreshKey}`}
                src={streamUrl}
                title={`Trailer Resmi ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
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
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="origin"
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

            {/* Kondisi 4: Demo Pemutar Video Terbuka (Creative Commons - Big Buck Bunny & Mirror) */}
            {activeProvider === "demo" && (
              <div className="relative h-full w-full bg-[#050505]">
                {demoVideoError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#A3A3A3] bg-[#0d0d0d]">
                    <FilmStrip size={44} className="text-[#D9A52E]/60 mb-2.5" />
                    <p className="text-sm font-bold text-[#F5F5F5] mb-1">
                      Gagal Memuat Sumber Video Demo
                    </p>
                    <p className="text-xs text-[#737373] max-w-sm mb-4">
                      Koneksi ke media uji terbuka terputus atau dibatasi oleh browser. Anda dapat memuat ulang atau beralih ke Server 1 / Server 2.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoVideoError(false);
                        handleRefresh();
                      }}
                      className="rounded-xl bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] shadow-lg shadow-[#D9A52E]/20 transition hover:bg-[#c49226]"
                    >
                      Coba Muat Ulang
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    key={`demo-video-${refreshKey}`}
                    controls
                    autoPlay
                    playsInline
                    poster={previewCoverUrl || undefined}
                    src={serverStreamUrl || streamUrl || "https://uploads.video-commander.com/sample/BigBuckBunny.mp4"}
                    className="h-full w-full object-contain"
                    onLoadedData={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      // Fallback ke CDN cadangan jika CDN pertama terblokir jaringan pengguna
                      if (videoRef.current && !videoRef.current.src.includes("oceans.mp4")) {
                        videoRef.current.src = "https://vjs.zencdn.net/v/oceans.mp4";
                        videoRef.current.load();
                        videoRef.current.play().catch(() => {});
                      } else {
                        setDemoVideoError(true);
                      }
                    }}
                  >
                    <track kind="captions" />
                    Browser Anda tidak mendukung tag video HTML5.
                  </video>
                )}
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

      {/* 3. Bar Informasi Kepatuhan Keamanan & Panduan Subtitle */}
      <div className="space-y-2 px-1">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#737373]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#D9A52E] shrink-0" />
            <span>
              {currentProvider.complianceNotice ||
                "Pemutar diisolasi dengan sandbox ketat. Sumber tidak berlisensi dinonaktifkan demi perlindungan hak cipta."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {streamUrl && (activeProvider === "multiembed" || activeProvider === "vidsrc") && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#D9A52E] hover:underline text-[11px] font-medium"
                title="Jika video tidak muncul di browser HP, buka pemutar langsung di tab baru"
              >
                <ArrowSquareOut size={13} />
                <span>Buka di Tab Baru</span>
              </a>
            )}
            {mediaType === "TV" && (
              <div className="font-semibold text-[#A3A3A3]">
                Musim {seasonNumber} • Episode {episodeNumber} {episodeTitle ? `— ${episodeTitle}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Panduan Cepat Subtitle, Audio & Fullscreen */}
        {isPlaying && (activeProvider === "vidsrc" || activeProvider === "multiembed") && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-[#141414]/90 px-3.5 py-2.5 text-xs text-[#A3A3A3] shadow-inner">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-6 shrink-0 items-center justify-center rounded bg-[#D9A52E]/15 border border-[#D9A52E]/30 font-bold text-[10px] text-[#D9A52E]">
                CC
              </span>
              <span className="text-[11px]">
                <strong className="text-[#F5F5F5]">Cara Aktifkan Subtitle:</strong>{" "}
                {activeProvider === "vidsrc"
                  ? "Ketuk layar video satu kali untuk menampilkan tombol kontrol, lalu klik ikon [CC] atau ikon Gerigi di pojok kanan bawah player untuk memilih Subtitle Bahasa Indonesia."
                  : "Gunakan menu dropdown 'SERVERS' dan 'SUBTITLES' di bagian atas video untuk memilih subtitle Bahasa Indonesia."}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#D9A52E] shrink-0 font-medium">
              <CornersOut size={13} weight="bold" />
              <span>Gunakan tombol Layar Penuh di atas video untuk mode bioskop</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modal Autentikasi Wajib Login Sebelum Menonton (Addendum Tahap 9) */}
      <LoginRequiredModal
        isOpen={isLoginModalOpen && !isAuthenticated}
        onClose={() => setIsLoginModalOpen(false)}
        isAuthenticated={isAuthenticated}
        callbackUrl={
          mediaType === "TV"
            ? `/tv/${tmdbId}?season=${seasonNumber}&episode=${episodeNumber}`
            : `/movie/${tmdbId}`
        }
        mediaTitle={title}
        mediaType={mediaType}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
      />

      {/* 5. Modal Paywall Kuota Premium (Addendum Tahap 9) */}
      <PremiumRequiredModal
        isOpen={premiumModalState.isOpen}
        onClose={() => setPremiumModalState((prev) => ({ ...prev, isOpen: false }))}
        reason={premiumModalState.reason}
        usedEpisodes={premiumModalState.usedEpisodes}
        episodeLimit={premiumModalState.episodeLimit}
        remainingEpisodes={premiumModalState.remainingEpisodes}
        consumedSeconds={movieEntitlement?.consumedSeconds || 3600}
        movieLimitSeconds={3600}
        customMessage={premiumModalState.message}
      />
    </div>
  );
}
