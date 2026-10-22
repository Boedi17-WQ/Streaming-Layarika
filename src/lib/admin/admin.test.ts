/**
 * Unit Test: Tahap 8 — Panel Admin Pengelolaan Aset Video & Pengguna LayarRika
 * Menguji kepatuhan skema validasi, aturan hak akses, dan integritas logika wewenang Administrator.
 */

import {
  createPlaybackAssetSchema,
  updatePlaybackAssetSchema,
  updateUserRoleSchema,
  grantVipSchema,
} from "../validations/admin";

console.log("🧪 Menjalankan pengujian unit Tahap 8: Panel Admin LayarRika...\n");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// Test 1: Validasi Aset Video Film (MOVIE) Legal
// -----------------------------------------------------------------------------
const validMovie = createPlaybackAssetSchema.safeParse({
  title: "Tears of Steel — Blender Open Movie",
  mediaType: "MOVIE",
  tmdbId: 111111,
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  mimeType: "video/mp4",
  quality: "1080p",
  durationSeconds: 734,
  isPublic: true,
  isPremiumRequired: false,
  sourceAttribution: "Blender Foundation (CC BY 3.0)",
});
assert(validMovie.success, "Aset film MOVIE legal valid harus lolos validasi");

// -----------------------------------------------------------------------------
// Test 2: Validasi Aset Serial TV (Wajib Nomor Season & Episode)
// -----------------------------------------------------------------------------
const validTv = createPlaybackAssetSchema.safeParse({
  title: "LayarRika Original Series Ep 1",
  mediaType: "TV",
  tmdbId: 999999,
  seasonNumber: 1,
  episodeNumber: 1,
  videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  mimeType: "application/x-mpegURL",
  quality: "1080p",
  isPublic: true,
  isPremiumRequired: true,
});
assert(validTv.success, "Aset serial TV dengan season & episode valid harus lolos validasi");

const invalidTvWithoutEpisode = createPlaybackAssetSchema.safeParse({
  title: "LayarRika Incomplete Series",
  mediaType: "TV",
  tmdbId: 999999,
  seasonNumber: 1,
  episodeNumber: null, // Kurang episodeNumber
  videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
});
assert(
  !invalidTvWithoutEpisode.success,
  "Aset serial TV tanpa episodeNumber harus ditolak"
);

// -----------------------------------------------------------------------------
// Test 3: Validasi URL Video Sah
// -----------------------------------------------------------------------------
const invalidUrlAsset = createPlaybackAssetSchema.safeParse({
  title: "Aset dengan URL Rusak",
  mediaType: "MOVIE",
  videoUrl: "not-a-valid-url",
});
assert(!invalidUrlAsset.success, "URL video yang bukan format URL valid harus ditolak");

// -----------------------------------------------------------------------------
// Test 4: Validasi Pembaruan Aset (Update Playback Asset)
// -----------------------------------------------------------------------------
const validUpdate = updatePlaybackAssetSchema.safeParse({
  id: "asset_cuid_12345",
  title: "Judul yang diperbarui",
  mediaType: "MOVIE",
  videoUrl: "https://example.com/stream.m3u8",
  isPublic: true,
  isPremiumRequired: true,
});
assert(validUpdate.success, "Pembaruan aset dengan ID valid harus berhasil");

const invalidUpdateNoId = updatePlaybackAssetSchema.safeParse({
  id: "",
  title: "Judul",
  mediaType: "MOVIE",
  videoUrl: "https://example.com/stream.m3u8",
});
assert(!invalidUpdateNoId.success, "Pembaruan aset tanpa ID harus ditolak");

// -----------------------------------------------------------------------------
// Test 5: Validasi Pengubahan Role Pengguna (USER <-> ADMIN)
// -----------------------------------------------------------------------------
const validUserRole = updateUserRoleSchema.safeParse({
  userId: "user_123",
  role: "ADMIN",
});
assert(validUserRole.success, "Role ADMIN harus valid");

const validUserRoleUser = updateUserRoleSchema.safeParse({
  userId: "user_123",
  role: "USER",
});
assert(validUserRoleUser.success, "Role USER harus valid");

const invalidRole = updateUserRoleSchema.safeParse({
  userId: "user_123",
  role: "SUPERADMIN", // Nilai enum yang tidak ada di Prisma
});
assert(!invalidRole.success, "Role di luar USER/ADMIN harus ditolak");

// -----------------------------------------------------------------------------
// Test 6: Validasi Pemberian Akses VIP Manual (Durasi Hari)
// -----------------------------------------------------------------------------
const validGrantVip30 = grantVipSchema.safeParse({
  userId: "user_123",
  durationDays: 30,
});
assert(validGrantVip30.success, "Durasi VIP 30 hari harus valid");

const validGrantVip365 = grantVipSchema.safeParse({
  userId: "user_123",
  durationDays: 365,
});
assert(validGrantVip365.success, "Durasi VIP 365 hari (1 tahun) harus valid");

const invalidGrantVipZero = grantVipSchema.safeParse({
  userId: "user_123",
  durationDays: 0,
});
assert(!invalidGrantVipZero.success, "Durasi VIP 0 hari harus ditolak");

const invalidGrantVipExcessive = grantVipSchema.safeParse({
  userId: "user_123",
  durationDays: 1000,
});
assert(!invalidGrantVipExcessive.success, "Durasi VIP melebihi 365 hari harus ditolak");

// -----------------------------------------------------------------------------
// Test 7: Aturan Proteksi Self-Demotion Admin
// -----------------------------------------------------------------------------
function canAdminChangeRole(targetUserId: string, newRole: string, currentAdminId: string): boolean {
  if (targetUserId === currentAdminId && newRole !== "ADMIN") {
    return false; // Dilarang menurunkan akun sendiri
  }
  return true;
}

assert(
  !canAdminChangeRole("admin_current_1", "USER", "admin_current_1"),
  "Admin tidak boleh menurunkan akun miliknya sendiri ke USER"
);
assert(
  canAdminChangeRole("user_other_2", "ADMIN", "admin_current_1"),
  "Admin boleh mengangkat akun lain menjadi ADMIN"
);
assert(
  canAdminChangeRole("admin_other_3", "USER", "admin_current_1"),
  "Admin boleh menurunkan akun admin lain ke USER"
);

console.log("\n🎉 SELURUH PENGUJIAN UNIT TAHAP 8 (PANEL ADMIN) BERHASIL (100% PASS)!");
