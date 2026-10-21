export const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

export const TMDB_ENDPOINTS = {
  // Movie Endpoints
  moviePopular: "/movie/popular",
  movieTopRated: "/movie/top_rated",
  movieNowPlaying: "/movie/now_playing",
  movieUpcoming: "/movie/upcoming",
  movieDetails: (id: string | number) => `/movie/${id}`,
  movieCredits: (id: string | number) => `/movie/${id}/credits`,
  movieRecommendations: (id: string | number) => `/movie/${id}/recommendations`,
  movieVideos: (id: string | number) => `/movie/${id}/videos`,

  // TV Show Endpoints
  tvPopular: "/tv/popular",
  tvTopRated: "/tv/top_rated",
  tvDetails: (id: string | number) => `/tv/${id}`,
  tvCredits: (id: string | number) => `/tv/${id}/credits`,
  tvRecommendations: (id: string | number) => `/tv/${id}/recommendations`,
  tvSeasonDetails: (id: string | number, seasonNumber: number) => `/tv/${id}/season/${seasonNumber}`,
  tvVideos: (id: string | number) => `/tv/${id}/videos`,

  // Search Endpoints
  searchMulti: "/search/multi",
  searchMovie: "/search/movie",
  searchTv: "/search/tv",
} as const;
