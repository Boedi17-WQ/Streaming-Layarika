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
import { ShieldCheck, Key } from "@phosphor-icons/react/dist/ssr";

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
        {/* Banner Status Konfigurasi TMDB */}
        {hasTmdb ? (
          <div className="rounded-xl border border-emerald-500/30 bg-[#171717] p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A] border border-emerald-500/40 text-emerald-400">
                  <ShieldCheck size={20} weight="fill" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                    <span>Integrasi TMDB API Aktif</span>
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                      Live Metadata
                    </span>
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-2xl">
                    Katalog di bawah ini mengambil metadata langsung dari The Movie Database (TMDB) secara aman di sisi server dengan caching berkala.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs text-[#737373]">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Next.js 16 Server Caching</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#D9A52E]/40 bg-[#171717] p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A] border border-[#D9A52E]/40 text-[#D9A52E]">
                  <Key size={20} weight="duotone" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                    <span>Mode Mock Data Lokal (Kunci TMDB Belum Terpasang)</span>
                    <span className="rounded bg-[#D9A52E]/15 px-2 py-0.5 text-[10px] font-semibold text-[#D9A52E] uppercase">
                      Fallback Mode
                    </span>
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-2xl">
                    Untuk menghubungkan katalog ke jutaan film TMDB secara live, tambahkan token Anda pada berkas <code>.env.local</code> dengan variabel <code>TMDB_API_READ_ACCESS_TOKEN=your_token</code>.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs text-[#737373]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#D9A52E] animate-pulse" />
                <span>Siap Terhubung</span>
              </div>
            </div>
          </div>
        )}

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
          />
        </div>

        {/* 4. Section Sedang Tayang di Bioskop */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Sedang Tayang di Bioskop"
            subtitle="Karya sinematik terbaru yang saat ini sedang menghiasi layar lebar"
            movies={nowPlayingMovies.slice(0, 12)}
          />
        </div>

        {/* 5. Section Film Rating Tertinggi */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Rating Tertinggi"
            subtitle="Koleksi mahakarya sinematik dengan ulasan terbaik dari penikmat film global"
            movies={topRatedMovies.slice(0, 12)}
          />
        </div>

        {/* 6. Section Segera Tayang */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Segera Tayang"
            subtitle="Antisipasi judul-judul film spektakuler yang akan segera hadir"
            movies={upcomingMovies.slice(0, 12)}
          />
        </div>

        {/* 7. Section Serial TV Populer */}
        <div id="series" className="scroll-mt-24">
          <MovieSection
            title="Serial TV Populer"
            subtitle="Serial televisi paling digemari dengan cerita episode demi episode yang memikat"
            movies={popularTv.slice(0, 12)}
          />
        </div>

        {/* 8. Section Serial TV Rating Tertinggi */}
        <div className="scroll-mt-24">
          <MovieSection
            title="Serial TV Rating Tertinggi"
            subtitle="Serial televisi legendaris dengan skor kepuasan penonton tertinggi"
            movies={topRatedTv.slice(0, 12)}
          />
        </div>

        {/* 9. Atribusi Resmi TMDB */}
        <div className="rounded-xl border border-[#292929] bg-[#121212] p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">
              Atribusi Data & Metadata
            </h4>
            <p className="text-xs text-[#737373] max-w-xl">
              This product uses the TMDB API but is not endorsed or certified by TMDB. Seluruh metadata film, serial, dan gambar disediakan oleh The Movie Database.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded bg-[#01b4e4] px-2.5 py-1 text-xs font-black tracking-wider text-[#0d253f] uppercase">
              TMDB
            </span>
            <span className="text-xs text-[#A3A3A3] font-medium">Official API v3</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
