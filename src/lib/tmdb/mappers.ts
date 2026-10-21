import { Movie } from "@/types/movie";
import { TmdbMovie, TmdbTvShow } from "./types";
import { getTmdbPosterUrl, getTmdbBackdropUrl } from "./images";

// Genre dictionary umum TMDB untuk pemetaan ID ke teks Indonesia
const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Aksi",
  12: "Petualangan",
  16: "Animasi",
  35: "Komedi",
  80: "Kejahatan",
  99: "Dokumenter",
  18: "Drama",
  10751: "Keluarga",
  14: "Fantasi",
  36: "Sejarah",
  27: "Horor",
  10402: "Musik",
  9648: "Misteri",
  10749: "Romansa",
  878: "Fiksi Ilmiah",
  10770: "Film TV",
  53: "Thriller",
  10752: "Perang",
  37: "Western",
  10759: "Aksi & Petualangan",
  10762: "Anak-anak",
  10763: "Berita",
  10764: "Reality",
  10765: "Fiksi Ilmiah & Fantasi",
  10766: "Soap Opera",
  10767: "Talkshow",
  10768: "Perang & Politik",
};

export function mapGenreIdsToNames(genreIds?: number[]): string[] {
  if (!genreIds || genreIds.length === 0) return ["Katalog"];
  return genreIds
    .map((id) => TMDB_GENRE_MAP[id] || "Umum")
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 3);
}

export function mapTmdbMovieToMovie(movie: TmdbMovie): Movie {
  const year = movie.release_date
    ? parseInt(movie.release_date.substring(0, 4), 10) || 2024
    : 2024;

  return {
    id: String(movie.id),
    title: movie.title || "Judul Tidak Diketahui",
    originalTitle: movie.original_title,
    overview:
      movie.overview && movie.overview.trim() !== ""
        ? movie.overview
        : "Sinopsis untuk judul ini belum tersedia dalam bahasa Indonesia.",
    posterPath: getTmdbPosterUrl(movie.poster_path, "w500"),
    backdropPath: getTmdbBackdropUrl(movie.backdrop_path, "w1280"),
    releaseYear: year,
    rating: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 0,
    mediaType: "movie",
    genres: mapGenreIdsToNames(movie.genre_ids),
    qualityBadge: movie.vote_average >= 8 ? "4K UHD" : "1080p HD",
  };
}

export function mapTmdbTvToMovie(tv: TmdbTvShow): Movie {
  const year = tv.first_air_date
    ? parseInt(tv.first_air_date.substring(0, 4), 10) || 2024
    : 2024;

  return {
    id: String(tv.id),
    title: tv.name || "Judul Serial Tidak Diketahui",
    originalTitle: tv.original_name,
    overview:
      tv.overview && tv.overview.trim() !== ""
        ? tv.overview
        : "Sinopsis untuk serial ini belum tersedia dalam bahasa Indonesia.",
    posterPath: getTmdbPosterUrl(tv.poster_path, "w500"),
    backdropPath: getTmdbBackdropUrl(tv.backdrop_path, "w1280"),
    releaseYear: year,
    rating: tv.vote_average ? Number(tv.vote_average.toFixed(1)) : 0,
    mediaType: "tv",
    genres: mapGenreIdsToNames(tv.genre_ids),
    qualityBadge: tv.vote_average >= 8 ? "4K UHD" : "1080p HD",
  };
}
