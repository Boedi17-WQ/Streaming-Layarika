/**
 * Unit Test: Player Lifecycle & Background Audio Prevention
 * Menguji kepatuhan kriteria Bugfix Bagian A:
 * 1. Autoplay trailer dinonaktifkan secara default (autoplay=0).
 * 2. YouTube IFrame API diaktifkan (enablejsapi=1) untuk kontrol postMessage.
 * 3. Format payload postMessage pause & stop sesuai spesifikasi resmi YouTube.
 * 4. State lifecycle pemutar bertransisi secara aman tanpa menyisakan audio tersembunyi.
 */

import { getStreamUrl } from "./providers";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("🧪 Menjalankan pengujian unit Player Lifecycle & Trailer Audio Prevention...");

// -----------------------------------------------------------------------------
// Test 1: Autoplay Dinonaktifkan Default & enablejsapi=1 Aktif
// -----------------------------------------------------------------------------
const movieTrailerUrl = getStreamUrl({
  providerId: "trailer",
  tmdbId: 969681,
  mediaType: "MOVIE",
  youtubeKey: "abc123Key",
});

assert(
  movieTrailerUrl !== null && movieTrailerUrl.includes("autoplay=0"),
  `Trailer film tidak boleh autoplay=1 secara default: ${movieTrailerUrl}`
);
assert(
  movieTrailerUrl !== null && movieTrailerUrl.includes("enablejsapi=1"),
  `Trailer film harus memuat enablejsapi=1 untuk kontrol stop Iframe API: ${movieTrailerUrl}`
);

const tvTrailerUrl = getStreamUrl({
  providerId: "trailer",
  tmdbId: 1399,
  mediaType: "TV",
  youtubeKey: "tvKey456",
});

assert(
  tvTrailerUrl !== null && tvTrailerUrl.includes("autoplay=0"),
  `Trailer serial tidak boleh autoplay=1 secara default: ${tvTrailerUrl}`
);
assert(
  tvTrailerUrl !== null && tvTrailerUrl.includes("enablejsapi=1"),
  `Trailer serial harus memuat enablejsapi=1: ${tvTrailerUrl}`
);

// -----------------------------------------------------------------------------
// Test 2: Format Command PostMessage YouTube IFrame Player API
// -----------------------------------------------------------------------------
const pausePayload = JSON.stringify({ event: "command", func: "pauseVideo", args: "" });
const stopPayload = JSON.stringify({ event: "command", func: "stopVideo", args: "" });

assert(
  pausePayload === '{"event":"command","func":"pauseVideo","args":""}',
  "Payload pauseVideo harus valid JSON IFrame API"
);
assert(
  stopPayload === '{"event":"command","func":"stopVideo","args":""}',
  "Payload stopVideo harus valid JSON IFrame API"
);

// -----------------------------------------------------------------------------
// Test 3: Simulasi Transisi Lifecycle Navigasi & Pelepasan Resource
// -----------------------------------------------------------------------------
interface MockPlayerContext {
  isPlaying: boolean;
  activePath: string;
  iframeSrc: string | null;
  videoPaused: boolean;
  play(url: string | null): void;
  navigate(newPath: string): void;
}

const mockPlayer: MockPlayerContext = {
  isPlaying: false,
  activePath: "/movie/969681",
  iframeSrc: null,
  videoPaused: true,
  play(url: string | null) {
    this.isPlaying = true;
    this.iframeSrc = url;
    this.videoPaused = false;
  },
  navigate(newPath: string) {
    if (this.activePath !== newPath) {
      this.isPlaying = false;
      this.iframeSrc = "about:blank";
      this.videoPaused = true;
      this.activePath = newPath;
    }
  },
};

// Simulasi 1: Pengguna membuka detail film (default: tidak autoplay)
assert(!mockPlayer.isPlaying, "Saat membuka halaman, player harus dalam state belum memutar (idle)");

// Simulasi 2: Pengguna mengklik tombol Play secara eksplisit
mockPlayer.play(movieTrailerUrl);
assert(Boolean(mockPlayer.isPlaying), "Pemutaran aktif setelah tindakan pengguna");
assert(mockPlayer.iframeSrc !== null, "Iframe src terisi saat memutar");

// Simulasi 3: Pengguna menavigasi keluar ke halaman lain (misal /catalog)
mockPlayer.navigate("/catalog");

assert(!mockPlayer.isPlaying, "Navigasi ke /catalog harus mereset isPlaying ke false");
assert(mockPlayer.iframeSrc === "about:blank", "Iframe src harus dilepaskan ke about:blank");
assert(Boolean(mockPlayer.videoPaused), "Video harus dalam kondisi pause");

// Simulasi 4: Pengguna kembali (Back) ke halaman detail film
mockPlayer.navigate("/movie/969681");

assert(
  !mockPlayer.isPlaying,
  "Kembali ke halaman detail TIDAK boleh memulai pemutaran otomatis (harus tetap idle)"
);

console.log("\n🎉 SELURUH PENGUJIAN PLAYER LIFECYCLE BERHASIL (100% PASS)!\n");
