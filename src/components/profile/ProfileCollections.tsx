"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTmdbPosterUrl } from "@/lib/tmdb/images";
import { removeWatchlistByIdAction } from "@/app/actions/watchlist";
import {
  deleteWatchHistoryAction,
  clearWatchHistoryAction,
} from "@/app/actions/history";
import {
  Bookmark,
  ClockCounterClockwise,
  Play,
  Trash,
  FilmReel,
  Star,
  MagnifyingGlass,
  CheckCircle,
  SpinnerGap,
  Sparkle,
} from "@phosphor-icons/react";

export interface WatchlistCardItem {
  id: string;
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  rating?: number | null;
  releaseYear?: number | null;
  createdAt: Date | string;
}

export interface WatchHistoryCardItem {
  id: string;
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  progressSeconds: number;
  durationSeconds?: number | null;
  completed: boolean;
  lastWatchedAt: Date | string;
}

interface ProfileCollectionsProps {
  initialWatchlist: WatchlistCardItem[];
  initialHistory: WatchHistoryCardItem[];
}

export function ProfileCollections({
  initialWatchlist,
  initialHistory,
}: ProfileCollectionsProps) {
  const [activeTab, setActiveTab] = useState<"watchlist" | "history" | "resume">("watchlist");
  const [watchlist, setWatchlist] = useState<WatchlistCardItem[]>(initialWatchlist);
  const [history, setHistory] = useState<WatchHistoryCardItem[]>(initialHistory);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter resume playback (konten yang belum selesai dan sudah ditonton > 0 detik)
  const resumeItems = history.filter(
    (item) => !item.completed && item.progressSeconds > 0
  );

  // Hapus satu item dari watchlist
  const handleRemoveWatchlist = async (id: string, title: string) => {
    setLoadingId(id);
    const result = await removeWatchlistByIdAction(id);
    if (result.success) {
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
      setFeedback(`"${title}" dihapus dari watchlist.`);
      setTimeout(() => setFeedback(null), 3000);
    }
    setLoadingId(null);
  };

  // Hapus satu item dari riwayat tontonan
  const handleRemoveHistory = async (id: string, title: string) => {
    setLoadingId(id);
    const result = await deleteWatchHistoryAction(id);
    if (result.success) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setFeedback(`Riwayat tontonan "${title}" dihapus.`);
      setTimeout(() => setFeedback(null), 3000);
    }
    setLoadingId(null);
  };

  // Bersihkan seluruh riwayat tontonan
  const handleClearHistory = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh riwayat tontonan?")) return;

    setIsClearingHistory(true);
    const result = await clearWatchHistoryAction();
    if (result.success) {
      setHistory([]);
      setFeedback("Seluruh riwayat tontonan telah dibersihkan.");
      setTimeout(() => setFeedback(null), 3000);
    }
    setIsClearingHistory(false);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-[#D9A52E]/40 bg-[#171717] px-4 py-2.5 text-xs text-[#D9A52E] shadow-md animate-fade-in">
          <Sparkle size={16} weight="fill" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#292929] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Watchlist */}
          <button
            type="button"
            onClick={() => setActiveTab("watchlist")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "watchlist"
                ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md"
                : "bg-[#171717] text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F5F5F5] border border-[#292929]"
            }`}
          >
            <Bookmark size={16} weight={activeTab === "watchlist" ? "fill" : "regular"} />
            <span>Watchlist</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "watchlist"
                  ? "bg-[#0A0A0A]/20 text-[#0A0A0A]"
                  : "bg-[#292929] text-[#A3A3A3]"
              }`}
            >
              {watchlist.length}
            </span>
          </button>

          {/* Tab 2: Lanjutkan Menonton */}
          <button
            type="button"
            onClick={() => setActiveTab("resume")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "resume"
                ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md"
                : "bg-[#171717] text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F5F5F5] border border-[#292929]"
            }`}
          >
            <Play size={16} weight={activeTab === "resume" ? "fill" : "regular"} />
            <span>Lanjutkan Menonton</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "resume"
                  ? "bg-[#0A0A0A]/20 text-[#0A0A0A]"
                  : "bg-[#292929] text-[#A3A3A3]"
              }`}
            >
              {resumeItems.length}
            </span>
          </button>

          {/* Tab 3: Riwayat Tontonan */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "history"
                ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md"
                : "bg-[#171717] text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F5F5F5] border border-[#292929]"
            }`}
          >
            <ClockCounterClockwise size={16} weight={activeTab === "history" ? "bold" : "regular"} />
            <span>Semua Riwayat</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "history"
                  ? "bg-[#0A0A0A]/20 text-[#0A0A0A]"
                  : "bg-[#292929] text-[#A3A3A3]"
              }`}
            >
              {history.length}
            </span>
          </button>
        </div>

        {/* Clear History Button (Khusus Tab Riwayat) */}
        {activeTab === "history" && history.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={isClearingHistory}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-900/40 transition"
          >
            {isClearingHistory ? (
              <SpinnerGap size={14} className="animate-spin text-red-300" />
            ) : (
              <Trash size={14} />
            )}
            <span>Bersihkan Riwayat</span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: WATCHLIST CONTENT */}
      {/* ===================================================================== */}
      {activeTab === "watchlist" && (
        <div>
          {watchlist.length === 0 ? (
            <div className="rounded-2xl border border-[#292929] bg-[#171717] p-10 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0A0A] border border-[#D9A52E]/30 text-[#D9A52E]">
                <Bookmark size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F5F5F5]">Watchlist Anda Masih Kosong</h3>
                <p className="text-xs text-[#A3A3A3] max-w-md mx-auto">
                  Belum ada film atau serial yang Anda simpan. Buka katalog LayarRika dan klik &ldquo;Simpan ke Watchlist&rdquo; pada konten favorit Anda.
                </p>
              </div>
              <Link
                href="/#movies"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#c49226] transition shadow-md"
              >
                <MagnifyingGlass size={16} weight="bold" />
                <span>Eksplorasi Katalog Film</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watchlist.map((item) => {
                const posterUrl = getTmdbPosterUrl(item.posterPath || null, "w342");
                const detailUrl =
                  item.mediaType === "MOVIE" ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;

                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-[#292929] bg-[#171717] overflow-hidden shadow-md transition hover:border-[#D9A52E]/50 flex flex-col justify-between"
                  >
                    {/* Poster */}
                    <Link href={detailUrl} className="block relative aspect-[2/3] bg-[#0A0A0A] overflow-hidden">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={item.title}
                          fill
                          sizes="200px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#525252]">
                          <FilmReel size={32} />
                        </div>
                      )}

                      {/* Type Badge */}
                      <span className="absolute top-2 left-2 rounded bg-[#0A0A0A]/80 px-2 py-0.5 text-[10px] font-bold text-[#D9A52E] border border-[#D9A52E]/30 backdrop-blur-md">
                        {item.mediaType === "MOVIE" ? "FILM" : "SERIAL"}
                      </span>

                      {/* Rating Badge */}
                      {typeof item.rating === "number" && item.rating > 0 && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 rounded bg-[#0A0A0A]/80 px-2 py-0.5 text-[10px] font-bold text-[#F5F5F5] border border-[#292929] backdrop-blur-md">
                          <Star size={11} weight="fill" className="text-[#D9A52E]" />
                          <span>{item.rating.toFixed(1)}</span>
                        </span>
                      )}
                    </Link>

                    {/* Metadata & Actions */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={detailUrl} className="block group-hover:text-[#D9A52E] transition">
                          <h4 className="text-xs font-bold text-[#F5F5F5] truncate" title={item.title}>
                            {item.title}
                          </h4>
                        </Link>
                        {item.releaseYear && (
                          <p className="text-[10px] text-[#737373]">{item.releaseYear}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#292929]/60">
                        <Link
                          href={detailUrl}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#242424] py-1 text-[11px] font-semibold text-[#F5F5F5] hover:bg-[#D9A52E] hover:text-[#0A0A0A] transition"
                        >
                          <Play size={12} weight="fill" />
                          <span>Lihat</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveWatchlist(item.id, item.title)}
                          disabled={loadingId === item.id}
                          title="Hapus dari watchlist"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#292929] bg-[#171717] text-[#A3A3A3] hover:text-red-400 hover:border-red-500/40 transition"
                        >
                          {loadingId === item.id ? (
                            <SpinnerGap size={13} className="animate-spin text-red-400" />
                          ) : (
                            <Trash size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: RESUME PLAYBACK CONTENT */}
      {/* ===================================================================== */}
      {activeTab === "resume" && (
        <div>
          {resumeItems.length === 0 ? (
            <div className="rounded-2xl border border-[#292929] bg-[#171717] p-10 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0A0A] border border-[#D9A52E]/30 text-[#D9A52E]">
                <Play size={28} weight="fill" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F5F5F5]">Tidak Ada Tontonan Tertunda</h3>
                <p className="text-xs text-[#A3A3A3] max-w-md mx-auto">
                  Semua konten yang Anda tonton telah selesai atau Anda belum memulai memutar film baru.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#c49226] transition shadow-md"
              >
                <span>Mulai Menonton Sekarang</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {resumeItems.map((item) => {
                const posterUrl = getTmdbPosterUrl(item.posterPath || null, "w342");
                const detailUrl =
                  item.mediaType === "MOVIE" ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;

                let percent = 0;
                if (item.durationSeconds && item.durationSeconds > 0) {
                  percent = Math.min(
                    100,
                    Math.round((item.progressSeconds / item.durationSeconds) * 100)
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="group rounded-xl border border-[#292929] bg-[#171717] p-3 shadow-md space-y-3 hover:border-[#D9A52E]/50 transition"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-20 w-14 shrink-0 rounded-lg overflow-hidden bg-[#0A0A0A]">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={item.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#525252]">
                            <FilmReel size={20} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1 overflow-hidden">
                        <Link href={detailUrl} className="block group-hover:text-[#D9A52E] transition">
                          <h4 className="text-xs font-bold text-[#F5F5F5] truncate" title={item.title}>
                            {item.title}
                          </h4>
                        </Link>
                        <p className="text-[10px] text-[#D9A52E] font-semibold">
                          {item.mediaType === "MOVIE"
                            ? "Film"
                            : item.seasonNumber && item.episodeNumber
                            ? `Season ${item.seasonNumber} • Episode ${item.episodeNumber}`
                            : "Serial TV"}
                        </p>
                        <p className="text-[10px] text-[#A3A3A3]">
                          {Math.floor(item.progressSeconds / 60)} menit ditonton
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-[#292929] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D9A52E] transition-all"
                          style={{ width: `${Math.max(5, percent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#737373]">
                        <span>Progres</span>
                        <span className="font-semibold text-[#D9A52E]">{percent}%</span>
                      </div>
                    </div>

                    {/* CTA Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#292929]">
                      <Link
                        href={detailUrl}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#D9A52E] py-1.5 text-xs font-bold text-[#0A0A0A] hover:bg-[#c49226] transition"
                      >
                        <Play size={13} weight="fill" />
                        <span>Lanjutkan</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveHistory(item.id, item.title)}
                        disabled={loadingId === item.id}
                        title="Hapus dari daftar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#292929] bg-[#171717] text-[#A3A3A3] hover:text-red-400 hover:border-red-500/40 transition"
                      >
                        {loadingId === item.id ? (
                          <SpinnerGap size={14} className="animate-spin text-red-400" />
                        ) : (
                          <Trash size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ALL WATCH HISTORY CONTENT */}
      {/* ===================================================================== */}
      {activeTab === "history" && (
        <div>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-[#292929] bg-[#171717] p-10 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0A0A] border border-[#D9A52E]/30 text-[#D9A52E]">
                <ClockCounterClockwise size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F5F5F5]">Belum Ada Riwayat Tontonan</h3>
                <p className="text-xs text-[#A3A3A3] max-w-md mx-auto">
                  Riwayat tontonan dan pencatatan progres detik tonton Anda akan otomatis disimpan saat Anda mulai menonton film atau serial di LayarRika.
                </p>
              </div>
              <Link
                href="/#movies"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#c49226] transition shadow-md"
              >
                <span>Mulai Jelajah Konten</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const posterUrl = getTmdbPosterUrl(item.posterPath || null, "w185");
                const detailUrl =
                  item.mediaType === "MOVIE" ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;

                let percent = 0;
                if (item.durationSeconds && item.durationSeconds > 0) {
                  percent = Math.min(
                    100,
                    Math.round((item.progressSeconds / item.durationSeconds) * 100)
                  );
                }

                const watchedDate = new Date(item.lastWatchedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#292929] bg-[#171717] p-3 hover:border-[#D9A52E]/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-10 shrink-0 rounded-lg overflow-hidden bg-[#0A0A0A]">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={item.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#525252]">
                            <FilmReel size={18} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Link href={detailUrl} className="hover:text-[#D9A52E] transition font-bold text-xs sm:text-sm text-[#F5F5F5]">
                          {item.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#A3A3A3]">
                          <span className="font-semibold text-[#D9A52E]">
                            {item.mediaType === "MOVIE"
                              ? "Film"
                              : item.seasonNumber && item.episodeNumber
                              ? `S${item.seasonNumber}:E${item.episodeNumber}`
                              : "Serial"}
                          </span>
                          <span>•</span>
                          <span>{Math.floor(item.progressSeconds / 60)} menit</span>
                          <span>•</span>
                          <span>{watchedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {item.completed ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle size={12} weight="fill" />
                          <span>Selesai</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#D9A52E]/15 border border-[#D9A52E]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#D9A52E]">
                          {percent > 0 ? `${percent}% Selesai` : "Ditonton"}
                        </span>
                      )}

                      <Link
                        href={detailUrl}
                        className="flex items-center gap-1 rounded-lg bg-[#242424] px-3 py-1.5 text-xs font-semibold text-[#F5F5F5] hover:bg-[#D9A52E] hover:text-[#0A0A0A] transition"
                      >
                        <Play size={12} weight="fill" />
                        <span>Tonton</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleRemoveHistory(item.id, item.title)}
                        disabled={loadingId === item.id}
                        title="Hapus riwayat ini"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#292929] bg-[#171717] text-[#737373] hover:text-red-400 hover:border-red-500/40 transition"
                      >
                        {loadingId === item.id ? (
                          <SpinnerGap size={12} className="animate-spin text-red-400" />
                        ) : (
                          <Trash size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
