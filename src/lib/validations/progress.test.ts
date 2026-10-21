import { validateWatchProgress } from "./progress";

console.log("🧪 Menjalankan pengujian logika validasi progres tontonan...");

// Test Case 1: Input valid normal
const test1 = validateWatchProgress({
  tmdbId: 969681,
  mediaType: "MOVIE",
  title: "Spider-Man: Brand New Day",
  progressSeconds: 1200,
  durationSeconds: 7200,
});
console.log("Test 1 (Valid Input):", test1.success ? "PASS" : `FAIL: ${test1.error}`);
if (!test1.success) process.exit(1);

// Test Case 2: Menolak progres negatif
const test2 = validateWatchProgress({
  tmdbId: 969681,
  mediaType: "MOVIE",
  title: "Spider-Man: Brand New Day",
  progressSeconds: -50,
  durationSeconds: 7200,
});
console.log(
  "Test 2 (Tolak Progres Negatif):",
  !test2.success && test2.error?.includes("negatif") ? "PASS" : "FAIL"
);
if (test2.success) process.exit(1);

// Test Case 3: Menolak progres melebihi total durasi
const test3 = validateWatchProgress({
  tmdbId: 969681,
  mediaType: "MOVIE",
  title: "Spider-Man: Brand New Day",
  progressSeconds: 9999,
  durationSeconds: 7200,
});
console.log(
  "Test 3 (Tolak Progres Melebihi Durasi):",
  !test3.success && test3.error?.includes("melebihi durasi") ? "PASS" : "FAIL"
);
if (test3.success) process.exit(1);

// Test Case 4: Menerima serial dengan season & episode
const test4 = validateWatchProgress({
  tmdbId: 1399,
  mediaType: "TV",
  title: "Game of Thrones",
  seasonNumber: 1,
  episodeNumber: 1,
  progressSeconds: 300,
  durationSeconds: 3600,
});
console.log("Test 4 (Valid Serial Episode):", test4.success ? "PASS" : `FAIL: ${test4.error}`);
if (!test4.success) process.exit(1);

// Test Case 5: Menerima media yang durasinya belum diketahui (durationSeconds = null)
const test5 = validateWatchProgress({
  tmdbId: 888,
  mediaType: "MOVIE",
  title: "Film Tanpa Durasi",
  progressSeconds: 450,
  durationSeconds: null,
});
console.log("Test 5 (Durasi Null Diterima):", test5.success ? "PASS" : `FAIL: ${test5.error}`);
if (!test5.success) process.exit(1);

console.log("✅ Seluruh 5 pengujian unit validasi progres tontonan LULUS!");
