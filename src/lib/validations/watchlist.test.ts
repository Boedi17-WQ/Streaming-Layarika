import { z } from "zod";
import { validateWatchProgress } from "./progress";

console.log("🧪 Menjalankan pengujian unit komprehensif Watchlist & Watch History...\n");

// -----------------------------------------------------------------------------
// 1. PENGUJIAN SKEMA WATCHLIST
// -----------------------------------------------------------------------------

const watchlistInputSchema = z.object({
  tmdbId: z.number().int().positive("ID TMDB harus bernilai positif"),
  mediaType: z.enum(["MOVIE", "TV"], { message: "Jenis media harus MOVIE atau TV" }),
  title: z.string().min(1, "Judul wajib disertakan"),
  posterPath: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
});

// Test 1: Input Watchlist Film Valid
const wl1 = watchlistInputSchema.safeParse({
  tmdbId: 550,
  mediaType: "MOVIE",
  title: "Fight Club",
  posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  rating: 8.4,
  releaseYear: 1999,
});
console.log("Watchlist Test 1 (Input Film Valid):", wl1.success ? "PASS" : "FAIL");
if (!wl1.success) process.exit(1);

// Test 2: Input Watchlist Serial TV Valid
const wl2 = watchlistInputSchema.safeParse({
  tmdbId: 1399,
  mediaType: "TV",
  title: "Game of Thrones",
  rating: 8.5,
  releaseYear: 2011,
});
console.log("Watchlist Test 2 (Input Serial TV Valid):", wl2.success ? "PASS" : "FAIL");
if (!wl2.success) process.exit(1);

// Test 3: Tolak MediaType tidak valid (misal: "ANIME", "PODCAST")
const wl3 = watchlistInputSchema.safeParse({
  tmdbId: 123,
  mediaType: "ANIME",
  title: "Attack on Titan",
});
console.log("Watchlist Test 3 (Tolak Jenis Media Tidak Valid):", !wl3.success ? "PASS" : "FAIL");
if (wl3.success) process.exit(1);

// Test 4: Tolak TMDB ID negatif atau nol
const wl4 = watchlistInputSchema.safeParse({
  tmdbId: -1,
  mediaType: "MOVIE",
  title: "Invalid ID Film",
});
console.log("Watchlist Test 4 (Tolak TMDB ID Negatif):", !wl4.success ? "PASS" : "FAIL");
if (wl4.success) process.exit(1);

// Test 5: Tolak Judul kosong
const wl5 = watchlistInputSchema.safeParse({
  tmdbId: 123,
  mediaType: "MOVIE",
  title: "",
});
console.log("Watchlist Test 5 (Tolak Judul Kosong):", !wl5.success ? "PASS" : "FAIL");
if (wl5.success) process.exit(1);

// -----------------------------------------------------------------------------
// 2. PENGUJIAN SKEMA WATCH HISTORY & PROGRES
// -----------------------------------------------------------------------------

// Test 6: Input Progres Valid
const wh1 = validateWatchProgress({
  tmdbId: 100,
  mediaType: "MOVIE",
  title: "Interstellar",
  progressSeconds: 3600,
  durationSeconds: 10140,
});
console.log("History Test 6 (Progres Film Valid):", wh1.success ? "PASS" : "FAIL");
if (!wh1.success) process.exit(1);

// Test 7: Tolak Progres Negatif
const wh2 = validateWatchProgress({
  tmdbId: 100,
  mediaType: "MOVIE",
  title: "Interstellar",
  progressSeconds: -120,
  durationSeconds: 10140,
});
console.log("History Test 7 (Tolak Progres Negatif):", !wh2.success ? "PASS" : "FAIL");
if (wh2.success) process.exit(1);

// Test 8: Tolak Progres Melebihi Durasi Total
const wh3 = validateWatchProgress({
  tmdbId: 100,
  mediaType: "MOVIE",
  title: "Interstellar",
  progressSeconds: 15000,
  durationSeconds: 10140,
});
console.log("History Test 8 (Tolak Progres > Durasi):", !wh3.success ? "PASS" : "FAIL");
if (wh3.success) process.exit(1);

// Test 9: Tolak Durasi Negatif atau Nol
const wh4 = validateWatchProgress({
  tmdbId: 100,
  mediaType: "MOVIE",
  title: "Interstellar",
  progressSeconds: 300,
  durationSeconds: -50,
});
console.log("History Test 9 (Tolak Durasi Negatif):", !wh4.success ? "PASS" : "FAIL");
if (wh4.success) process.exit(1);

// Test 10: Dukung Episode Serial TV Secara Eksplisit (S2 : E5)
const wh5 = validateWatchProgress({
  tmdbId: 60625,
  mediaType: "TV",
  title: "Rick and Morty",
  seasonNumber: 2,
  episodeNumber: 5,
  progressSeconds: 600,
  durationSeconds: 1320,
});
console.log("History Test 10 (Valid Serial Episode):", wh5.success ? "PASS" : "FAIL");
if (!wh5.success) process.exit(1);

// Test 11: Tolak Nilai NaN atau Infinity
const wh6 = validateWatchProgress({
  tmdbId: 100,
  mediaType: "MOVIE",
  title: "NaN Test",
  progressSeconds: NaN,
});
console.log("History Test 11 (Tolak Nilai NaN):", !wh6.success ? "PASS" : "FAIL");
if (wh6.success) process.exit(1);

console.log("\n✅ SELURUH 11 PENGUJIAN UNIT WATCHLIST & WATCH HISTORY BERHASIL (PASS)!");
