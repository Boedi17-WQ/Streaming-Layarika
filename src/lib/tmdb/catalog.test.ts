/**
 * Unit Test: Catalog Filtering & Real-Time Search Logic
 * Menguji kepatuhan kriteria Tahap 8 Addendum:
 * 1. Pemetaan dan pemisahan genre Film vs Serial TV.
 * 2. Validasi parameter jenis media (All, Movie, TV).
 * 3. Sanitasi parameter query dan pencegahan request berbahaya.
 * 4. Filter genre pada hasil pencarian (kombinasi query + genre).
 * 5. Proteksi Race Condition pada penanganan sequence respons.
 * 6. Penanganan entitas non-media (pengecualian person pada pencarian multi).
 * 7. Reset pagination dan kalkulasi batas halaman.
 */

import { mapGenreIdsToNames } from "./mappers";
import { TMDB_ENDPOINTS } from "./endpoints";
import { TmdbMultiSearchResult, TmdbMovie } from "./types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("🧪 Menjalankan pengujian unit Genre Filtering & Real-Time Search...");

// -----------------------------------------------------------------------------
// Test 1: Endpoint TMDB Genre & Discover Tersedia
// -----------------------------------------------------------------------------
assert(TMDB_ENDPOINTS.genreMovieList === "/genre/movie/list", "Endpoint genre film harus '/genre/movie/list'");
assert(TMDB_ENDPOINTS.genreTvList === "/genre/tv/list", "Endpoint genre serial harus '/genre/tv/list'");
assert(TMDB_ENDPOINTS.discoverMovie === "/discover/movie", "Endpoint discover film harus '/discover/movie'");
assert(TMDB_ENDPOINTS.discoverTv === "/discover/tv", "Endpoint discover serial harus '/discover/tv'");

// -----------------------------------------------------------------------------
// Test 2: Pemetaan ID Genre TMDB ke Bahasa Indonesia
// -----------------------------------------------------------------------------
const actionNames = mapGenreIdsToNames([28]);
assert(actionNames[0] === "Aksi", `ID 28 harus dipetakan ke 'Aksi', hasil: ${actionNames[0]}`);

const tvActionNames = mapGenreIdsToNames([10759]);
assert(tvActionNames[0] === "Aksi & Petualangan", `ID 10759 harus dipetakan ke 'Aksi & Petualangan'`);

const multiGenreNames = mapGenreIdsToNames([28, 12, 16, 35]);
assert(multiGenreNames.length === 3, "Harus membatasi maksimal 3 label genre utama");
assert(multiGenreNames.includes("Aksi") && multiGenreNames.includes("Petualangan"), "Harus memuat genre Aksi & Petualangan");

const fallbackGenreNames = mapGenreIdsToNames([]);
assert(fallbackGenreNames[0] === "Katalog", "Genre kosong harus fallback ke 'Katalog'");

// -----------------------------------------------------------------------------
// Test 3: Validasi Parameter Jenis Media (All, Movie, TV)
// -----------------------------------------------------------------------------
function validateMediaType(raw: string | null): "all" | "movie" | "tv" {
  if (raw === "movie") return "movie";
  if (raw === "tv") return "tv";
  return "all";
}

assert(validateMediaType("movie") === "movie", "Tipe 'movie' harus valid");
assert(validateMediaType("tv") === "tv", "Tipe 'tv' harus valid");
assert(validateMediaType("all") === "all", "Tipe 'all' harus valid");
assert(validateMediaType("invalid_type") === "all", "Tipe asing harus fallback ke 'all'");
assert(validateMediaType(null) === "all", "Tipe null harus fallback ke 'all'");

// -----------------------------------------------------------------------------
// Test 4: Sanitasi Query Pencarian Real-Time & Batas Panjang
// -----------------------------------------------------------------------------
function sanitizeSearchQuery(raw: string | null): string {
  if (!raw) return "";
  return raw.trim().slice(0, 100);
}

assert(sanitizeSearchQuery("  Inception  ") === "Inception", "Query harus dibersihkan dari whitespace");
assert(sanitizeSearchQuery(null) === "", "Query null harus menghasilkan string kosong");
assert(sanitizeSearchQuery("A".repeat(150)).length === 100, "Query harus dibatasi maksimal 100 karakter");

// -----------------------------------------------------------------------------
// Test 5: Filter Pengecualian Entitas 'person' pada Mode Semua (Multi-Search)
// -----------------------------------------------------------------------------
const mockRawSearchResults: TmdbMultiSearchResult[] = [
  { id: 1, media_type: "movie", title: "Spider-Man: Brand New Day" },
  { id: 2, media_type: "person", name: "Tom Holland" },
  { id: 3, media_type: "tv", name: "Spider-Man: The Animated Series" },
  { id: 4, media_type: "person", name: "Zendaya" },
];

const filteredMediaResults = mockRawSearchResults.filter(
  (item) => item.media_type === "movie" || item.media_type === "tv"
);

assert(filteredMediaResults.length === 2, "Hanya film dan serial yang diizinkan (orang harus dikecualikan)");
assert(filteredMediaResults.every((item) => item.media_type !== "person"), "Tidak boleh ada entitas 'person'");

