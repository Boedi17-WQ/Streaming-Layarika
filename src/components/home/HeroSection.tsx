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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);

  const totalSlides = slideMovies.length;
  const activeMovie = slideMovies[currentIndex] || slideMovies[0];

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Otomatis berpindah slide dan REPEAT tanpa henti (Infinite Loop setiap 5 detik)
  useEffect(() => {
    if (totalSlides <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(timer);
  }, [totalSlides, currentIndex, isHovered]);

  // Dukungan gestur geser (swipe) khusus layar sentuh smartphone
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartXRef.current - touchEndX;

      // Geser minimal 40px untuk beralih slide
      if (diff > 40) {
        handleNext();
      } else if (diff < -40) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
  };

  if (!activeMovie) return null;

  const isMovie = activeMovie.mediaType === "movie";
  const detailHref = isMovie ? `/movie/${activeMovie.id}` : `/tv/${activeMovie.id}`;

  return (
    <section
      className="relative overflow-hidden border-b border-[#292929] bg-[#0A0A0A] min-h-[380px] sm:min-h-[480px] lg:min-h-[540px] flex items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      aria-label="Sorotan Film Populer Otomatis"
    >
      {/* 1. Lapisan Gambar Latar Belakang (Transisi Fade Sinematik Responsif) */}
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
                className="object-cover object-center sm:object-top opacity-35"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,165,46,0.15),rgba(10,10,10,0))]" />
            )}
            {/* Gradien Gelap Pelindung Keterbacaan Teks di Mobile & Desktop */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent sm:via-[#0A0A0A]/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
          </div>
        );
      })}

      {/* 2. Tombol Navigasi Panah Kiri (<) - Responsif di Ponsel & Desktop */}
      {totalSlides > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Lihat film sebelumnya"
          className="absolute left-2 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/90 hover:border-[#D9A52E] hover:text-[#D9A52E] hover:scale-105 active:scale-95 transition shadow-2xl cursor-pointer"
        >
          <CaretLeft size={18} weight="bold" className="sm:hidden" />
          <CaretLeft size={24} weight="bold" className="hidden sm:block" />
        </button>
      )}

      {/* 3. Tombol Navigasi Panah Kanan (>) - Responsif di Ponsel & Desktop */}
      {totalSlides > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Lihat film selanjutnya"
          className="absolute right-2 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/90 hover:border-[#D9A52E] hover:text-[#D9A52E] hover:scale-105 active:scale-95 transition shadow-2xl cursor-pointer"
        >
          <CaretRight size={18} weight="bold" className="sm:hidden" />
          <CaretRight size={24} weight="bold" className="hidden sm:block" />
        </button>
      )}

      {/* 4. Konten Utama: Judul Film, Metadata (Rating • Tahun • Genre), dan Tombol Mulai Nonton */}
      <Container className="relative z-10 pt-10 pb-14 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl space-y-3.5 sm:space-y-5 px-10 sm:px-16 lg:px-6">
          {/* A. Judul Film */}
          <h1
            key={`title-${activeMovie.id}`}
            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F5F5F5] leading-tight drop-shadow-md line-clamp-2 animate-in fade-in duration-300"
          >
            {activeMovie.title}
          </h1>

          {/* B. Metadata Ringkas: Rating • Tahun • Genre */}
          <div
            key={`meta-${activeMovie.id}`}
            className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#A3A3A3] animate-in fade-in duration-300"
          >
            {activeMovie.rating > 0 && (
              <div className="flex items-center gap-1 font-bold text-[#F5F5F5]">
                <Star size={14} weight="fill" className="text-[#D9A52E]" />
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
                <span className="text-neutral-300 line-clamp-1">{activeMovie.genres.join(", ")}</span>
              </>
            )}
          </div>

          {/* C. Tombol Mulai Nonton */}
          <div className="pt-1.5 sm:pt-2">
            <Link
              href={`${detailHref}#player-section`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-gradient-to-r from-[#D9A52E] to-[#b3821c] px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D9A52E]/25 transition hover:from-[#e5b33d] hover:to-[#c49226] hover:border-[#e5b33d] active:scale-[0.98]"
            >
              <Play size={16} weight="fill" />
              <span>Mulai Nonton</span>
            </Link>
          </div>
        </div>
      </Container>

      {/* 5. Indikator Titik Navigasi Slider (Sesuai Referensi Gambar di Kanan Bawah) */}
      {totalSlides > 1 && (
        <div
          className="absolute bottom-4 right-3 sm:bottom-8 sm:right-10 lg:right-14 z-20 flex items-center gap-1 sm:gap-2"
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
                    ? "w-5 sm:w-8 h-1.5 sm:h-2.5 bg-[#D9A52E] shadow-sm shadow-[#D9A52E]/50"
                    : "w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 bg-white/30 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
