"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MagnifyingGlass,
  X,
  Trash,
  ClockCounterClockwise,
  Star,
  FilmReel,
  Television,
  SpinnerGap,
  ArrowRight,
  Play,
} from "@phosphor-icons/react";
import { Movie } from "@/types/movie";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "layarrika_search_history";

// Daftar Pencarian Populer (disesuaikan dengan tren dan referensi streaming app)
const POPULAR_SEARCHES = [
  "The Lament of Autumn",
  "The Best Thing",
  "How Dare You!?",
  "Small Town Remedy",
  "Black Clover Season 2",
  "Love Between Lines",
  "Only For Love",
  "Pursuit of Jade",
];

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 8);
        }
      }
    } catch {
      // Fallback diam
    }
    return [];
  });
  const [liveResults, setLiveResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const trimmedQuery = query.trim();

  // Kunci scroll halaman utama & fokus otomatis saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      // Beri sedikit jeda agar elemen ter-render sebelum auto-focus
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timeout);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Simpan kata kunci ke riwayat pencarian
  const saveToHistory = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Gagal menyimpan riwayat:", err);
      }
      return updated;
    });
  }, []);

  // Hapus semua riwayat
  const handleClearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Gagal menghapus riwayat:", err);
    }
  };

  // Hapus satu item riwayat tertentu
  const handleDeleteHistoryItem = (e: React.MouseEvent, itemToDelete: string) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToDelete);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Gagal menghapus item riwayat:", err);
      }
      return updated;
    });
  };

  // Eksekusi pencarian ke halaman katalog
  const executeSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    saveToHistory(trimmed);
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  // Navigasi langsung ke detail film saat hasil diklik
  const handleSelectMovie = (movie: Movie) => {
    saveToHistory(movie.title);
    onClose();
    const href = movie.mediaType === "movie" ? `/movie/${movie.id}` : `/tv/${movie.id}`;
    router.push(href);
  };

  // Handle submit form pencarian
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  // Live Instant Search dengan debounce 250ms
  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    let isMounted = true;
    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/catalog?q=${encodeURIComponent(trimmedQuery)}&type=all`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const items: Movie[] = data.allResults || [];
          setLiveResults(items.slice(0, 6));
        }
      } catch (err) {
        console.error("Gagal melakukan pencarian instan:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(handler);
    };
  }, [trimmedQuery]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-2xl shadow-black/90 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* 1. Bar Input Pencarian di Bagian Atas */}
        <div className="p-3 sm:p-4 border-b border-[#222222] bg-[#161616]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex flex-1 items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari judul film atau serial..."
                className="w-full rounded-xl bg-[#202020] border border-white/10 pl-3.5 pr-10 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E] transition-all"
              />

              {/* Ikon Aksi di dalam Input: Clear (✕) atau Search (🔍) */}
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Bersihkan teks"
                    className="p-1 text-[#888] hover:text-[#fff] transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                ) : null}

                <button
                  type="submit"
                  aria-label="Cari"
                  className="p-1 text-[#A3A3A3] hover:text-[#D9A52E] transition cursor-pointer"
                >
                  <MagnifyingGlass size={17} weight="bold" />
                </button>
              </div>
            </div>

            {/* Tombol Tutup / Batal */}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 px-2.5 py-2 text-xs font-semibold text-[#A3A3A3] hover:text-[#F5F5F5] transition cursor-pointer"
            >
              Batal
            </button>
          </form>
        </div>

        {/* 2. Area Konten: Riwayat & Pencarian Populer (ketika query kosong) atau Hasil Langsung */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-none">
          {query.trim().length === 0 ? (
            <>
              {/* Bagian A: Search History (Riwayat Pencarian) */}
              {history.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#8A8A8A] uppercase flex items-center gap-1.5">
                      <ClockCounterClockwise size={13} weight="bold" />
                      <span>Search History</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      title="Hapus semua riwayat"
                      className="p-1 text-[#737373] hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash size={15} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {history.map((item) => (
                      <div
                        key={item}
                        onClick={() => executeSearch(item)}
                        className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#D4D4D4] hover:bg-white/5 hover:text-[#F5F5F5] cursor-pointer transition"
                      >
                        <span className="truncate pr-2">{item}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(e, item)}
                          title="Hapus kata kunci ini"
                          className="opacity-60 hover:opacity-100 p-1 text-[#737373] hover:text-red-400 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bagian B: Popular Searches (Pencarian Populer) */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold tracking-wider text-[#8A8A8A] uppercase">
                  Popular Searches
                </span>

                <div className="space-y-0.5">
                  {POPULAR_SEARCHES.map((title, idx) => {
                    const rank = idx + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <div
                        key={title}
                        onClick={() => executeSearch(title)}
                        className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-white/5 cursor-pointer transition"
                      >
                        {/* Nomor Ranking: 1, 2, 3 Hijau Terang seperti iQIYI */}
                        <span
                          className={`w-4 text-center text-sm font-extrabold shrink-0 ${
                            isTopThree ? "text-emerald-400" : "text-[#737373]"
                          }`}
                        >
                          {rank}
                        </span>

                        <span className="truncate text-sm font-medium text-[#E5E5E5] group-hover:text-[#D9A52E] transition">
                          {title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Bagian C: Hasil Pencarian Langsung (Live Instant Search) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[#8A8A8A] uppercase">
                  Hasil Terkait &quot;{query}&quot;
                </span>
                {isLoading && (
                  <SpinnerGap size={15} className="animate-spin text-[#D9A52E]" />
                )}
              </div>

              {isLoading && liveResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#737373] flex flex-col items-center gap-2">
                  <SpinnerGap size={24} className="animate-spin text-[#D9A52E]" />
                  <span>Mencari film & serial...</span>
                </div>
              ) : liveResults.length > 0 ? (
                <div className="space-y-2">
                  {liveResults.map((movie) => {
                    const isMovie = movie.mediaType === "movie";

                    return (
                      <div
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        className="group flex items-center justify-between gap-3 rounded-xl p-2.5 hover:bg-white/5 cursor-pointer transition border border-transparent hover:border-emerald-500/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Poster Thumbnail dengan Badge Free */}
                          <div className="relative aspect-[2/3] w-12 sm:w-14 shrink-0 overflow-hidden rounded-lg bg-[#222]">
                            {movie.posterPath ? (
                              <Image
                                src={movie.posterPath}
                                alt={movie.title}
                                fill
                                unoptimized
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#555]">
                                {isMovie ? <FilmReel size={18} /> : <Television size={18} />}
                              </div>
                            )}
                            <span className="absolute top-1 right-1 rounded-xs bg-emerald-500 px-1 py-0.2 text-[8px] font-black uppercase text-black">
                              Free
                            </span>
                          </div>

                          {/* Info Judul & Metadata */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                              {isMovie ? "Movie" : "Drama"}
                            </span>
                            <h4 className="truncate text-sm sm:text-base font-bold text-emerald-400 group-hover:text-emerald-300 transition">
                              {movie.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[#737373] mt-0.5">
                              <span>Year: {movie.releaseYear || "—"}</span>
                              {movie.genres && movie.genres.length > 0 && (
                                <span className="truncate max-w-[120px]">• {movie.genres[0]}</span>
                              )}
                              {movie.rating > 0 && (
                                <span className="flex items-center gap-0.5 font-semibold text-[#D9A52E]">
                                  <Star size={11} weight="fill" />
                                  <span>{movie.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tombol Watch Now */}
                        <div className="shrink-0 pl-1">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black shadow-xs transition group-hover:bg-emerald-400">
                            <Play size={11} weight="fill" />
                            <span>Watch</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tombol Lihat Seluruh Hasil */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => executeSearch(query)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D9A52E]/10 border border-[#D9A52E]/30 px-4 py-2.5 text-xs font-bold text-[#D9A52E] hover:bg-[#D9A52E]/20 transition cursor-pointer"
                    >
                      <MagnifyingGlass size={14} weight="bold" />
                      <span>Lihat Semua Hasil untuk &quot;{query}&quot;</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#737373] space-y-2">
                  <p>Tidak ada film atau serial yang cocok dengan &quot;{query}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => executeSearch(query)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D9A52E] hover:underline cursor-pointer"
                  >
                    <span>Cari di seluruh katalog</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

