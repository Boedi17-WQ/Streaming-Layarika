"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { getTmdbPosterUrl } from "@/lib/tmdb/images";
import { deleteWatchHistoryAction } from "@/app/actions/history";
import {
  Play,
  FilmReel,
  Television,
  ClockAfternoon,
  X,
  SpinnerGap,
} from "@phosphor-icons/react";

export interface ResumePlaybackItem {
  id: string;
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  progressSeconds: number;
  durationSeconds?: number | null;
  lastWatchedAt: Date | string;
}

interface ResumePlaybackClientProps {
  initialItems: ResumePlaybackItem[];
}

export function ResumePlaybackClient({ initialItems }: ResumePlaybackClientProps) {
  const [items, setItems] = useState<ResumePlaybackItem[]>(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!items || items.length === 0) return null;

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setRemovingId(id);
    const result = await deleteWatchHistoryAction(id);
    if (result.success) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
    setRemovingId(null);
  };

  return (
    <section className="border-b border-[#292929] bg-[#0F0F0F]/80 py-8 backdrop-blur-sm">
      <Container>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E]">
              <ClockAfternoon size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#F5F5F5] flex items-center gap-2">
                Lanjutkan Menonton
              </h2>
              <p className="text-xs text-[#A3A3A3]">
                Lanjutkan tontonan dari posisi terakhir Anda
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#D9A52E]">
            {items.length} konten tersimpan
          </span>
        </div>

        {/* Horizontal Carousel Cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
          {items.map((item) => {
            const posterUrl = getTmdbPosterUrl(item.posterPath || null, "w342");
            const detailUrl =
              item.mediaType === "MOVIE" ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;

            // Hitung persentase progres jika durasi valid
            let percent = 0;
            if (item.durationSeconds && item.durationSeconds > 0) {
              percent = Math.min(
                100,
                Math.round((item.progressSeconds / item.durationSeconds) * 100)
              );
            }

            const formattedProgress =
              item.durationSeconds && item.durationSeconds > 0
                ? `${Math.floor(item.progressSeconds / 60)} / ${Math.floor(
                    item.durationSeconds / 60
                  )} menit`
                : `${Math.floor(item.progressSeconds / 60)} menit ditonton`;

            return (
              <div
                key={item.id}
                className="group relative flex-none w-[220px] sm:w-[260px] snap-start rounded-xl border border-[#292929] bg-[#171717] overflow-hidden shadow-lg transition-all duration-200 hover:border-[#D9A52E]/60 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Poster & Play Action Overlay */}
                <Link href={detailUrl} className="block relative aspect-[16/10] bg-[#1F1F1F] overflow-hidden">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      sizes="260px"
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#525252]">
                      <FilmReel size={36} />
                    </div>
                  )}

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-black/30" />

                  {/* Play Button Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D9A52E] text-[#0A0A0A] shadow-lg transform transition-transform group-hover:scale-110">
                      <Play size={20} weight="fill" className="ml-0.5" />
                    </div>
                  </div>

                  {/* Media Type & Episode Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded bg-[#0A0A0A]/80 px-2 py-0.5 text-[10px] font-bold text-[#D9A52E] border border-[#D9A52E]/30 backdrop-blur-md">
                      {item.mediaType === "MOVIE" ? (
                        <>
                          <FilmReel size={12} />
                          <span>FILM</span>
                        </>
                      ) : (
                        <>
                          <Television size={12} />
                          <span>
                            {item.seasonNumber && item.episodeNumber
                              ? `S${item.seasonNumber}:E${item.episodeNumber}`
                              : "SERIAL"}
                          </span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDismiss(e, item.id)}
                    title="Hapus dari daftar lanjutkan menonton"
                    disabled={removingId === item.id}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[#A3A3A3] hover:text-red-400 hover:bg-black/90 transition backdrop-blur-sm"
                  >
                    {removingId === item.id ? (
                      <SpinnerGap size={12} className="animate-spin text-red-400" />
                    ) : (
                      <X size={12} />
                    )}
                  </button>

                  {/* Progress Bar Overlay di Bagian Bawah Gambar */}
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#292929]">
                    <div
                      className="h-full bg-[#D9A52E] transition-all duration-300"
                      style={{ width: `${Math.max(5, percent)}%` }}
                    />
                  </div>
                </Link>

                {/* Content Metadata */}
                <div className="p-3.5 space-y-1">
                  <Link href={detailUrl} className="block group-hover:text-[#D9A52E] transition">
                    <h3 className="text-sm font-bold text-[#F5F5F5] truncate" title={item.title}>
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                    <span>{formattedProgress}</span>
                    {percent > 0 && (
                      <span className="font-semibold text-[#D9A52E]">{percent}%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
