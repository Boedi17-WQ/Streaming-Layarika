import Link from "next/link";
import { MovieSectionProps } from "@/types/movie";
import { MovieCard } from "./MovieCard";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

export function MovieSection({
  title,
  subtitle,
  movies,
  viewAllHref = "/catalog",
}: MovieSectionProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-2 sm:pb-3">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-3.5 sm:h-4 w-1 rounded-full bg-[#D9A52E]" />
            <h2 className="text-base sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="hidden sm:block text-xs sm:text-sm text-[#A3A3A3] pl-3">
              {subtitle}
            </p>
          )}
        </div>

        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-[#D9A52E] transition hover:text-[#c49226]"
        >
          <span>Lihat Semua</span>
          <CaretRight
            size={13}
            weight="bold"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {/* Horizontal Carousel di Mobile (Ala iQIYI / WeTV), Grid Responsif di Desktop */}
      <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="shrink-0 w-[125px] xs:w-[135px] sm:w-auto snap-start"
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
