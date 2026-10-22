import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistItemSchema,
  removePlaylistItemSchema,
  reorderPlaylistItemsSchema,
} from "./playlist";

console.log("🧪 Menjalankan pengujian unit Custom Playlists (Validation & Integrity)...\n");

// -----------------------------------------------------------------------------
// 1. Pengujian Pembuatan Playlist (createPlaylistSchema)
// -----------------------------------------------------------------------------

// Test 1: Pembuatan playlist valid
const cp1 = createPlaylistSchema.safeParse({
  name: "Film Horor Favorit",
  description: "Koleksi tontonan malam Jumat sinematik",
});
console.log("Test 1 (Buat Playlist Valid):", cp1.success ? "PASS" : "FAIL");
if (!cp1.success) process.exit(1);

// Test 2: Tolak nama kosong
const cp2 = createPlaylistSchema.safeParse({
  name: "",
  description: "Deskripsi tanpa nama",
});
console.log("Test 2 (Tolak Nama Kosong):", !cp2.success ? "PASS" : "FAIL");
if (cp2.success) process.exit(1);

// Test 3: Tolak nama hanya whitespace
const cp3 = createPlaylistSchema.safeParse({
  name: "    ",
  description: "Deskripsi",
});
console.log("Test 3 (Tolak Nama Hanya Spasi):", !cp3.success ? "PASS" : "FAIL");
if (cp3.success) process.exit(1);

// Test 4: Tolak nama melebihi 100 karakter
const cp4 = createPlaylistSchema.safeParse({
  name: "A".repeat(101),
});
console.log("Test 4 (Tolak Nama > 100 Karakter):", !cp4.success ? "PASS" : "FAIL");
if (cp4.success) process.exit(1);

// Test 5: Izinkan deskripsi kosong/null/undefined
const cp5 = createPlaylistSchema.safeParse({
  name: "Maraton Akhir Pekan",
  description: null,
});
console.log("Test 5 (Deskripsi Opsional/Null):", cp5.success ? "PASS" : "FAIL");
if (!cp5.success) process.exit(1);

// -----------------------------------------------------------------------------
// 2. Pengujian Update Playlist (updatePlaylistSchema)
// -----------------------------------------------------------------------------

// Test 6: Update playlist valid
const up1 = updatePlaylistSchema.safeParse({
  id: "clx123playlist",
  name: "Daftar Tontonan Liburan Baru",
  description: "Diperbarui untuk liburan panjang",
});
console.log("Test 6 (Update Playlist Valid):", up1.success ? "PASS" : "FAIL");
if (!up1.success) process.exit(1);

// Test 7: Tolak update tanpa ID
const up2 = updatePlaylistSchema.safeParse({
  id: "",
  name: "Nama Baru",
});
console.log("Test 7 (Tolak Update Tanpa ID):", !up2.success ? "PASS" : "FAIL");
if (up2.success) process.exit(1);

// -----------------------------------------------------------------------------
// 3. Pengujian Tambah Item Playlist (addPlaylistItemSchema)
// -----------------------------------------------------------------------------

// Test 8: Tambah film ke playlist valid
const api1 = addPlaylistItemSchema.safeParse({
  playlistId: "clx123playlist",
  tmdbId: 550,
  mediaType: "MOVIE",
  title: "Fight Club",
  posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
});
console.log("Test 8 (Tambah Film Valid):", api1.success ? "PASS" : "FAIL");
if (!api1.success) process.exit(1);

// Test 9: Tambah serial ke playlist valid
const api2 = addPlaylistItemSchema.safeParse({
  playlistId: "clx123playlist",
  tmdbId: 1399,
  mediaType: "TV",
  title: "Game of Thrones",
  posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
});
console.log("Test 9 (Tambah Serial Valid):", api2.success ? "PASS" : "FAIL");
if (!api2.success) process.exit(1);

// Test 10: Tolak mediaType tidak valid
const api3 = addPlaylistItemSchema.safeParse({
  playlistId: "clx123playlist",
  tmdbId: 123,
  mediaType: "PODCAST",
  title: "Episode 1",
});
console.log("Test 10 (Tolak MediaType Ilegal):", !api3.success ? "PASS" : "FAIL");
if (api3.success) process.exit(1);

// Test 11: Tolak TMDB ID negatif
const api4 = addPlaylistItemSchema.safeParse({
  playlistId: "clx123playlist",
  tmdbId: -99,
  mediaType: "MOVIE",
  title: "Film Salah",
});
console.log("Test 11 (Tolak TMDB ID Negatif):", !api4.success ? "PASS" : "FAIL");
if (api4.success) process.exit(1);

// -----------------------------------------------------------------------------
// 4. Pengujian Hapus & Reorder Item
// -----------------------------------------------------------------------------

// Test 12: Hapus item valid
const rmi1 = removePlaylistItemSchema.safeParse({
  playlistId: "clx123playlist",
  itemId: "clxitem456",
});
console.log("Test 12 (Hapus Item Valid):", rmi1.success ? "PASS" : "FAIL");
if (!rmi1.success) process.exit(1);

// Test 13: Reorder valid
const re1 = reorderPlaylistItemsSchema.safeParse({
  playlistId: "clx123playlist",
  itemIds: ["item-3", "item-1", "item-2"],
});
console.log("Test 13 (Reorder Urutan Valid):", re1.success ? "PASS" : "FAIL");
if (!re1.success) process.exit(1);

// Test 14: Tolak reorder dengan itemIds kosong
const re2 = reorderPlaylistItemsSchema.safeParse({
  playlistId: "clx123playlist",
  itemIds: [],
});
console.log("Test 14 (Tolak Reorder Kosong):", !re2.success ? "PASS" : "FAIL");
if (re2.success) process.exit(1);

console.log("\n✅ SELURUH 14 PENGUJIAN UNIT CUSTOM PLAYLIST BERHASIL (PASS)!");
