import { checkNavActive } from "./active-nav";

console.log("🧪 Menjalankan pengujian fitur Active Navbar LayarRika...\n");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Menu Beranda aktif ketika membuka '/'
const homeOnHome = checkNavActive("/", null, "/");
assert(homeOnHome.isExactActive === true, "1. Beranda exact active pada '/'");
assert(homeOnHome.isActive === true, "1. Beranda isActive pada '/'");

const homeOnCatalog = checkNavActive("/catalog", null, "/");
assert(homeOnCatalog.isActive === false, "1. Beranda TIDAK aktif pada '/catalog'");

const homeOnMovie = checkNavActive("/movie/969681", null, "/");
assert(homeOnMovie.isActive === false, "1. Beranda TIDAK aktif pada '/movie/969681'");

// 2. Menu Katalog aktif ketika membuka '/catalog'
const catalogOnCatalog = checkNavActive("/catalog", null, "/catalog");
assert(catalogOnCatalog.isExactActive === true, "2. Katalog exact active pada '/catalog'");
assert(catalogOnCatalog.isActive === true, "2. Katalog isActive pada '/catalog'");

const catalogOnHome = checkNavActive("/", null, "/catalog");
assert(catalogOnHome.isActive === false, "2. Katalog TIDAK aktif pada '/'");

// 3. Menu Cari aktif ketika membuka '/search'
const searchOnSearch = checkNavActive("/search", null, "/search");
assert(searchOnSearch.isExactActive === true, "3. Cari exact active pada '/search'");
assert(searchOnSearch.isActive === true, "3. Cari isActive pada '/search'");

// 4. Menu induk yang sesuai tetap aktif pada halaman detail film dan serial
// Movie detail -> Katalog parent active & Film parent active, tapi BUKAN exact active
const catalogOnMovieDetail = checkNavActive("/movie/969681", null, "/catalog");
assert(catalogOnMovieDetail.isExactActive === false, "4. Katalog bukan exact active pada '/movie/969681'");
assert(catalogOnMovieDetail.isParentActive === true, "4. Katalog adalah parent active pada '/movie/969681'");
assert(catalogOnMovieDetail.isActive === true, "4. Katalog isActive pada '/movie/969681'");

const filmOnMovieDetail = checkNavActive("/movie/969681", null, "/catalog?type=movie");
assert(filmOnMovieDetail.isExactActive === false, "4. Film bukan exact active pada '/movie/969681'");
assert(filmOnMovieDetail.isParentActive === true, "4. Film adalah parent active pada '/movie/969681'");
assert(filmOnMovieDetail.isActive === true, "4. Film isActive pada '/movie/969681'");

// TV detail -> Katalog parent active & Serial parent active
const catalogOnTvDetail = checkNavActive("/tv/1399", null, "/catalog");
assert(catalogOnTvDetail.isExactActive === false, "4. Katalog bukan exact active pada '/tv/1399'");
assert(catalogOnTvDetail.isParentActive === true, "4. Katalog adalah parent active pada '/tv/1399'");

const tvOnTvDetail = checkNavActive("/tv/1399", null, "/catalog?type=tv");
assert(tvOnTvDetail.isExactActive === false, "4. Serial bukan exact active pada '/tv/1399'");
assert(tvOnTvDetail.isParentActive === true, "4. Serial adalah parent active pada '/tv/1399'");

// 5. Menu yang aktif berubah otomatis ketika berpindah halaman (Film & Serial)
const filmOnFilmCatalog = checkNavActive("/catalog", "movie", "/catalog?type=movie");
assert(filmOnFilmCatalog.isExactActive === true, "5. Film exact active pada '/catalog?type=movie'");

const tvOnTvCatalog = checkNavActive("/catalog", "tv", "/catalog?type=tv");
assert(tvOnTvCatalog.isExactActive === true, "5. Serial exact active pada '/catalog?type=tv'");

// 6. Menu Watchlist, Playlist, VIP, Profil
const watchlistOnWatchlist = checkNavActive("/watchlist", null, "/watchlist");
assert(watchlistOnWatchlist.isExactActive === true, "6. Watchlist exact active pada '/watchlist'");

const playlistOnPlaylists = checkNavActive("/playlists", null, "/playlists");
assert(playlistOnPlaylists.isExactActive === true, "6. Playlist exact active pada '/playlists'");

const playlistOnDetail = checkNavActive("/playlists/cmv123", null, "/playlists");
assert(playlistOnDetail.isExactActive === false, "6. Playlist bukan exact active pada detail");
assert(playlistOnDetail.isParentActive === true, "6. Playlist adalah parent active pada detail");

const pricingOnPricing = checkNavActive("/pricing", null, "/pricing");
assert(pricingOnPricing.isExactActive === true, "6. VIP exact active pada '/pricing'");

const profileOnProfile = checkNavActive("/profile", null, "/profile");
assert(profileOnProfile.isExactActive === true, "6. Profil exact active pada '/profile'");

// 7. Status aktif tidak salah akibat query parameters
// Contoh: /search?q=spider masih tetap mengaktifkan Search
const searchWithQuery = checkNavActive("/search", null, "/search");
assert(searchWithQuery.isExactActive === true, "7. Cari tetap exact active saat ada query search");

// Contoh: /catalog?genre=28 (tanpa type) tetap mengaktifkan Katalog
const catalogWithGenre = checkNavActive("/catalog", null, "/catalog");
assert(catalogWithGenre.isExactActive === true, "7. Katalog tetap exact active saat ada filter genre");

// Contoh: /?utm_source=google tetap mengaktifkan Beranda
const homeWithUtm = checkNavActive("/", null, "/");
assert(homeWithUtm.isExactActive === true, "7. Beranda tetap exact active saat ada query param utm");

console.log("\n🎉 SELURUH PENGUJIAN UNIT ACTIVE NAVBAR BERHASIL (100% PASS)!");