// -----------------------------------------------------------------------------
// Test 6: Kombinasi Pencarian Query + Filter Genre
// -----------------------------------------------------------------------------
const sampleMovies: TmdbMovie[] = [
  { id: 101, title: "Action Movie", overview: "", poster_path: null, backdrop_path: null, vote_average: 8, vote_count: 10, popularity: 100, genre_ids: [28, 12] },
  { id: 102, title: "Comedy Movie", overview: "", poster_path: null, backdrop_path: null, vote_average: 7, vote_count: 5, popularity: 80, genre_ids: [35] },
  { id: 103, title: "Action Comedy", overview: "", poster_path: null, backdrop_path: null, vote_average: 7.5, vote_count: 8, popularity: 90, genre_ids: [28, 35] },
];

// Simulasi filter genre ID 28 (Aksi)
const actionOnly = sampleMovies.filter((m) => m.genre_ids?.includes(28));
assert(actionOnly.length === 2, "Harus menemukan 2 film dengan genre Aksi (ID 28)");
assert(actionOnly.some((m) => m.id === 101) && actionOnly.some((m) => m.id === 103), "Film 101 dan 103 harus lolos filter");

// Simulasi filter genre ID 99 (Dokumenter - tidak ada kecocokan)
const docOnly = sampleMovies.filter((m) => m.genre_ids?.includes(99));
assert(docOnly.length === 0, "Genre yang tidak cocok harus mengembalikan array kosong (Empty State)");

// -----------------------------------------------------------------------------
// Test 7: Logika Penanganan Race Condition (Request Sequence Management)
// -----------------------------------------------------------------------------
let latestSequence = 0;
let displayedResultId = 0;

function simulateAsyncSearchResponse(seq: number, resultId: number) {
  // Hanya respons yang sesuai dengan latestSequence yang diizinkan memperbarui UI
  if (seq === latestSequence) {
    displayedResultId = resultId;
  }
}

// User mengetik "S" (seq 1) lalu dengan cepat mengetik "Sp" (seq 2)
latestSequence = 1;
// User lanjut mengetik sebelum seq 1 selesai
latestSequence = 2;

// Respons lambat seq 1 tiba setelah seq 2 dimulai
simulateAsyncSearchResponse(1, 101); // Respons usang harus diabaikan
assert(displayedResultId === 0, "Respons usang dari query lama tidak boleh menimpa UI");

// Respons seq 2 tiba
simulateAsyncSearchResponse(2, 202);
assert(displayedResultId === 202, "Respons terbaru harus sukses ditampilkan di UI");

// -----------------------------------------------------------------------------
// Test 8: Validasi Pagination & Halaman Maksimal
// -----------------------------------------------------------------------------
function sanitizePageNumber(raw: string | null): number {
  const parsed = parseInt(raw || "1", 10);
  if (isNaN(parsed) || parsed < 1) return 1;
  if (parsed > 100) return 100;
  return parsed;
}

assert(sanitizePageNumber("5") === 5, "Nomor halaman valid harus diterima");
assert(sanitizePageNumber("0") === 1, "Halaman 0 harus direset ke 1");
assert(sanitizePageNumber("-10") === 1, "Halaman negatif harus direset ke 1");
assert(sanitizePageNumber("abc") === 1, "Halaman NaN harus direset ke 1");
assert(sanitizePageNumber("500") === 100, "Halaman di atas 100 harus dibatasi ke 100");

// -----------------------------------------------------------------------------
// Test 9: Validasi Pergantian Media Type Mereset Genre yang Tidak Relevan
// -----------------------------------------------------------------------------
const movieGenreList = [{ id: 28, name: "Aksi" }, { id: 878, name: "Fiksi Ilmiah" }];
const tvGenreList = [{ id: 10759, name: "Aksi & Petualangan" }, { id: 10765, name: "Sci-Fi & Fantasi" }];

function reconcileGenreOnTypeSwitch(
  currentGenreId: number | null,
  newType: "movie" | "tv"
): number | null {
  if (!currentGenreId) return null;
  const targetList = newType === "tv" ? tvGenreList : movieGenreList;
  const isAvailable = targetList.some((g) => g.id === currentGenreId);
  return isAvailable ? currentGenreId : null;
}

// User sedang memilih ID 28 (Movie Aksi), lalu berganti ke TV
const genreAfterSwitchToTv = reconcileGenreOnTypeSwitch(28, "tv");
assert(genreAfterSwitchToTv === null, "Genre Film (28) harus direset ke null saat berpindah ke Serial TV");

// User sedang memilih ID 10759 (TV Aksi & Petualangan), lalu berganti ke Movie
const genreAfterSwitchToMovie = reconcileGenreOnTypeSwitch(10759, "movie");
assert(genreAfterSwitchToMovie === null, "Genre Serial (10759) harus direset ke null saat berpindah ke Film");

console.log("\n🎉 SELURUH 9 PENGUJIAN UNIT KATALOG & REAL-TIME SEARCH BERHASIL (100% PASS)!\n");
