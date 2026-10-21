export type MediaType = "movie" | "tv";

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number;
  rating: number; // 0 - 10
  mediaType: MediaType;
  genres: string[];
  durationMinutes?: number;
  totalSeasons?: number;
  isFeatured?: boolean;
  qualityBadge?: "4K UHD" | "1080p HD" | "HDR";
}

export interface MovieSectionProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  viewAllHref?: string;
}
