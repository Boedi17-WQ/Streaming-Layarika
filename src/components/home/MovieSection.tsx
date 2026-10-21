import { MovieSectionProps } from "@/types/movie";
import { MovieCard } from "./MovieCard";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function MovieSection({
  title,
  subtitle,
  movies,
  viewAllHref = "#",
}: MovieSectionProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between border-b border-[#292929] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#D9A52E]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#A3A3A3] pl-3">
              {subtitle}
            </p>
          )}
        </div>

        <a
          href={viewAllHref}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#D9A52E] transition hover:text-[#c49226]"
        >
          <span>Lihat Semua</span>
          <ArrowRight
            size={14}
            weight="bold"
            className="transition-transform group-hover:translate-x-1"
          />
        </a>
      </div>

      {/* Responsive Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
