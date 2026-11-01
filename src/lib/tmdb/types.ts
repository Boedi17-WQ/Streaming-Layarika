export type MediaType = "movie" | "tv";

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreListResponse {
  genres: TmdbGenre[];
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  adult?: boolean;
  video?: boolean;
  original_language?: string;
  media_type?: "movie";
}

export interface TmdbTvShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
  media_type?: "tv";
}

export interface TmdbMultiSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  profile_path?: string | null; // untuk person yang nanti difilter
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TmdbSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TmdbMovieDetails extends TmdbMovie {
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  budget?: number;
  genres: TmdbGenre[];
  homepage?: string | null;
  imdb_id?: string | null;
  production_companies?: TmdbProductionCompany[];
  production_countries?: TmdbProductionCountry[];
  revenue?: number;
  runtime?: number | null;
  spoken_languages?: TmdbSpokenLanguage[];
  status?: string;
  tagline?: string | null;
}

export interface TmdbTvSeasonSummary {
  air_date?: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average?: number;
}

export interface TmdbTvDetails extends TmdbTvShow {
  created_by?: Array<{
    id: number;
    credit_id: string;
    name: string;
    gender?: number;
    profile_path: string | null;
  }>;
  episode_run_time?: number[];
  genres: TmdbGenre[];
  homepage?: string | null;
  in_production?: boolean;
  languages?: string[];
  last_air_date?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  production_companies?: TmdbProductionCompany[];
  seasons?: TmdbTvSeasonSummary[];
  status?: string;
  tagline?: string | null;
  type?: string;
}

export interface TmdbCastMember {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id?: number;
  character: string;
  credit_id: string;
  order: number;
}

export interface TmdbCreditsResponse {
  id: number;
  cast: TmdbCastMember[];
  crew?: Array<{
    id: number;
    name: string;
    job?: string;
    department?: string;
    profile_path: string | null;
  }>;
}

export interface TmdbTvEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date?: string | null;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
}

export interface TmdbTvSeasonDetails {
  id: number;
  _id?: string;
  name: string;
  overview: string;
  season_number: number;
  poster_path: string | null;
  air_date?: string | null;
  episodes: TmdbTvEpisode[];
}

export interface TmdbVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TmdbVideosResponse {
  id: number;
  results: TmdbVideo[];
}

