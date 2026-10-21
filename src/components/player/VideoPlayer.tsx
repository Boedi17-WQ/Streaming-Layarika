"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  SpeakerHigh,
  SpeakerLow,
  SpeakerSlash,
  CornersOut,
  CornersIn,
  ArrowCounterClockwise,
  ArrowClockwise,
  ShieldCheck,
  Warning,
  Spinner,
  X,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";
import { recordWatchProgressAction } from "@/app/actions/history";
import { MediaType } from "@prisma/client";

export interface VideoPlayerProps {
  title: string;
  mediaType: MediaType;
  tmdbId: number;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  episodeTitle?: string | null;
  posterPath?: string | null;
  videoUrl?: string | null;
  mimeType?: string | null;
  playbackAssetId?: string | null;
  sourceAttribution?: string | null;
  initialProgressSeconds?: number;
  onClose?: () => void;
}

// Fallback demo legal berlisensi Creative Commons (Blender Foundation)
const LEGAL_DEMO_ASSETS = [
  {
    title: "Tears of Steel (Blender Open Movie Project)",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    mimeType: "video/mp4",
    sourceAttribution: "Blender Foundation (Creative Commons Attribution 3.0)",
  },
  {
    title: "Big Buck Bunny (Blender Open Movie)",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    mimeType: "video/mp4",
    sourceAttribution: "Blender Foundation (Creative Commons Attribution 3.0)",
  },
  {
    title: "Sintel — The Durian Open Movie",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    mimeType: "video/mp4",
    sourceAttribution: "Blender Foundation (Creative Commons Attribution 3.0)",
  },
];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  title,
  mediaType,
  tmdbId,
  seasonNumber = null,
  episodeNumber = null,
  episodeTitle = null,
  posterPath = null,
  videoUrl: initialVideoUrl = null,
  mimeType: initialMimeType = null,
  playbackAssetId: initialAssetId = null,
  sourceAttribution: initialAttribution = null,
  initialProgressSeconds = 0,
  onClose,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Status Sumber Media (Mendukung fallback demo resmi bila aset utama belum tersedia)
  const [activeUrl, setActiveUrl] = useState<string | null>(initialVideoUrl);
  const [activeMimeType, setActiveMimeType] = useState<string | null>(initialMimeType);
  const [activeAttribution, setActiveAttribution] = useState<string | null>(initialAttribution);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Status Pemutaran
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kontrol UI Overlay
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prompt Resume Playback
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(
    initialProgressSeconds > 10 && initialProgressSeconds < 7200
  );

  // Tracking Progres Ter-debounce
  const lastSyncTimeRef = useRef<number>(0);

  const syncProgress = useCallback(
    async (seconds: number, totalDuration: number) => {
      if (seconds <= 0 || totalDuration <= 0) return;
      // Jangan sinkronisasi jika dalam demo mode pura-pura
      if (isDemoMode) return;

      try {
        await recordWatchProgressAction({
          tmdbId,
          mediaType,
          title,
          posterPath,
          seasonNumber,
          episodeNumber,
          progressSeconds: Math.floor(seconds),
          durationSeconds: Math.floor(totalDuration),
          playbackAssetId: initialAssetId,
        });
        lastSyncTimeRef.current = seconds;
      } catch (err) {
        // Gagal silent agar tidak mengganggu pengalaman menonton pengguna
        console.warn("Gagal menyinkronkan progres tontonan:", err);
      }
    },
    [tmdbId, mediaType, title, posterPath, seasonNumber, episodeNumber, initialAssetId, isDemoMode]
  );

  // ---------------------------------------------------------------------------
  // 1. Inisialisasi Sumber Media (HLS vs Native MP4)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const isHls =
      activeUrl.includes(".m3u8") ||
      activeMimeType?.includes("mpegURL") ||
      activeMimeType?.includes("hls");

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(activeUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          // Terapkan initial progress jika ada
          if (initialProgressSeconds > 0) {
            video.currentTime = initialProgressSeconds;
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setErrorMessage("Gangguan koneksi saat memuat aliran HLS. Silakan coba kembali.");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setErrorMessage("Kesalahan decoding stream HLS. Mencoba memulihkan...");
                hls.recoverMediaError();
                break;
              default:
                setErrorMessage("Sumber stream video tidak dapat diputar.");
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari Native HLS support
        video.src = activeUrl;
      } else {
        setErrorMessage("Browser Anda tidak mendukung pemutaran format streaming HLS.");
      }
    } else {
      // Standard MP4 / WebM
      video.src = activeUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [activeUrl, activeMimeType, initialProgressSeconds]);

  // ---------------------------------------------------------------------------
  // 2. Event Listener Lifecycle Video
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (initialProgressSeconds > 0 && initialProgressSeconds < video.duration) {
        video.currentTime = initialProgressSeconds;
      }
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);

      // Debounce sync setiap 10 detik pemutaran aktif
      if (Math.abs(current - lastSyncTimeRef.current) >= 10 && video.duration > 0) {
        syncProgress(current, video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      if (video.duration > 0) {
        syncProgress(video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (video.duration > 0) {
        // Tandai selesai (100%)
        syncProgress(video.duration, video.duration);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    const handleError = () => {
      setIsLoading(false);
      setErrorMessage("Gagal memuat berkas video. Pastikan jaringan stabil atau coba gunakan sampel legal.");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [initialProgressSeconds, syncProgress]);

  // ---------------------------------------------------------------------------
  // 3. Kontrol Playback (Play/Pause, Seek, Volume, Fullscreen)
  // ---------------------------------------------------------------------------
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => console.warn("Autoplay dicegah:", err));
    } else {
      video.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration || 0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    video.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Keyboard Shortcuts Accessibility
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika fokus pada input text atau textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSkip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSkip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(volume + 0.1, 1);
            setVolume(nextVol);
            videoRef.current.volume = nextVol;
            setIsMuted(false);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(volume - 0.1, 0);
            setVolume(nextVol);
            videoRef.current.volume = nextVol;
            setIsMuted(nextVol === 0);
          }
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ---------------------------------------------------------------------------
  // 5. Auto-Hide Controls Bar saat Idle
  // ---------------------------------------------------------------------------
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  const loadDemoSample = (index = 0) => {
    const sample = LEGAL_DEMO_ASSETS[index % LEGAL_DEMO_ASSETS.length];
    setActiveUrl(sample.videoUrl);
    setActiveMimeType(sample.mimeType);
    setActiveAttribution(sample.sourceAttribution);
    setIsDemoMode(true);
    setErrorMessage(null);
  };

  // ---------------------------------------------------------------------------
  // 6. RENDER: Empty State jika Sumber Video Belum Didaftarkan
  // ---------------------------------------------------------------------------
  if (!activeUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-[#292929] bg-[#121212] p-8 md:p-12 text-center text-[#F5F5F5] shadow-2xl">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9A52E]/30 bg-[#D9A52E]/10 text-[#D9A52E]">
            <ShieldCheck size={36} weight="duotone" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F5F5]">
              Aset Video Belum Tersedia
            </h3>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              Metadata &ldquo;{title}&rdquo; bersumber resmi dari katalog TMDB API.
              Sesuai hukum hak cipta digital, LayarRika tidak menyajikan stream ilegal atau bajakan.
              Konten komersial ini membutuhkan integrasi lisensi penyiaran resmi pada tabel database{" "}
              <code className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-xs text-[#D9A52E]">
                PlaybackAsset
              </code>.
            </p>
          </div>

          {/* Banner Opsi Pengujian Player Legal */}
          <div className="rounded-xl border border-[#292929] bg-[#171717] p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D9A52E] uppercase tracking-wider">
              <Sparkle size={16} weight="fill" />
              <span>Verifikasi Fitur Pemutar (Legal Creative Commons)</span>
            </div>
            <p className="text-xs text-[#737373] leading-relaxed">
              Anda dapat menguji kontrol pemutaran, HLS, seek, volume, resume playback, dan tampilan sinematik
              menggunakan film animasi berlisensi terbuka resmi dari Blender Foundation.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => loadDemoSample(0)}
                className="flex items-center gap-2 rounded-lg border border-[#D9A52E] bg-[#D9A52E] px-3.5 py-2 text-xs font-bold text-[#0A0A0A] transition hover:bg-[#c49226]"
              >
                <Play size={14} weight="fill" />
                <span>Putar Tears of Steel (HD)</span>
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample(1)}
                className="flex items-center gap-2 rounded-lg border border-[#292929] bg-[#212121] px-3.5 py-2 text-xs font-semibold text-[#F5F5F5] transition hover:border-[#D9A52E]"
              >
                <span>Big Buck Bunny</span>
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample(2)}
                className="flex items-center gap-2 rounded-lg border border-[#292929] bg-[#212121] px-3.5 py-2 text-xs font-semibold text-[#F5F5F5] transition hover:border-[#D9A52E]"
              >
                <span>Sintel</span>
              </button>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#737373] transition hover:text-[#F5F5F5]"
            >
              Tutup Pemutar
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 7. RENDER: Pemutar Video Sinematik Aktif
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-[#292929] bg-[#000000] shadow-2xl select-none"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        playsInline
        className="h-full w-full object-contain cursor-pointer"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs">
          <Spinner size={48} className="animate-spin text-[#D9A52E]" />
          <span className="mt-3 text-xs font-semibold tracking-wider text-[#A3A3A3]">
            Memuat aliran media...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-[#F5F5F5]">
          <Warning size={48} className="text-red-500 mb-3" />
          <h4 className="text-base font-bold">Gagal Memutar Media</h4>
          <p className="mt-1 max-w-md text-xs text-[#A3A3A3]">{errorMessage}</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="rounded-lg border border-[#D9A52E] bg-[#D9A52E] px-4 py-1.5 text-xs font-bold text-[#0A0A0A]"
            >
              Coba Ulang
            </button>
            <button
              type="button"
              onClick={() => loadDemoSample(0)}
              className="rounded-lg border border-[#292929] bg-[#171717] px-4 py-1.5 text-xs font-semibold text-[#F5F5F5]"
            >
              Ganti Sumber Legal
            </button>
          </div>
        </div>
      )}

      {/* Resume Playback Prompt Banner */}
      {showResumeBanner && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3 rounded-xl border border-[#D9A52E]/40 bg-[#171717]/90 px-4 py-2.5 text-xs text-[#F5F5F5] backdrop-blur-md shadow-xl animate-fade-in">
          <Clock size={18} className="text-[#D9A52E]" />
          <div>
            <span>Lanjutkan tontonan dari </span>
            <strong className="text-[#D9A52E]">{formatTime(initialProgressSeconds)}</strong>?
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = initialProgressSeconds;
                  videoRef.current.play().catch(() => {});
                }
                setShowResumeBanner(false);
              }}
              className="rounded bg-[#D9A52E] px-2.5 py-1 text-[11px] font-bold text-[#0A0A0A] transition hover:bg-[#c49226]"
            >
              Lanjutkan
            </button>
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                }
                setShowResumeBanner(false);
              }}
              className="rounded bg-[#292929] px-2.5 py-1 text-[11px] font-semibold text-[#A3A3A3] transition hover:text-[#F5F5F5]"
            >
              Ulangi
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar (Title, Atribusi, & Close Button) */}
      <div
        className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-[#F5F5F5] truncate max-w-md">
              {title}
            </h4>
            {seasonNumber && episodeNumber && (
              <span className="rounded bg-[#D9A52E]/20 px-2 py-0.5 text-[10px] font-bold text-[#D9A52E] border border-[#D9A52E]/30">
                S{seasonNumber} E{episodeNumber}
              </span>
            )}
            {isDemoMode && (
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Sampel Legal
              </span>
            )}
          </div>
          {episodeTitle && (
            <p className="text-xs text-[#A3A3A3]">{episodeTitle}</p>
          )}
          {activeAttribution && (
            <p className="text-[10px] text-[#737373]">{activeAttribution}</p>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pemutar"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#292929] bg-[#171717]/80 text-[#A3A3A3] backdrop-blur-sm transition hover:border-[#D9A52E] hover:text-[#F5F5F5]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Custom Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 space-y-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-8 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar / Scrubber */}
        <div className="relative group/scrubber flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Progress Tontonan"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#292929] accent-[#D9A52E] transition-all group-hover/scrubber:h-2.5 focus:outline-hidden"
            style={{
              background: `linear-gradient(to right, #D9A52E ${
                duration > 0 ? (currentTime / duration) * 100 : 0
              }%, #292929 ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
            }}
          />
        </div>

        {/* Buttons and Actions Bar */}
        <div className="flex items-center justify-between text-[#F5F5F5] pt-1">
          {/* Sisi Kiri: Play/Pause, Rewind, Fast Forward, Time */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Jeda" : "Putar"}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D9A52E] text-[#0A0A0A] transition hover:bg-[#c49226]"
            >
              {isPlaying ? (
                <Pause size={18} weight="fill" />
              ) : (
                <Play size={18} weight="fill" className="ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(-10)}
              title="Mundur 10 detik"
              className="text-[#A3A3A3] transition hover:text-[#F5F5F5]"
            >
              <ArrowCounterClockwise size={20} />
            </button>

            <button
              type="button"
              onClick={() => handleSkip(10)}
              title="Maju 10 detik"
              className="text-[#A3A3A3] transition hover:text-[#F5F5F5]"
            >
              <ArrowClockwise size={20} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume pl-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Aktifkan Suara" : "Bisukan"}
                className="text-[#A3A3A3] transition hover:text-[#F5F5F5]"
              >
                {isMuted || volume === 0 ? (
                  <SpeakerSlash size={20} />
                ) : volume < 0.5 ? (
                  <SpeakerLow size={20} />
                ) : (
                  <SpeakerHigh size={20} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="h-1 w-16 cursor-pointer appearance-none rounded-lg bg-[#292929] accent-[#D9A52E] transition focus:outline-hidden"
              />
            </div>

            {/* Time Display */}
            <span className="text-xs font-mono font-medium text-[#A3A3A3] pl-2">
              <span className="text-[#F5F5F5]">{formatTime(currentTime)}</span> / {formatTime(duration)}
            </span>
          </div>

          {/* Sisi Kanan: Playback Speed, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Playback Rate Selector */}
            <div className="flex items-center gap-1 rounded-lg border border-[#292929] bg-[#171717] px-2 py-1 text-xs">
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition ${
                    playbackRate === rate
                      ? "bg-[#D9A52E] text-[#0A0A0A]"
                      : "text-[#A3A3A3] hover:text-[#F5F5F5]"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              className="text-[#A3A3A3] transition hover:text-[#D9A52E]"
            >
              {isFullscreen ? <CornersIn size={22} /> : <CornersOut size={22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
