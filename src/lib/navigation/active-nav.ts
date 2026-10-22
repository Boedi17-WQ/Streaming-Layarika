/**
 * Utility Active Navbar LayarRika
 * Menangani deteksi status aktif (exact & parent/turunan) untuk navigasi desktop dan mobile.
 */

export interface NavItemMatch {
  isExactActive: boolean;
  isParentActive: boolean;
  isActive: boolean;
}

/**
 * Memeriksa status aktif tautan navbar berdasarkan pathname saat ini
 * dan parameter tipe (movie/tv).
 *
 * Mengikuti aturan:
 * 1. Beranda ('/'): Hanya aktif jika pathname tepat '/'.
 * 2. Film ('/catalog?type=movie'): Exact aktif jika pathname '/catalog' dan type 'movie'.
 *    Parent aktif jika pathname di dalam '/movie/'.
 * 3. Serial ('/catalog?type=tv'): Exact aktif jika pathname '/catalog' dan type 'tv'.
 *    Parent aktif jika pathname di dalam '/tv/'.
 * 4. Katalog ('/catalog'): Exact aktif jika pathname '/catalog' dan tidak ada type.
 *    Parent aktif jika di '/catalog?type=...', '/movie/...', atau '/tv/...'.
 * 5. Watchlist, Playlists, Pricing, Search, Profile:
 *    Exact aktif jika pathname tepat sama dengan href.
 *    Parent aktif jika berada di sub-halaman (misal '/playlists/[id]').
 */
export function checkNavActive(
  pathname: string,
  searchParamsType: string | null = null,
  href: string
): NavItemMatch {
  // Normalisasi pathname tanpa trailing slash (kecuali root '/')
  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // 1. Beranda: persis '/'
  if (href === "/") {
    const isExact = cleanPath === "/";
    return {
      isExactActive: isExact,
      isParentActive: false,
      isActive: isExact,
    };
  }

  // 2. Film: '/catalog?type=movie'
  if (href === "/catalog?type=movie") {
    const isExact = cleanPath === "/catalog" && searchParamsType === "movie";
    const isParent = cleanPath.startsWith("/movie/") || cleanPath === "/movie";
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 3. Serial: '/catalog?type=tv'
  if (href === "/catalog?type=tv") {
    const isExact = cleanPath === "/catalog" && searchParamsType === "tv";
    const isParent = cleanPath.startsWith("/tv/") || cleanPath === "/tv";
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 4. Katalog Lengkap: '/catalog'
  if (href === "/catalog") {
    const isExact = cleanPath === "/catalog" && !searchParamsType;
    const isParent =
      (cleanPath === "/catalog" && Boolean(searchParamsType)) ||
      cleanPath.startsWith("/movie/") ||
      cleanPath.startsWith("/tv/");
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 5. Watchlist: '/watchlist'
  if (href === "/watchlist") {
    const isExact = cleanPath === "/watchlist";
    const isParent = cleanPath.startsWith("/watchlist/");
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 6. Playlists: '/playlists'
  if (href === "/playlists") {
    const isExact = cleanPath === "/playlists";
    const isParent = cleanPath.startsWith("/playlists/");
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 7. VIP / Pricing: '/pricing'
  if (href === "/pricing") {
    const isExact = cleanPath === "/pricing";
    const isParent = cleanPath.startsWith("/pricing/");
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 8. Search: '/search'
  if (href === "/search") {
    const isExact = cleanPath === "/search";
    const isParent = cleanPath.startsWith("/search/");
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // 9. Profile: '/profile'
  if (href === "/profile") {
    const isExact = cleanPath === "/profile";
    const isParent = cleanPath.startsWith("/profile/");
    return {
      isExactActive: isExact,
      isParentActive: isParent,
      isActive: isExact || isParent,
    };
  }

  // Default fallback
  const isExact = cleanPath === href;
  const isParent = !isExact && cleanPath.startsWith(`${href}/`);
  return {
    isExactActive: isExact,
    isParentActive: isParent,
    isActive: isExact || isParent,
  };
}
