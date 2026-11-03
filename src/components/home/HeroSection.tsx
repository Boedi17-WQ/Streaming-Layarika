"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/types/movie";
import { Container } from "@/components/ui/Container";
import { Play, Star, CaretLeft, CaretRight } from "@phosphor-icons/react";

interface HeroSectionProps {
  featuredMovie?: Movie;
  movies?: Movie[];
  isTmdbData?: boolean;
}

export function HeroSection({ featuredMovie, movies }: HeroSectionProps) {
  // Gunakan daftar film populer jika tersedia (minimal 5 judul), fallback ke film tunggal
  const slideMovies: Movie[] =
    movies && movies.length > 0
      ? movies
      : featuredMovie
      ? [featuredMovie]
      : [];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);

  const totalSlides = slideMovies.length;
  const activeMovie = slideMovies[currentIndex] || slideMovies[0];

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  // Otomatis berpindah slide setiap 5.5 detik (auto-advance), jeda saat kursor melayang (hover)
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  // Dukungan gestur geser (swipe) pada layar sentuh ponsel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartXRef.current - touchEndX;

      if (diff > 45) {
        handleNext();
      } else if (diff < -45) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    setIsPaused(false);
  };

  if (!activeMovie) return null;

  const isMovie = activeMovie.mediaType === "movie";
  const detailHref = isMovie ? `/movie/${activeMovie.id}` : `/tv/${activeMovie.id}`;

  return (
    <section
      className="relative overflow-hidden border-b border-[#292929] bg-[#0A0A0A] min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] flex items-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Sorotan Film Populer"
    >
      {/* 1. Lapisan Gambar Latar Belakang (Transisi Fade Halus Sinematik) */}
      {slideMovies.map((movie, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={movie.id}
            className={`absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isActive}
          >
            {movie.backdropPath ? (
              <Image
                src={movie.backdropPath}
                alt={`Backdrop ${movie.title}`}
                fill
                priority={idx === 0}
                unoptimized
                sizes="100vw"
                className="object-cover object-top opacity-35"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,165,46,0.15),rgba(10,10,10,0))]" />
            )}
            {/* Gradien Overlay Sinematik */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40" />
          </div>
        );
      })}

      {/* 2. Tombol Navigasi Panah Kiri (<) */}
      {totalSlides > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Lihat film sebelumnya"
          className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/90 hover:border-[#D9A52E] hover:text-[#D9A52E] hover:scale-105 active:scale-95 transition shadow-2xl cursor-pointer"
        >
          <CaretLeft size={22} weight="bold" />
        </button>
      )}

      {/* 3. Tombol Navigasi Panah Kanan (>) */}
      {totalSlides > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Lihat film selanjutnya"
          className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/90 hover:border-[#D9A52E] hover:text-[#D9A52E] hover:scale-105 active:scale-95 transition shadow-2xl cursor-pointer"
        >
          <CaretRight size={22} weight="bold" />
        </button>
      )}

      {/* 4. Konten Utama: Judul Film, Metadata (Rating • Tahun • Genre), dan Tombol Mulai Nonton */}
      <Container className="relative z-10 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl space-y-4 sm:space-y-5 px-8 sm:px-12 lg:px-4">
          {/* A. Judul Film */}
          <h1
            key={`title-${activeMovie.id}`}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F5F5F5] leading-tight drop-shadow-md animate-in fade-in duration-300"
          >
            {activeMovie.title}
          </h1>

          {/* B. Metadata Ringkas: Rating • Tahun • Genre */}
          <div
            key={`meta-${activeMovie.id}`}
            className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#A3A3A3] animate-in fade-in duration-300"
          >
            {activeMovie.rating > 0 && (
              <div className="flex items-center gap-1 font-bold text-[#F5F5F5]">
                <Star size={15} weight="fill" className="text-[#D9A52E]" />
                <span>{activeMovie.rating.toFixed(1)}/10</span>
              </div>
            )}

            {activeMovie.releaseYear > 0 && (
              <>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-medium">{activeMovie.releaseYear}</span>
              </>
            )}

            {activeMovie.genres && activeMovie.genres.length > 0 && (
              <>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300">{activeMovie.genres.join(", ")}</span>
              </>
            )}
          </div>

          {/* C. Tombol Mulai Nonton */}
          <div className="pt-2">
            <Link
              href={`${detailHref}#player-section`}
              className="inline-flex items-center gap-2.5 rounded-xl border border-[#D9A52E] bg-gradient-to-r from-[#D9A52E] to-[#b3821c] px-6 py-3 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D9A52E]/25 transition hover:from-[#e5b33d] hover:to-[#c49226] hover:border-[#e5b33d] active:scale-[0.98]"
            >
              <Play size={17} weight="fill" />
              <span>Mulai Nonton</span>
            </Link>
          </div>
        </div>
      </Container>

      {/* 5. Indikator Titik Navigasi Slider (Sesuai Referensi Gambar di Kanan Bawah) */}
      {totalSlides > 1 && (
        <div
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 lg:right-14 z-20 flex items-center gap-1.5 sm:gap-2"
          role="tablist"
          aria-label="Pilih film populer"
        >
          {slideMovies.map((movie, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={movie.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Pindah ke ${movie.title} (${idx + 1} dari ${totalSlides})`}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-6 sm:w-8 h-2 sm:h-2.5 bg-[#D9A52E] shadow-sm shadow-[#D9A52E]/50"
                    : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/30 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
