/**
 * Unit Test: Streaming Providers Security & Media URL Validation
 * Menguji klasifikasi keamanan provider dan proteksi SSRF validator URL media
 */

import {
  STREAMING_PROVIDERS,
  ACTIVE_PLAYABLE_PROVIDERS,
  getStreamUrl,
  validateMediaStreamUrl,
} from "./providers";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("🧪 Menjalankan pengujian unit Streaming Security & SSRF Protection...");

// Test 1: Klasifikasi Hak Cipta Provider
assert(STREAMING_PROVIDERS.trailer.verificationStatus === "VERIFIED_LEGAL", "Trailer harus VERIFIED_LEGAL");
assert(STREAMING_PROVIDERS.trailer.isPlayable === true, "Trailer harus isPlayable true");
assert(STREAMING_PROVIDERS.trailer.isDefault === true, "Trailer harus menjadi provider default");

assert(STREAMING_PROVIDERS.demo.verificationStatus === "DEMO_OPEN_SOURCE", "Demo harus DEMO_OPEN_SOURCE");
assert(STREAMING_PROVIDERS.demo.isPlayable === true, "Demo harus isPlayable true");

assert(STREAMING_PROVIDERS.licensed.verificationStatus === "LICENSED_ENDPOINT", "Licensed harus LICENSED_ENDPOINT");

// Test 2: Server Pemutar Film Penuh Terdaftar
assert(STREAMING_PROVIDERS.multiembed.isPlayable === true, "MultiEmbed harus aktif untuk pemutaran film penuh");
assert(STREAMING_PROVIDERS.vidsrc.isPlayable === true, "VidSrc harus aktif untuk pemutaran alternatif");

// Test 3: Seluruh 5 provider terdaftar di ACTIVE_PLAYABLE_PROVIDERS
assert(ACTIVE_PLAYABLE_PROVIDERS.length === 5, "Harus terdapat 5 opsi sumber pemutar");

// Test 4: Trailer URL Generator dengan YouTube No-Cookie
const trailerUrl = getStreamUrl({
  providerId: "trailer",
  tmdbId: 939243,
  mediaType: "MOVIE",
  youtubeKey: "dQw4w9WgXcQ",
});
assert(
  trailerUrl === "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0",
  `Trailer URL harus mengarah ke youtube-nocookie: ${trailerUrl}`
);

// Test 5: MultiEmbed URL Generator
const multiembedUrl = getStreamUrl({
  providerId: "multiembed",
  tmdbId: 939243,
  mediaType: "MOVIE",
});
assert(
  multiembedUrl === "https://multiembed.mov/?video_id=939243&tmdb=1",
  `MultiEmbed URL harus valid: ${multiembedUrl}`
);

// Test 6: SSRF Protection - Tolak IP Privat & Localhost
const localIpTest = validateMediaStreamUrl("https://127.0.0.1/stream.m3u8");
assert(localIpTest.valid === false, "Harus menolak loopback IP 127.0.0.1 (SSRF)");

const privateIpTest = validateMediaStreamUrl("https://192.168.1.100/manifest.m3u8");
assert(privateIpTest.valid === false, "Harus menolak IP privat 192.168.x (SSRF)");

const localhostTest = validateMediaStreamUrl("https://localhost:3000/video.mp4");
assert(localhostTest.valid === false, "Harus menolak hostname localhost (SSRF)");

// Test 7: Skema URL non-HTTPS harus ditolak
const httpTest = validateMediaStreamUrl("http://commondatastorage.googleapis.com/sample.mp4");
assert(httpTest.valid === false, "Harus menolak protokol HTTP tanpa enkripsi");

const fileTest = validateMediaStreamUrl("file:///etc/passwd");
assert(fileTest.valid === false, "Harus menolak skema file://");

const javascriptTest = validateMediaStreamUrl("javascript:alert(1)");
assert(javascriptTest.valid === false, "Harus menolak skema javascript:");

// Test 8: URL Host Berlisensi Terdaftar harus diterima
const validStream = validateMediaStreamUrl("https://commondatastorage.googleapis.com/sample.mp4");
assert(validStream.valid === true, "Harus menerima host berlisensi terpercaya");

console.log("\n🎉 SELURUH 8 PENGUJIAN KEAMANAN STREAMING & SSRF BERHASIL (100% PASS)!\n");
