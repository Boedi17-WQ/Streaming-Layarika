import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/types/movie";
import { Star, FilmReel, Television, Play } from "@phosphor-icons/react/dist/ssr";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const isMovie = movie.mediaType === "movie";
  const detailHref = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`;

  return (
    <Link
      href={detailHref}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#292929] bg-[#171717] transition-all duration-300 hover:-translate-y-1 hover:border-[#D9A52E]/60 hover:shadow-[0_8px_24px_rgba(217,165,46,0.14)] focus:outline-none focus:ring-2 focus:ring-[#D9A52E]/50"
    >
      {/* Poster Aspect Ratio 2:3 Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0F0F0F]">
        {movie.posterPath ? (
          <Image
            src={movie.posterPath}
            alt={`Poster ${movie.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Fallback Poster Sinematik Elegan */
          <div className="flex h-full w-full flex-col justify-between p-4 bg-gradient-to-b from-[#1F1F1F] via-[#141414] to-[#0A0A0A] border-b border-[#292929]">
            {/* Top Bar inside Poster Fallback */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 rounded bg-[#0A0A0A]/80 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#A3A3A3] uppercase border border-[#292929]">
                {isMovie ? (
                  <>
                    <FilmReel size={12} className="text-[#D9A52E]" /> Film
                  </>
                ) : (
                  <>
                    <Television size={12} className="text-[#D9A52E]" /> Serial
                  </>
                )}
              </span>

              {movie.qualityBadge && (
                <span className="rounded bg-[#D9A52E]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#D9A52E] border border-[#D9A52E]/30">
                  {movie.qualityBadge}
                </span>
              )}
            </div>

            {/* Center Graphic */}
            <div className="flex flex-col items-center justify-center py-6 text-[#333333] group-hover:text-[#D9A52E]/40 transition-colors">
              <FilmReel size={44} weight="thin" />
            </div>

            {/* Bottom Title inside Fallback */}
            <div>
              <span className="text-[11px] font-medium text-[#737373]">
                {movie.releaseYear} • {movie.genres[0] || "Katalog"}
              </span>
              <h4 className="line-clamp-2 text-sm font-bold text-[#F5F5F5] group-hover:text-[#D9A52E] transition-colors">
                {movie.title}
              </h4>
            </div>
          </div>
        )}

        {/* Floating Rating Badge */}
        {movie.rating > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-[#0A0A0A]/90 px-2 py-0.5 text-xs font-bold text-[#F5F5F5] border border-[#292929] shadow-md backdrop-blur-sm z-10">
            <Star size={13} weight="fill" className="text-[#D9A52E]" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Floating Media Type Badge (jika ada gambar poster) */}
        {movie.posterPath && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded bg-[#0A0A0A]/85 px-1.5 py-0.5 text-[10px] font-semibold text-[#A3A3A3] border border-[#292929] backdrop-blur-sm z-10">
            {isMovie ? "Film" : "Serial"}
          </div>
        )}

        {/* Hover Overlay with Play Button Cue */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100 z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D9A52E] text-[#0A0A0A] shadow-xl transition-transform duration-300 group-hover:scale-110">
            <Play size={18} weight="fill" className="ml-0.5" />
          </div>
        </div>
      </div>

      {/* Movie Information Below Card */}
      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-[#F5F5F5] transition group-hover:text-[#D9A52E]">
            {movie.title}
          </h3>
          <p className="line-clamp-2 mt-1 text-xs text-[#A3A3A3] leading-relaxed">
            {movie.overview}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-[11px] text-[#737373]">
          <span className="line-clamp-1">{movie.genres.slice(0, 2).join(", ")}</span>
          <span className="shrink-0 font-medium">
            {movie.releaseYear || "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
