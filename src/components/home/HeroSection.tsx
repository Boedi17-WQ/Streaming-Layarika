import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/types/movie";
import { Container } from "@/components/ui/Container";
import { Play, Star } from "@phosphor-icons/react/dist/ssr";

interface HeroSectionProps {
  featuredMovie: Movie;
  isTmdbData?: boolean;
}

export function HeroSection({ featuredMovie }: HeroSectionProps) {
  const isMovie = featuredMovie.mediaType === "movie";
  const detailHref = isMovie ? `/movie/${featuredMovie.id}` : `/tv/${featuredMovie.id}`;

  return (
    <section className="relative overflow-hidden border-b border-[#292929] bg-[#0A0A0A] min-h-[420px] sm:min-h-[460px] flex items-center">
      {/* Background Image TMDB Resolusi Tinggi jika tersedia */}
      {featuredMovie.backdropPath ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={featuredMovie.backdropPath}
            alt={`Backdrop ${featuredMovie.title}`}
            fill
            priority
            unoptimized
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
        <div className="max-w-3xl space-y-4 sm:space-y-5">
          {/* 1. Judul Film */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F5F5F5] leading-tight drop-shadow-md">
            {featuredMovie.title}
          </h1>

          {/* 2. Metadata: Rating • Tahun • Genre */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#A3A3A3]">
            {featuredMovie.rating > 0 && (
              <div className="flex items-center gap-1 font-bold text-[#F5F5F5]">
                <Star size={15} weight="fill" className="text-[#D9A52E]" />
                <span>{featuredMovie.rating.toFixed(1)}/10</span>
              </div>
            )}

            {featuredMovie.releaseYear > 0 && (
              <>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-medium">{featuredMovie.releaseYear}</span>
              </>
            )}

            {featuredMovie.genres && featuredMovie.genres.length > 0 && (
              <>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300">{featuredMovie.genres.join(", ")}</span>
              </>
            )}
          </div>

          {/* 3. Tombol Mulai Nonton */}
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
    </section>
  );
}
