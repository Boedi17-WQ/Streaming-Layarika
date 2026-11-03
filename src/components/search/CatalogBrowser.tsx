"use client";

import { useState, useEffect, useRef, useCallback, FormEvent, ChangeEvent } from "react";
import { Movie } from "@/types/movie";
import { TmdbGenre } from "@/lib/tmdb/types";
import { MovieCard } from "@/components/home/MovieCard";
import { SearchResultListItem } from "./SearchResultListItem";
import {
  MagnifyingGlass,
  X,
  FilmReel,
  Television,
  Sparkle,
  WarningCircle,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  Spinner,
  Tag,
  ListDashes,
  SquaresFour,
} from "@phosphor-icons/react";

export type CatalogMediaType = "all" | "movie" | "tv";

export interface CatalogBrowserProps {
  initialMovies?: Movie[];
  initialTvShows?: Movie[];
  initialTotalResults?: number;
  initialTotalPages?: number;
  initialQuery?: string;
  initialType?: CatalogMediaType;
  initialGenreId?: number | null;
  initialPage?: number;
  movieGenres: TmdbGenre[];
  tvGenres: TmdbGenre[];
}

export function CatalogBrowser({
  initialMovies = [],
  initialTvShows = [],
  initialTotalResults = 0,
  initialTotalPages = 1,
  initialQuery = "",
  initialType = "all",
  initialGenreId = null,
  initialPage = 1,
  movieGenres,
  tvGenres,
}: CatalogBrowserProps) {
  // State Filter & Navigasi
  const [query, setQuery] = useState<string>(initialQuery);
  const [mediaType, setMediaType] = useState<CatalogMediaType>(initialType);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(initialGenreId);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [viewMode, setViewMode] = useState<"list" | "grid">(initialQuery.trim().length > 0 ? "list" : "grid");

  // State Hasil Data
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [tvShows, setTvShows] = useState<Movie[]>(initialTvShows);
  const [totalResults, setTotalResults] = useState<number>(initialTotalResults);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);

  // State Status Interaksi
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs untuk pengelolaan Request, Debounce, dan Race Conditions
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Daftar genre aktif yang relevan berdasarkan Jenis Media yang dipilih
  const currentGenres: TmdbGenre[] =
    mediaType === "tv"
      ? tvGenres
      : mediaType === "movie"
      ? movieGenres
      : movieGenres; // Mode "all" menampilkan genre populer umum

  /**
   * Memperbarui search parameter di URL browser tanpa melakukan full-page reload
   */
  const updateUrlParams = useCallback(
    (newType: CatalogMediaType, newGenreId: number | null, newQuery: string, newPage: number) => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams();
      if (newType !== "all") params.set("type", newType);
      if (newGenreId && newGenreId > 0) params.set("genre", String(newGenreId));
      if (newQuery.trim()) params.set("q", newQuery.trim());
      if (newPage > 1) params.set("page", String(newPage));

      const queryString = params.toString();
      const newUrl = queryString ? `/search?${queryString}` : "/search";

      // Gunakan replaceState dengan mempertahankan state internal router Next.js
      window.history.replaceState(window.history.state, "", newUrl);
    },
    []
  );

  /**
   * Fungsi inti pengambilan data katalog & pencarian real-time via API Route internal
   */
  const fetchCatalogData = useCallback(
    async (
      targetType: CatalogMediaType,
      targetGenreId: number | null,
      targetQuery: string,
      targetPage: number
    ) => {
      // 1. Batalkan request sebelumnya yang masih berjalan (AbortController)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 2. Beri nomor urut request untuk mencegah respon lama menimpa respon baru (Race Condition)
      const currentSequence = ++requestSequenceRef.current;

      setIsSearching(true);
      setErrorMessage(null);

      // Sinkronkan ke URL
      updateUrlParams(targetType, targetGenreId, targetQuery, targetPage);

      const params = new URLSearchParams();
      params.set("type", targetType);
      if (targetGenreId && targetGenreId > 0) {
        params.set("genre", String(targetGenreId));
      }
      if (targetQuery.trim()) {
        params.set("q", targetQuery.trim());
      }
      params.set("page", String(targetPage));

      try {
        const response = await fetch(`/api/catalog?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        // 3. Hanya perbarui state jika respon ini berasal dari request terbaru
        if (currentSequence === requestSequenceRef.current) {
          if (data.success) {
            setMovies(data.movies || []);
            setTvShows(data.tvShows || []);
            setTotalResults(data.totalResults || 0);
            setTotalPages(data.totalPages || 1);
          } else {
            setErrorMessage(data.error || "Gagal memuat katalog.");
          }
          setIsSearching(false);
          setIsTyping(false);
        }
      } catch (err: unknown) {
        // Abaikan jika error disebabkan oleh pembatalan sengaja (AbortError)
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (currentSequence === requestSequenceRef.current) {
          console.error("[CatalogBrowser] Gagal memuat data:", err);
          setErrorMessage("Terjadi gangguan jaringan saat memuat katalog. Silakan coba lagi.");
          setIsSearching(false);
          setIsTyping(false);
        }
      }
    },
    [updateUrlParams]
  );

  // Handler Perubahan Input Pencarian (Debounce 350ms)
  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    setIsTyping(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchCatalogData(mediaType, selectedGenreId, nextQuery, 1);
    }, 350);
  };

  // Handler Pembersihan Input Pencarian (Clear X)
  const handleClearQuery = () => {
    setQuery("");
    setIsTyping(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setCurrentPage(1);
    fetchCatalogData(mediaType, selectedGenreId, "", 1);

    // Pertahankan fokus di input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handler Pemilihan Jenis Media (Semua, Film, Serial TV)
  const handleMediaTypeChange = (newType: CatalogMediaType) => {
    if (mediaType === newType) return;

    // Periksa apakah genre yang sedang dipilih berlaku pada media type baru
    let validGenreId = selectedGenreId;
    if (validGenreId) {
      const allowedGenres = newType === "tv" ? tvGenres : movieGenres;
      const exists = allowedGenres.some((g) => g.id === validGenreId);
      if (!exists) {
        validGenreId = null;
      }
    }

    setMediaType(newType);
    setSelectedGenreId(validGenreId);
    setCurrentPage(1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    fetchCatalogData(newType, validGenreId, query, 1);
  };

  // Handler Pemilihan Genre Chip
  const handleGenreSelect = (genreId: number | null) => {
    // Jika genre yang sama diklik lagi, batalkan filter (pilih semua genre)
    const nextGenreId = selectedGenreId === genreId ? null : genreId;
    setSelectedGenreId(nextGenreId);
    setCurrentPage(1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    fetchCatalogData(mediaType, nextGenreId, query, 1);
  };

  // Handler Pindah Halaman (Pagination)
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage || isSearching) return;
    setCurrentPage(newPage);
    fetchCatalogData(mediaType, selectedGenreId, query, newPage);

    // Scroll mulus ke area katalog
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  // Handler Reset Seluruh Filter & Pencarian
  const handleResetAll = () => {
    setQuery("");
    setMediaType("all");
    setSelectedGenreId(null);
    setCurrentPage(1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    fetchCatalogData("all", null, "", 1);
  };

  // Dukungan Navigasi Tombol Back/Forward Browser (Popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlType = (params.get("type") as CatalogMediaType) || "all";
      const rawGenre = params.get("genre");
      const urlGenreId = rawGenre ? parseInt(rawGenre, 10) : null;
      const urlQuery = params.get("q") || "";
      const urlPage = parseInt(params.get("page") || "1", 10);

      setMediaType(urlType);
      setSelectedGenreId(urlGenreId && urlGenreId > 0 ? urlGenreId : null);
      setQuery(urlQuery);
      setCurrentPage(!isNaN(urlPage) && urlPage >= 1 ? urlPage : 1);

      fetchCatalogData(urlType, urlGenreId, urlQuery, urlPage);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [fetchCatalogData]);

  // Cleanup timer & abort controller ketika komponen unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Total item yang sedang ditampilkan
  const totalItemCount =
    mediaType === "movie"
      ? movies.length
      : mediaType === "tv"
      ? tvShows.length
      : movies.length + tvShows.length;

  const activeGenreName = currentGenres.find((g) => g.id === selectedGenreId)?.name;

  return (
    <div className="space-y-8">
      {/* 1. Bar Pencarian Real-Time Responsif */}
      <div className="relative max-w-3xl mx-auto">
        <form
          onSubmit={(e: FormEvent) => e.preventDefault()}
          role="search"
          className="relative flex items-center w-full"
        >
          <div className="pointer-events-none absolute left-4 flex items-center justify-center text-[#A3A3A3]">
            {isSearching || isTyping ? (
              <Spinner size={20} className="animate-spin text-[#D9A52E]" />
            ) : (
              <MagnifyingGlass size={20} />
            )}
          </div>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Ketik judul film, serial TV, atau kata kunci..."
            aria-label="Cari Film dan Serial TV secara real-time"
            aria-describedby="search-summary"
            autoComplete="off"
            spellCheck="false"
            className="h-12 w-full rounded-2xl border border-[#292929] bg-[#141414] pl-12 pr-12 text-sm sm:text-base text-[#F5F5F5] placeholder-[#737373] shadow-lg transition-all focus:border-[#D9A52E] focus:bg-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D9A52E]/30"
          />

          {query && (
            <button
              type="button"
              onClick={handleClearQuery}
              aria-label="Bersihkan kata kunci pencarian"
              className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-[#A3A3A3] transition hover:bg-[#242424] hover:text-[#F5F5F5]"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Status Pembaca Layar Aksesibel */}
        <div aria-live="polite" className="sr-only" id="search-summary">
          {isSearching
            ? "Sedang mencari..."
            : `Menampilkan ${totalResults} hasil untuk kategori ${mediaType}`}
        </div>
      </div>

      {/* 2. Filter Bar: Jenis Media (Tabs) & Chip Genre Dinamis */}
      <div className="space-y-4 rounded-2xl border border-[#222222] bg-[#121212] p-4 sm:p-5 shadow-sm">
        {/* A. Pemilihan Jenis Media (Semua, Film, Serial TV) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222222] pb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#737373]">
            <Tag size={16} className="text-[#D9A52E]" />
            <span>Kategori Media:</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#292929] bg-[#0A0A0A] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleMediaTypeChange("all")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                mediaType === "all"
                  ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md font-bold"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              <Sparkle size={14} weight={mediaType === "all" ? "fill" : "regular"} />
              <span>Semua</span>
            </button>

            <button
              type="button"
              onClick={() => handleMediaTypeChange("movie")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                mediaType === "movie"
                  ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md font-bold"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              <FilmReel size={14} weight={mediaType === "movie" ? "fill" : "regular"} />
              <span>Film</span>
            </button>

            <button
              type="button"
              onClick={() => handleMediaTypeChange("tv")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                mediaType === "tv"
                  ? "bg-[#D9A52E] text-[#0A0A0A] shadow-md font-bold"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5]"
              }`}
            >
              <Television size={14} weight={mediaType === "tv" ? "fill" : "regular"} />
              <span>Serial TV</span>
            </button>
          </div>
        </div>

        {/* B. Chip Genre Dinamis dari TMDB API */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Filter Berdasarkan Genre {mediaType === "tv" ? "Serial" : mediaType === "movie" ? "Film" : ""}:
            </span>
            {selectedGenreId && (
              <button
                type="button"
                onClick={() => handleGenreSelect(null)}
                className="text-[#D9A52E] hover:underline transition font-medium"
              >
                Hapus Filter Genre
              </button>
            )}
          </div>

          {/* Baris Chip Genre dengan Horizontal Scroll di Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#292929]">
            {/* Tombol "Semua Genre" */}
            <button
              type="button"
              onClick={() => handleGenreSelect(null)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#D9A52E] ${
                selectedGenreId === null
                  ? "bg-[#D9A52E] text-[#0A0A0A] font-bold shadow-md shadow-[#D9A52E]/20"
                  : "border border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#D9A52E]/50 hover:text-[#F5F5F5]"
              }`}
            >
              Semua Genre
            </button>

            {/* Chip Genre Dinamis */}
            {currentGenres.map((genre) => {
              const isSelected = selectedGenreId === genre.id;
              return (
                <button
                  key={`genre-${genre.id}`}
                  type="button"
                  onClick={() => handleGenreSelect(genre.id)}
                  aria-pressed={isSelected}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#D9A52E] ${
                    isSelected
                      ? "bg-[#D9A52E] text-[#0A0A0A] font-bold shadow-md shadow-[#D9A52E]/20"
                      : "border border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#D9A52E]/50 hover:text-[#F5F5F5]"
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bar Ringkasan Status & Jumlah Hasil */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#292929] pb-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          {isSearching ? (
            <span className="flex items-center gap-2 text-[#D9A52E]">
              <Spinner size={16} className="animate-spin" />
              <span>Memperbarui hasil katalog...</span>
            </span>
          ) : (
            <>
              <span>
                Menampilkan{" "}
                <span className="font-bold text-[#D9A52E]">{totalResults}</span> judul
              </span>
              {(query || selectedGenreId) && (
                <span className="text-[#737373]">
                  {query && (
                    <span>
                      untuk &ldquo;<span className="text-[#F5F5F5] font-semibold">{query}</span>&rdquo;
                    </span>
                  )}
                  {selectedGenreId && activeGenreName && (
                    <span> • Genre: <span className="text-[#D9A52E] font-semibold">{activeGenreName}</span></span>
                  )}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode: List ala iQIYI/WeTV vs Grid Poster */}
          <div className="flex items-center rounded-xl bg-[#141414] border border-[#262626] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Tampilan List (Daftar Sinematik Lengkap)"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-emerald-500 text-black shadow-xs font-bold"
                  : "text-[#888] hover:text-white"
              }`}
            >
              <ListDashes size={14} weight="bold" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Tampilan Grid (Poster)"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#D9A52E] text-black shadow-xs font-bold"
                  : "text-[#888] hover:text-white"
              }`}
            >
              <SquaresFour size={14} weight="bold" />
              <span>Grid</span>
            </button>
          </div>

          {/* Tombol Reset Jika Ada Filter Aktif */}
          {(query || selectedGenreId || mediaType !== "all") && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#D9A52E] transition cursor-pointer"
            >
              <ArrowClockwise size={14} />
              <span className="hidden sm:inline">Reset Semua Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Tampilan Error State */}
      {errorMessage && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/50 border border-red-500/40 text-red-400">
            <WarningCircle size={28} />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-[#F5F5F5]">Kendala Memuat Katalog</h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchCatalogData(mediaType, selectedGenreId, query, currentPage)}
            className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] transition hover:bg-[#c49226]"
          >
            <ArrowClockwise size={16} />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* 5. Tampilan Empty State (Tidak Ada Hasil) */}
      {!isSearching && !errorMessage && totalItemCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#292929] bg-[#121212] p-10 sm:p-14 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E]">
            <MagnifyingGlass size={32} />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-bold text-[#F5F5F5]">
              Tidak Ada Film atau Serial yang Cocok
            </h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              {query
                ? `Pencarian untuk "${query}" tidak menemukan hasil pada kategori dan genre yang dipilih.`
                : "Tidak ada judul yang ditemukan pada kombinasi filter ini."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-2 rounded-xl border border-[#292929] bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-[#F5F5F5] transition hover:border-[#D9A52E] hover:text-[#D9A52E]"
          >
            <ArrowClockwise size={14} />
            <span>Hapus Filter & Tampilkan Semua</span>
          </button>
        </div>
      )}

      {/* 6. Tampilan Hasil Katalog / Pencarian (Mendukung List ala iQIYI/WeTV dan Grid Poster) */}
      {!errorMessage && (
        <div
          className={`space-y-6 sm:space-y-10 transition-opacity duration-200 ${
            isSearching ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}
        >
          {viewMode === "list" ? (
            /* Mode List: Menampilkan Daftar Lengkap Poster di Kiri, Judul, Info & Tombol Watch now di Kanan */
            <div className="space-y-4 sm:space-y-6">
              {mediaType === "all" ? (
                <>
                  {movies.map((movie) => (
                    <SearchResultListItem
                      key={`movie-${movie.id}`}
                      movie={movie}
                      query={query}
                    />
                  ))}
                  {tvShows.map((tv) => (
                    <SearchResultListItem
                      key={`tv-${tv.id}`}
                      movie={tv}
                      query={query}
                    />
                  ))}
                </>
              ) : mediaType === "movie" ? (
                movies.map((movie) => (
                  <SearchResultListItem
                    key={`movie-${movie.id}`}
                    movie={movie}
                    query={query}
                  />
                ))
              ) : (
                tvShows.map((tv) => (
                  <SearchResultListItem
                    key={`tv-${tv.id}`}
                    movie={tv}
                    query={query}
                  />
                ))
              )}
            </div>
          ) : (
            /* Mode Grid Tradisional */
            mediaType === "all" ? (
              <>
                {/* Bagian Film */}
                {movies.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FilmReel size={20} className="text-[#D9A52E]" />
                      <h2 className="text-lg sm:text-xl font-bold text-[#F5F5F5]">
                        Film ({movies.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                      {movies.map((movie) => (
                        <MovieCard key={`movie-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bagian Serial TV */}
                {tvShows.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Television size={20} className="text-[#D9A52E]" />
                      <h2 className="text-lg sm:text-xl font-bold text-[#F5F5F5]">
                        Serial TV ({tvShows.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                      {tvShows.map((tv) => (
                        <MovieCard key={`tv-${tv.id}`} movie={tv} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Mode "movie" atau "tv" tunggal */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {mediaType === "movie"
                  ? movies.map((movie) => (
                      <MovieCard key={`movie-${movie.id}`} movie={movie} />
                    ))
                  : tvShows.map((tv) => (
                      <MovieCard key={`tv-${tv.id}`} movie={tv} />
                    ))}
              </div>
            )
          )}
        </div>
      )}

      {/* 7. Kontrol Pagination Dinamis */}
      {!errorMessage && totalPages > 1 && totalItemCount > 0 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#222222]">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isSearching}
            className="flex items-center gap-1.5 rounded-xl border border-[#292929] bg-[#141414] px-4 py-2 text-xs font-semibold text-[#A3A3A3] transition hover:border-[#D9A52E] hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
          >
            <CaretLeft size={14} />
            <span>Sebelumnya</span>
          </button>

          <div className="rounded-xl border border-[#222222] bg-[#0d0d0d] px-3.5 py-2 text-xs font-semibold text-[#A3A3A3]">
            Halaman <span className="text-[#D9A52E] font-bold">{currentPage}</span> dari{" "}
            <span className="text-[#F5F5F5]">{Math.min(totalPages, 100)}</span>
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || currentPage >= 100 || isSearching}
            className="flex items-center gap-1.5 rounded-xl border border-[#292929] bg-[#141414] px-4 py-2 text-xs font-semibold text-[#A3A3A3] transition hover:border-[#D9A52E] hover:text-[#F5F5F5] disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Selanjutnya</span>
            <CaretRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
