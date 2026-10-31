import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { HeroSection } from "@/components/home/HeroSection";
import { MovieSection } from "@/components/home/MovieSection";
import { ResumePlaybackSection } from "@/components/home/ResumePlaybackSection";
import {
  isTmdbConfigured,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getPopularTvShows,
  getTopRatedTvShows,
} from "@/lib/tmdb/client";
import {
  mapTmdbMovieToMovie,
  mapTmdbTvToMovie,
} from "@/lib/tmdb/mappers";
import {
  MOCK_HERO_MOVIE,
  MOCK_FEATURED_MOVIES,
  MOCK_SERIES,
} from "@/data/mockMovies";

export default async function HomePage() {
  const hasTmdb = isTmdbConfigured();

  let heroMovie = MOCK_HERO_MOVIE;
  let popularMovies = MOCK_FEATURED_MOVIES;
  let topRatedMovies = MOCK_FEATURED_MOVIES.slice(0, 4);
  let nowPlayingMovies = MOCK_FEATURED_MOVIES;
  let upcomingMovies = MOCK_FEATURED_MOVIES;
  let popularTv = MOCK_SERIES;
  let topRatedTv = MOCK_SERIES;

  if (hasTmdb) {
    try {
      const [
        popMoviesRes,
        topMoviesRes,
        nowPlayingRes,
        upcomingRes,
        popTvRes,
        topTvRes,
      ] = await Promise.all([
        getPopularMovies(),
        getTopRatedMovies(),
        getNowPlayingMovies(),
        getUpcomingMovies(),
        getPopularTvShows(),
        getTopRatedTvShows(),
      ]);

      if (popMoviesRes.length > 0) {
        popularMovies = popMoviesRes.map(mapTmdbMovieToMovie);
        // Pilih film pertama dengan backdrop yang bagus sebagai sorotan hero
        const featuredRaw = popMoviesRes.find((m) => m.backdrop_path) || popMoviesRes[0];
        heroMovie = mapTmdbMovieToMovie(featuredRaw);
      }

      if (topMoviesRes.length > 0) {
        topRatedMovies = topMoviesRes.map(mapTmdbMovieToMovie);
      }

      if (nowPlayingRes.length > 0) {
        nowPlayingMovies = nowPlayingRes.map(mapTmdbMovieToMovie);
      }

      if (upcomingRes.length > 0) {
        upcomingMovies = upcomingRes.map(mapTmdbMovieToMovie);
      }

      if (popTvRes.length > 0) {
        popularTv = popTvRes.map(mapTmdbTvToMovie);
      }

      if (topTvRes.length > 0) {
        topRatedTv = topTvRes.map(mapTmdbTvToMovie);
      }
    } catch (err) {
      console.error("[TMDB Fetch Error on Home]", err);
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* 1. Hero Section */}
      <HeroSection featuredMovie={heroMovie} isTmdbData={hasTmdb} />

      {/* 2. Container Katalog Utama */}
      <Container className="space-y-14">
        {/* 2.5. Section Lanjutkan Menonton (Aktif bagi Pengguna Terautentikasi yang Memiliki Riwayat) */}
        <Suspense fallback={null}>
          <ResumePlaybackSection />
        </Suspense>

        {/* 3. Section Film Populer */}
        <div id="movies" className="scroll-mt-24">
          <MovieSection
            title="Film Populer"
            subtitle="Pilihan film yang paling banyak ditonton dan diperbincangkan saat ini"
            movies={popularMovies.slice(0, 12)}
            viewAllHref="/catalog?type=movie&sort=popularity.desc"
          />
        </div>

        {/* 4. Section Sedang Tayang di Bioskop */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Sedang Tayang di Bioskop"
            subtitle="Karya sinematik terbaru yang saat ini sedang menghiasi layar lebar"
            movies={nowPlayingMovies.slice(0, 12)}
            viewAllHref="/catalog?type=movie&sort=primary_release_date.desc"
          />
        </div>

        {/* 5. Section Film Rating Tertinggi */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Rating Tertinggi"
            subtitle="Koleksi mahakarya sinematik dengan ulasan terbaik dari penikmat film global"
            movies={topRatedMovies.slice(0, 12)}
            viewAllHref="/catalog?type=movie&sort=vote_average.desc"
          />
        </div>

        {/* 6. Section Segera Tayang */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Segera Tayang"
            subtitle="Antisipasi judul-judul film spektakuler yang akan segera hadir"
            movies={upcomingMovies.slice(0, 12)}
            viewAllHref="/catalog?type=movie&sort=primary_release_date.desc"
          />
        </div>

        {/* 7. Section Serial TV Populer */}
        <div id="series" className="scroll-mt-24">
          <MovieSection
            title="Serial TV Populer"
            subtitle="Serial televisi paling digemari dengan cerita episode demi episode yang memikat"
            movies={popularTv.slice(0, 12)}
            viewAllHref="/catalog?type=tv&sort=popularity.desc"
          />
        </div>

        {/* 8. Section Serial TV Rating Tertinggi */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Serial TV Rating Tertinggi"
            subtitle="Serial televisi legendaris dengan skor kepuasan penonton tertinggi"
            movies={topRatedTv.slice(0, 12)}
            viewAllHref="/catalog?type=tv&sort=vote_average.desc"
          />
        </div>
      </Container>
    </div>
  );
}
