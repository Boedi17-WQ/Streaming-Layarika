"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Movie } from "@/types/movie";
import { TmdbGenre } from "@/lib/tmdb/types";
import { MovieCard } from "@/components/home/MovieCard";
import {
  FilmReel,
  Television,
  Sparkle,
  WarningCircle,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  Spinner,
  Tag,
  Funnel,
  SortAscending,
} from "@phosphor-icons/react";

export type CatalogMediaType = "all" | "movie" | "tv";

export interface CatalogExplorerProps {
  initialMovies?: Movie[];
  initialTvShows?: Movie[];
  initialTotalResults?: number;
  initialTotalPages?: number;
  initialType?: CatalogMediaType;
  initialGenreId?: number | null;
  initialSort?: string;
  initialPage?: number;
  movieGenres: TmdbGenre[];
  tvGenres: TmdbGenre[];
}

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Paling Populer" },
  { value: "vote_average.desc", label: "Rating Tertinggi" },
  { value: "primary_release_date.desc", label: "Rilis Terbaru" },
];

export function CatalogExplorer({
  initialMovies = [],
  initialTvShows = [],
  initialTotalResults = 0,
  initialTotalPages = 1,
  initialType = "all",
  initialGenreId = null,
  initialSort = "popularity.desc",
  initialPage = 1,
  movieGenres,
  tvGenres,
}: CatalogExplorerProps) {
  const [mediaType, setMediaType] = useState<CatalogMediaType>(initialType);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(initialGenreId);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [tvShows, setTvShows] = useState<Movie[]>(initialTvShows);
  const [totalResults, setTotalResults] = useState<number>(initialTotalResults);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef<number>(0);

  const currentGenres: TmdbGenre[] =
    mediaType === "tv"
      ? tvGenres
      : mediaType === "movie"
      ? movieGenres
      : movieGenres;

  const updateUrlParams = useCallback(
    (newType: CatalogMediaType, newGenreId: number | null, newSort: string, newPage: number) => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams();
      if (newType !== "all") params.set("type", newType);
      if (newGenreId && newGenreId > 0) params.set("genre", String(newGenreId));
      if (newSort && newSort !== "popularity.desc") params.set("sort", newSort);
      if (newPage > 1) params.set("page", String(newPage));

      const queryString = params.toString();
      const newUrl = queryString ? `/catalog?${queryString}` : "/catalog";

      window.history.replaceState(window.history.state, "", newUrl);
    },
    []
  );

  const fetchCatalogData = useCallback(
    async (
      targetType: CatalogMediaType,
      targetGenreId: number | null,
      targetSort: string,
      targetPage: number
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentSequence = ++requestSequenceRef.current;

      setIsLoading(true);
      setErrorMessage(null);

      updateUrlParams(targetType, targetGenreId, targetSort, targetPage);

      const params = new URLSearchParams();
      params.set("type", targetType);
      if (targetGenreId && targetGenreId > 0) {
        params.set("genre", String(targetGenreId));
      }
      params.set("sort", targetSort);
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

        if (currentSequence === requestSequenceRef.current) {
          if (data.success) {
            setMovies(data.movies || []);
            setTvShows(data.tvShows || []);
            setTotalResults(data.totalResults || 0);
            setTotalPages(data.totalPages || 1);
          } else {
            setErrorMessage(data.error || "Gagal memuat katalog.");
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (currentSequence === requestSequenceRef.current) {
          console.error("[CatalogExplorer] Gagal memuat data:", err);
          setErrorMessage("Terjadi kendala jaringan saat memuat data katalog. Silakan coba lagi.");
          setIsLoading(false);
        }
      }
    },
    [updateUrlParams]
  );

  const handleMediaTypeChange = (newType: CatalogMediaType) => {
    if (mediaType === newType) return;

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

    fetchCatalogData(newType, validGenreId, sortBy, 1);
  };

  const handleGenreSelect = (genreId: number | null) => {
    const nextGenreId = selectedGenreId === genreId ? null : genreId;
    setSelectedGenreId(nextGenreId);
    setCurrentPage(1);

    fetchCatalogData(mediaType, nextGenreId, sortBy, 1);
  };

  const handleSortChange = (newSort: string) => {
    if (sortBy === newSort) return;
    setSortBy(newSort);
    setCurrentPage(1);

    fetchCatalogData(mediaType, selectedGenreId, newSort, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage || isLoading) return;
    setCurrentPage(newPage);
    fetchCatalogData(mediaType, selectedGenreId, sortBy, newPage);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 150, behavior: "smooth" });
    }
  };

  const handleResetAll = () => {
    setMediaType("all");
    setSelectedGenreId(null);
    setSortBy("popularity.desc");
    setCurrentPage(1);

    fetchCatalogData("all", null, "popularity.desc", 1);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlType = (params.get("type") as CatalogMediaType) || "all";
      const rawGenre = params.get("genre");
      const urlGenreId = rawGenre ? parseInt(rawGenre, 10) : null;
      const urlSort = params.get("sort") || "popularity.desc";
      const urlPage = parseInt(params.get("page") || "1", 10);

      setMediaType(urlType);
      setSelectedGenreId(urlGenreId && urlGenreId > 0 ? urlGenreId : null);
      setSortBy(urlSort);
      setCurrentPage(!isNaN(urlPage) && urlPage >= 1 ? urlPage : 1);

      fetchCatalogData(urlType, urlGenreId, urlSort, urlPage);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCatalogData]);

  const totalItemCount =
    mediaType === "movie"
      ? movies.length
      : mediaType === "tv"
      ? tvShows.length
      : movies.length + tvShows.length;

  const activeGenreName = currentGenres.find((g) => g.id === selectedGenreId)?.name;

  return (
    <div className="space-y-8">
      {/* 1. Bar Filter: Kategori Media, Genre Dinamis & Pengurutan */}
      <div className="space-y-4 rounded-2xl border border-[#222222] bg-[#121212] p-4 sm:p-5 shadow-sm">
        {/* A. Pemilihan Jenis Media (Semua, Film, Serial TV) & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#737373]">
            <Tag size={16} className="text-[#D9A52E]" />
            <span>Kategori Konten:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tabs Media Type */}
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

            {/* Selector Pengurutan */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#292929] bg-[#0A0A0A] px-2.5 py-1 text-xs">
              <SortAscending size={14} className="text-[#D9A52E]" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Urutkan katalog"
                className="bg-transparent text-xs text-[#F5F5F5] font-medium focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#171717] text-[#F5F5F5]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* B. Chip Genre Dinamis dari TMDB API */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Funnel size={13} className="text-[#D9A52E]" />
              <span>Filter Genre {mediaType === "tv" ? "Serial" : mediaType === "movie" ? "Film" : ""}:</span>
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

          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#292929]">
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

      {/* 2. Bar Ringkasan Status & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#292929] pb-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          {isLoading ? (
            <span className="flex items-center gap-2 text-[#D9A52E]">
              <Spinner size={16} className="animate-spin" />
              <span>Memuat data katalog...</span>
            </span>
          ) : (
            <>
              <span>
                Menampilkan <span className="font-bold text-[#D9A52E]">{totalResults}</span> judul
              </span>
              {selectedGenreId && activeGenreName && (
                <span className="text-[#737373]">
                  • Genre: <span className="text-[#D9A52E] font-semibold">{activeGenreName}</span>
                </span>
              )}
            </>
          )}
        </div>

        {(selectedGenreId || mediaType !== "all" || sortBy !== "popularity.desc") && (
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#D9A52E] transition"
          >
            <ArrowClockwise size={14} />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* 3. Tampilan Error State */}
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
            onClick={() => fetchCatalogData(mediaType, selectedGenreId, sortBy, currentPage)}
            className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] transition hover:bg-[#c49226]"
          >
            <ArrowClockwise size={16} />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* 4. Tampilan Empty State */}
      {!isLoading && !errorMessage && totalItemCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#292929] bg-[#121212] p-10 sm:p-14 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E]">
            <FilmReel size={32} />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-bold text-[#F5F5F5]">
              Tidak Ada Judul Ditemukan
            </h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              Tidak ada film atau serial yang cocok dengan kombinasi filter genre yang dipilih saat ini.
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

      {/* 5. Grid Katalog Media */}
      {!errorMessage && (
        <div
          className={`space-y-10 transition-opacity duration-200 ${
            isLoading ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}
        >
          {mediaType === "all" ? (
            <>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {mediaType === "movie"
                ? movies.map((movie) => (
                    <MovieCard key={`movie-${movie.id}`} movie={movie} />
                  ))
                : tvShows.map((tv) => (
                    <MovieCard key={`tv-${tv.id}`} movie={tv} />
                  ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Kontrol Pagination */}
      {!errorMessage && totalPages > 1 && totalItemCount > 0 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#222222]">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
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
            disabled={currentPage >= totalPages || currentPage >= 100 || isLoading}
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
