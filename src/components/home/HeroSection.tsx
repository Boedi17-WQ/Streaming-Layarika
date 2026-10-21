import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/types/movie";
import { Container } from "@/components/ui/Container";
import {
  Play,
  Info,
  Star,
  FilmReel,
  Sparkle,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";

interface HeroSectionProps {
  featuredMovie: Movie;
  isTmdbData?: boolean;
}

export function HeroSection({ featuredMovie, isTmdbData = false }: HeroSectionProps) {
  const isMovie = featuredMovie.mediaType === "movie";
  const detailHref = isMovie ? `/movie/${featuredMovie.id}` : `/tv/${featuredMovie.id}`;

  return (
    <section className="relative overflow-hidden border-b border-[#292929] bg-[#0A0A0A] min-h-[460px] flex items-center">
      {/* Background Image TMDB Resolusi Tinggi jika tersedia */}
      {featuredMovie.backdropPath ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={featuredMovie.backdropPath}
            alt={`Backdrop ${featuredMovie.title}`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40" />
        </div>
      ) : (
        /* Fallback Ambient Glow jika backdrop tidak ada */
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,165,46,0.15),rgba(10,10,10,0))] z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-0" />
        </>
      )}

      <Container className="relative z-10 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl space-y-6">
          {/* Tag & Quality Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E]/40 bg-[#D9A52E]/10 px-3 py-1 text-xs font-semibold text-[#D9A52E]">
              <Sparkle size={13} weight="fill" />
              <span>{isTmdbData ? "Katalog Resmi TMDB" : "Sorotan Utama"}</span>
            </span>

            {featuredMovie.qualityBadge && (
              <span className="rounded-md border border-[#292929] bg-[#171717]/90 px-2.5 py-0.5 text-xs font-semibold text-[#F5F5F5] backdrop-blur-sm">
                {featuredMovie.qualityBadge}
              </span>
            )}

            <span className="rounded-md border border-[#292929] bg-[#171717]/90 px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3] backdrop-blur-sm">
              {isMovie ? "Film Bioskop" : "Serial Pilihan"}
            </span>
          </div>

          {/* Main Title & Tagline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F5F5F5] leading-tight drop-shadow-md">
              {featuredMovie.title}
            </h1>
            <p className="text-base sm:text-lg text-[#D9A52E] font-medium tracking-wide">
              “Temukan Ceritamu. Nikmati Setiap Episode.”
            </p>
          </div>

          {/* Metadata Row: Rating, Year, Genres */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#A3A3A3]">
            {featuredMovie.rating > 0 && (
              <div className="flex items-center gap-1 font-bold text-[#F5F5F5]">
                <Star size={16} weight="fill" className="text-[#D9A52E]" />
                <span>{featuredMovie.rating.toFixed(1)}/10</span>
              </div>
            )}

            {featuredMovie.releaseYear > 0 && (
              <>
                <span className="text-[#292929]">•</span>
                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={16} />
                  <span>{featuredMovie.releaseYear}</span>
                </div>
              </>
            )}

            <span className="text-[#292929]">•</span>

            <div className="flex items-center gap-1.5">
              <FilmReel size={16} />
              <span>{featuredMovie.genres.join(", ")}</span>
            </div>
          </div>

          {/* Synopsis */}
          <p className="line-clamp-3 sm:line-clamp-4 text-sm sm:text-base leading-relaxed text-[#A3A3A3] max-w-2xl drop-shadow-sm">
            {featuredMovie.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Tombol Mulai Nonton Aktif */}
            <Link
              href={`${detailHref}#player-section`}
              className="flex items-center gap-2.5 rounded-lg border border-[#D9A52E] bg-[#D9A52E] px-6 py-3 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D9A52E]/20 transition hover:bg-[#c49226] hover:border-[#c49226] active:scale-[0.98]"
            >
              <Play size={18} weight="fill" />
              <span>Mulai Nonton</span>
            </Link>

            {/* Detail Button */}
            <Link
              href={detailHref}
              className="flex items-center gap-2 rounded-lg border border-[#292929] bg-[#171717]/90 px-5 py-3 text-sm font-semibold text-[#F5F5F5] backdrop-blur-sm transition hover:border-[#D9A52E]/50 hover:bg-[#1F1F1F] active:scale-[0.98]"
            >
              <Info size={18} weight="bold" />
              <span>Lihat Detail Cerita</span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
