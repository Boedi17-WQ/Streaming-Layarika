import type { MetadataRoute } from "next";
import { getPopularMovies, getPopularTvShows, isTmdbConfigured } from "@/lib/tmdb/client";
import { MOCK_FEATURED_MOVIES, MOCK_SERIES } from "@/data/mockMovies";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://layarrika.vercel.app";
  const now = new Date();

  // Rute Statis Publik
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Rute Dinamis Film & Serial (Tanpa membebani kuota API TMDB)
  try {
    if (isTmdbConfigured()) {
      const [movies, tvShows] = await Promise.all([
        getPopularMovies(1),
        getPopularTvShows(1),
      ]);

      (movies || []).slice(0, 15).forEach((movie) => {
        routes.push({
          url: `${baseUrl}/movie/${movie.id}`,
          lastModified: movie.release_date ? new Date(movie.release_date) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });

      (tvShows || []).slice(0, 15).forEach((tv) => {
        routes.push({
          url: `${baseUrl}/tv/${tv.id}`,
          lastModified: tv.first_air_date ? new Date(tv.first_air_date) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    } else {
      MOCK_FEATURED_MOVIES.forEach((movie) => {
        routes.push({
          url: `${baseUrl}/movie/${movie.id}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      });

      MOCK_SERIES.forEach((tv) => {
        routes.push({
          url: `${baseUrl}/tv/${tv.id}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      });
    }
  } catch (error) {
    console.warn("Gagal membuat rute dinamis sitemap:", error);
  }

  return routes;
}
