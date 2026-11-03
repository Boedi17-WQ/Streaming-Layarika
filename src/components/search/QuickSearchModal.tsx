"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MagnifyingGlass,
  X,
  Trash,
  ClockCounterClockwise,
  SpinnerGap,
} from "@phosphor-icons/react";
import { Movie } from "@/types/movie";
import { SearchResultListItem } from "./SearchResultListItem";

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

  // Eksekusi pencarian ke daftar film langsung
  const executeSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    saveToHistory(trimmed);
    setQuery(trimmed);
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
          setLiveResults(items);
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-2xl shadow-black/90 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
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
            /* Bagian C: Hasil Pencarian Langsung Lengkap Real-Time */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-xs font-bold tracking-wider text-[#8A8A8A] uppercase">
                  Hasil Pencarian &quot;{query}&quot; {liveResults.length > 0 && `(${liveResults.length} judul)`}
                </span>
                {isLoading && (
                  <SpinnerGap size={15} className="animate-spin text-[#D9A52E]" />
                )}
              </div>

              {isLoading && liveResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#737373] flex flex-col items-center gap-2">
                  <SpinnerGap size={24} className="animate-spin text-[#D9A52E]" />
                  <span>Mencari film & serial dari katalog...</span>
                </div>
              ) : liveResults.length > 0 ? (
                <div className="space-y-4">
                  {liveResults.map((movie) => (
                    <SearchResultListItem
                      key={movie.id}
                      movie={movie}
                      query={query}
                      onItemClick={onClose}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#737373] space-y-1.5">
                  <p className="text-sm font-medium text-[#A3A3A3]">Tidak ditemukan film atau serial untuk &quot;{query}&quot;</p>
                  <p className="text-xs text-[#737373]">Coba gunakan kata kunci atau ejaan judul lainnya.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

