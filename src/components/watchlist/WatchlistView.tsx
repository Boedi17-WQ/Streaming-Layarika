"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, FilmReel, Television, Trash, Star, Play, Sparkle } from "@phosphor-icons/react";
import { removeFromWatchlistAction } from "@/app/actions/watchlist";

export interface WatchlistItemData {
  id: string;
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath: string | null;
  rating: number | null;
  releaseYear: number | null;
  createdAt: Date | string;
}

interface WatchlistViewProps {
  initialItems: WatchlistItemData[];
}

export function WatchlistView({ initialItems }: WatchlistViewProps) {
  const [items, setItems] = useState<WatchlistItemData[]>(initialItems);
  const [filterType, setFilterType] = useState<"ALL" | "MOVIE" | "TV">("ALL");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredItems = items.filter((item) => {
    if (filterType === "ALL") return true;
    return item.mediaType === filterType;
  });

  const handleRemove = (tmdbId: number, mediaType: "MOVIE" | "TV") => {
    setDeletingId(tmdbId);
    startTransition(async () => {
      const res = await removeFromWatchlistAction(tmdbId, mediaType);
      if (res.success) {
        setItems((prev) => prev.filter((i) => !(i.tmdbId === tmdbId && i.mediaType === mediaType)));
      }
      setDeletingId(null);
    });
  };

  const movieCount = items.filter((i) => i.mediaType === "MOVIE").length;
  const tvCount = items.filter((i) => i.mediaType === "TV").length;

  return (
    <div className="space-y-8">
      {/* 1. Bar Tab Filter Kategori Watchlist */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#292929] bg-[#0A0A0A] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === "ALL"
                  ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md font-bold"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              <Sparkle size={14} weight={filterType === "ALL" ? "fill" : "regular"} />
              <span>Semua ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("MOVIE")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === "MOVIE"
                  ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md font-bold"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              <FilmReel size={14} weight={filterType === "MOVIE" ? "fill" : "regular"} />
              <span>Film ({movieCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("TV")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === "TV"
                  ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md font-bold"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              <Television size={14} weight={filterType === "TV" ? "fill" : "regular"} />
              <span>Serial ({tvCount})</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-[#737373]">
          Tersimpan permanen di Neon PostgreSQL
        </div>
      </div>

      {/* 2. Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#292929] bg-[#121212]/50 p-12 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171717] border border-[#292929] text-[#737373]">
            <Bookmark size={32} />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-lg font-bold text-[#F5F5F5]">Watchlist Masih Kosong</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              {filterType === "ALL"
                ? "Anda belum menyimpan film atau serial ke dalam daftar tontonan pribadi."
                : `Belum ada ${filterType === "MOVIE" ? "film" : "serial TV"} yang disimpan di daftar ini.`}
            </p>
          </div>
          <Link
            href="/catalog"
            className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-5 py-2 text-xs font-bold text-[#0A0A0A] transition hover:bg-[#c49226]"
          >
            <FilmReel size={16} />
            <span>Jelajahi Katalog</span>
          </Link>
        </div>
      )}

      {/* 3. Grid Kartu Watchlist */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {filteredItems.map((item) => {
            const isMovie = item.mediaType === "MOVIE";
            const detailHref = isMovie ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;
            const posterSrc = item.posterPath
              ? item.posterPath.startsWith("http")
                ? item.posterPath
                : `https://image.tmdb.org/t/p/w500${item.posterPath}`
              : null;
            const isDeleting = deletingId === item.tmdbId && isPending;

            return (
              <div
                key={`watchlist-${item.mediaType}-${item.tmdbId}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-[#292929] bg-[#171717] transition-all duration-300 hover:-translate-y-1 hover:border-[#D9A52E]/60 shadow-lg"
              >
                {/* Poster 2:3 */}
                <Link href={detailHref} className="relative aspect-[2/3] w-full overflow-hidden bg-[#0A0A0A]">
                  {posterSrc ? (
                    <Image
                      src={posterSrc}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] text-[#737373]">
                      <FilmReel size={32} />
                    </div>
                  )}

                  {/* Rating Badge */}
                  {item.rating && item.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-[#F5F5F5] border border-[#292929] backdrop-blur-xs">
                      <Star size={11} weight="fill" className="text-[#D9A52E]" />
                      <span>{item.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Media Type Badge */}
                  <div className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-semibold text-[#A3A3A3] border border-[#292929] uppercase">
                    {isMovie ? "Film" : "Serial"}
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9A52E] text-[#0A0A0A] shadow-xl">
                      <Play size={16} weight="fill" className="ml-0.5" />
                    </div>
                  </div>
                </Link>

                {/* Info Bar & Remove Button */}
                <div className="flex flex-1 flex-col justify-between p-3 space-y-2">
                  <Link href={detailHref}>
                    <h4 className="line-clamp-1 text-xs sm:text-sm font-semibold text-[#F5F5F5] hover:text-[#D9A52E] transition">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      {item.releaseYear || "—"}
                    </p>
                  </Link>

                  <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.tmdbId, item.mediaType)}
                      disabled={isDeleting}
                      title="Hapus dari Watchlist"
                      className="flex items-center gap-1 text-[11px] text-[#A3A3A3] hover:text-red-400 transition font-medium disabled:opacity-50"
                    >
                      <Trash size={13} />
                      <span>Hapus</span>
                    </button>
                    <Link
                      href={detailHref}
                      className="text-[11px] font-semibold text-[#D9A52E] hover:underline"
                    >
                      Detail &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
