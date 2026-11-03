import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/types/movie";
import { Play, FilmReel, Television, Star } from "@phosphor-icons/react/dist/ssr";

interface SearchResultListItemProps {
  movie: Movie;
  query?: string;
}

export function SearchResultListItem({ movie, query }: SearchResultListItemProps) {
  const isMovie = movie.mediaType === "movie";
  const detailHref = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`;
  const playHref = `${detailHref}#player-section`;

  // Jumlah episode untuk serial TV (ditampilkan 1 - 9 seperti referensi WeTV/iQIYI)
  const episodes = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Helper untuk highlight kata kunci pencarian pada judul jika cocok
  const renderHighlightedTitle = (title: string, highlight?: string) => {
    if (!highlight || !highlight.trim()) {
      return title;
    }

    const trimmed = highlight.trim();
    const parts = title.split(new RegExp(`(${trimmed})`, "gi"));

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === trimmed.toLowerCase() ? (
            <span key={index} className="text-emerald-400 font-extrabold underline decoration-emerald-500/50">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="space-y-2">
      {/* 1. Label Kategori di Atas Item (Movie atau Drama) */}
      <div className="text-xs font-semibold text-[#888888] tracking-wider uppercase">
        {isMovie ? "Movie" : "Drama"}
      </div>

      {/* 2. Kartu Baris Hasil Pencarian (Horizontal Flex Row) */}
      <div className="group flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-[#222222] bg-[#141414] p-3 sm:p-5 hover:border-emerald-500/40 hover:bg-[#181818] transition-all duration-300">
        {/* Poster di Sebelah Kiri */}
        <Link
          href={detailHref}
          className="relative aspect-[2/3] w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-[#0a0a0a] border border-white/5 transition-transform duration-300 group-hover:scale-[1.02]"
        >
          {movie.posterPath ? (
            <Image
              src={movie.posterPath}
              alt={`Poster ${movie.title}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 112px, 144px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-[#555]">
              {isMovie ? <FilmReel size={32} /> : <Television size={32} />}
              <span className="mt-2 text-[10px] text-[#777] line-clamp-2">{movie.title}</span>
            </div>
          )}

          {/* Badge Hijau "Free" di Kanan Atas Poster (Persis Referensi iQIYI/WeTV) */}
          <span className="absolute top-2 right-2 rounded-sm bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md">
            Free
          </span>

          {/* Rating Bintang Melayang di Kiri Bawah Poster */}
          {movie.rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-bold text-[#F5F5F5]">
              <Star size={11} weight="fill" className="text-[#D9A52E]" />
              <span>{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </Link>

        {/* Informasi Detail di Sebelah Kanan Poster */}
        <div className="flex flex-1 flex-col justify-between space-y-3 min-w-0">
          <div className="space-y-1.5">
            {/* Judul Film dengan Warna Hijau Terang atau Emas Saat Hover */}
            <Link href={detailHref}>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors line-clamp-1">
                {renderHighlightedTitle(movie.title, query)}
              </h3>
            </Link>

            {/* Metadata Bar: Tahun, Genre/Director, Cast/Sinopsis */}
            <div className="space-y-1 text-xs sm:text-sm text-[#A3A3A3]">
              <div className="flex items-center gap-2">
                <span className="text-[#737373] font-medium">Year:</span>
                <span className="text-[#E5E5E5] font-semibold">{movie.releaseYear || "—"}</span>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex items-center gap-2 line-clamp-1">
                  <span className="text-[#737373] font-medium">Genre:</span>
                  <span className="text-[#CCCCCC]">{movie.genres.join(", ")}</span>
                </div>
              )}

              {movie.overview && (
                <div className="pt-0.5">
                  <span className="text-[#737373] font-medium mr-1.5">Story:</span>
                  <span className="text-[#8E8E8E] line-clamp-2 leading-relaxed">
                    {movie.overview}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Aksi Bawah: Tombol "Watch now" untuk Movie atau Pilihan Episode untuk Serial TV */}
          <div className="pt-2">
            {isMovie ? (
              <Link
                href={playHref}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-black shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Play size={15} weight="fill" />
                <span>Watch now</span>
              </Link>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={playHref}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-xs font-bold text-black shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <Play size={13} weight="fill" />
                    <span>Watch now</span>
                  </Link>
                  <span className="text-[11px] text-[#737373]">Pilih Episode:</span>
                </div>

                {/* Kotak-kotak Angka Episode 1 - 9 */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {episodes.map((ep) => (
                    <Link
                      key={`ep-${ep}`}
                      href={`${detailHref}?season=1&episode=${ep}#player-section`}
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#202020] border border-white/5 text-xs font-semibold text-[#D4D4D4] hover:bg-emerald-500 hover:text-black hover:font-bold hover:border-emerald-400 transition"
                      title={`Tonton Episode ${ep}`}
                    >
                      {ep}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
