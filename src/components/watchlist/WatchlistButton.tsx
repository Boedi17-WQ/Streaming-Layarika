"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWatchlistAction } from "@/app/actions/watchlist";
import { Bookmark, SpinnerGap, Check, X } from "@phosphor-icons/react";

interface WatchlistButtonProps {
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  rating?: number | null;
  releaseYear?: number | null;
  initialInWatchlist?: boolean;
  className?: string;
}

export function WatchlistButton({
  tmdbId,
  mediaType,
  title,
  posterPath,
  rating,
  releaseYear,
  initialInWatchlist = false,
  className = "",
}: WatchlistButtonProps) {
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    setFeedback(null);

    startTransition(async () => {
      const result = await toggleWatchlistAction({
        tmdbId,
        mediaType,
        title,
        posterPath,
        rating,
        releaseYear,
      });

      if (result.unauthenticated) {
        // Arahkan pengguna ke halaman login dengan callback URL kembali ke halaman ini
        const currentPath = mediaType === "MOVIE" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (result.success && typeof result.inWatchlist === "boolean") {
        setInWatchlist(result.inWatchlist);
        setFeedback({
          message: result.inWatchlist
            ? "Tersimpan di Watchlist"
            : "Dihapus dari Watchlist",
        });

        // Hilangkan notifikasi feedback otomatis setelah 3 detik
        setTimeout(() => {
          setFeedback(null);
        }, 3000);
      } else if (result.error) {
        setFeedback({ message: result.error, isError: true });
        setTimeout(() => {
          setFeedback(null);
        }, 4000);
      }
    });
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        title={inWatchlist ? "Klik untuk menghapus dari Watchlist" : "Simpan ke Watchlist"}
        className={`group relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
          inWatchlist
            ? "border border-[#D9A52E] bg-[#D9A52E]/15 text-[#D9A52E] shadow-sm hover:border-red-500/50 hover:bg-red-950/20 hover:text-red-300"
            : "border border-[#292929] bg-[#171717] text-[#F5F5F5] hover:border-[#D9A52E] hover:bg-[#202020]"
        } ${className}`}
      >
        {isPending ? (
          <>
            <SpinnerGap size={18} className="animate-spin text-[#D9A52E]" />
            <span>Memproses...</span>
          </>
        ) : inWatchlist ? (
          <>
            <Bookmark size={18} weight="fill" className="text-[#D9A52E] group-hover:text-red-400" />
            <span className="group-hover:hidden">Tersimpan di Watchlist</span>
            <span className="hidden group-hover:inline">Hapus dari Watchlist</span>
          </>
        ) : (
          <>
            <Bookmark size={18} className="text-[#A3A3A3] transition group-hover:text-[#D9A52E]" />
            <span>Simpan ke Watchlist</span>
          </>
        )}
      </button>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`absolute left-0 top-full mt-2 z-30 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-lg backdrop-blur-md transition-all ${
            feedback.isError
              ? "border-red-500/40 bg-red-950/90 text-red-200"
              : "border-[#D9A52E]/40 bg-[#171717]/95 text-[#D9A52E]"
          }`}
        >
          {feedback.isError ? (
            <X size={14} className="shrink-0 text-red-400" />
          ) : (
            <Check size={14} weight="bold" className="shrink-0 text-[#D9A52E]" />
          )}
          <span className="whitespace-nowrap font-medium">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
