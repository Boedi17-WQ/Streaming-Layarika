"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  FilmReel,
  House,
  MagnifyingGlass,
  SignIn,
  SignOut,
  List,
  X,
  Crown,
} from "@phosphor-icons/react";
import { handleSignOut } from "@/app/actions/auth";
import { checkNavActive, NavItemMatch } from "@/lib/navigation/active-nav";

export interface SiteHeaderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isVip?: boolean;
}

interface SiteHeaderProps {
  user?: SiteHeaderUser | null;
}

/**
 * Sinkronisasi parameter query `type` (movie/tv) untuk membedakan tab Film & Serial.
 * Dijalankan dalam Suspense boundary agar tidak menyebabkan deopt prerender.
 */
function SearchParamsWatcher({
  onTypeChange,
}: {
  onTypeChange: (type: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  useEffect(() => {
    onTypeChange(type);
  }, [type, onTypeChange]);

  return null;
}

function getDesktopNavClass(match: NavItemMatch, isVip = false): string {
  if (isVip) {
    if (match.isExactActive) {
      return "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#D9A52E] bg-[#D9A52E]/15 border border-[#D9A52E]/50 shadow-sm shadow-[#D9A52E]/10 transition";
    }
    return "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#D9A52E] hover:bg-[#171717]/80 hover:text-[#f3c254] transition border border-transparent";
  }

  if (match.isExactActive) {
    return "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#D9A52E] bg-[#D9A52E]/10 border border-[#D9A52E]/30 shadow-xs shadow-[#D9A52E]/10 transition";
  }

  if (match.isParentActive) {
    return "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#F5F5F5] bg-[#171717] border border-[#292929] hover:text-[#D9A52E] hover:border-[#D9A52E]/40 transition";
  }

  return "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717]/60 border border-transparent transition";
}

function getMobileNavClass(match: NavItemMatch, isVip = false): string {
  if (isVip) {
    if (match.isExactActive) {
      return "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-[#D9A52E] bg-[#D9A52E]/15 border-l-2 border-[#D9A52E] transition";
    }
    return "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[#D9A52E] hover:bg-[#171717] transition";
  }

  if (match.isExactActive) {
    return "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#D9A52E] bg-[#D9A52E]/10 border-l-2 border-[#D9A52E] transition";
  }

  if (match.isParentActive) {
    return "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#F5F5F5] bg-[#171717]/60 border-l-2 border-[#D9A52E]/40 transition";
  }

  return "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717] transition";
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [searchParamsType, setSearchParamsType] = useState<string | null>(null);

  const handleTypeChange = useCallback((type: string | null) => {
    setSearchParamsType(type);
  }, []);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Periksa status aktif untuk setiap item menu navigasi
  const homeMatch = checkNavActive(pathname, searchParamsType, "/");
  const catalogMatch = checkNavActive(pathname, searchParamsType, "/catalog");
  const movieMatch = checkNavActive(pathname, searchParamsType, "/catalog?type=movie");
  const tvMatch = checkNavActive(pathname, searchParamsType, "/catalog?type=tv");
  const watchlistMatch = checkNavActive(pathname, searchParamsType, "/watchlist");
  const playlistMatch = checkNavActive(pathname, searchParamsType, "/playlists");
  const vipMatch = checkNavActive(pathname, searchParamsType, "/pricing");
  const searchMatch = checkNavActive(pathname, searchParamsType, "/search");
  const profileMatch = checkNavActive(pathname, searchParamsType, "/profile");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#292929] bg-[#0A0A0A]/90 backdrop-blur-md transition-colors">
      <Suspense fallback={null}>
        <SearchParamsWatcher onTypeChange={handleTypeChange} />
      </Suspense>

      <Container className="flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#F5F5F5] transition hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E] shadow-sm transition group-hover:border-[#D9A52E]">
              <FilmReel size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-wider">
                LAYAR<span className="text-[#D9A52E]">RIKA</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#A3A3A3] -mt-1 font-medium">
                Sinematik
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 text-sm font-medium"
          >
            {/* 1. Beranda */}
            <Link
              href="/"
              aria-current={homeMatch.isExactActive ? "page" : undefined}
              className={getDesktopNavClass(homeMatch)}
            >
              <House
                size={16}
                weight={homeMatch.isExactActive ? "fill" : "regular"}
                className={homeMatch.isActive ? "text-[#D9A52E]" : undefined}
              />
              <span>Beranda</span>
            </Link>

            {/* 2. Katalog */}
            <Link
              href="/catalog"
              aria-current={catalogMatch.isExactActive ? "page" : undefined}
              title={catalogMatch.isParentActive && !catalogMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
              className={getDesktopNavClass(catalogMatch)}
            >
              <FilmReel
                size={16}
                weight={catalogMatch.isExactActive ? "fill" : "regular"}
                className={catalogMatch.isActive ? "text-[#D9A52E]" : undefined}
              />
              <span>Katalog</span>
            </Link>

            {/* 3. Film */}
            <Link
              href="/catalog?type=movie"
              aria-current={movieMatch.isExactActive ? "page" : undefined}
              title={movieMatch.isParentActive && !movieMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
              className={getDesktopNavClass(movieMatch)}
            >
              <span>Film</span>
            </Link>

            {/* 4. Serial */}
            <Link
              href="/catalog?type=tv"
              aria-current={tvMatch.isExactActive ? "page" : undefined}
              title={tvMatch.isParentActive && !tvMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
              className={getDesktopNavClass(tvMatch)}
            >
              <span>Serial</span>
            </Link>

            {/* 5. Watchlist & Playlist (Khusus Pengguna Login) */}
            {user && (
              <>
                <Link
                  href="/watchlist"
                  aria-current={watchlistMatch.isExactActive ? "page" : undefined}
                  className={getDesktopNavClass(watchlistMatch)}
                >
                  <span>Watchlist</span>
                </Link>
                <Link
                  href="/playlists"
                  aria-current={playlistMatch.isExactActive ? "page" : undefined}
                  title={playlistMatch.isParentActive && !playlistMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
                  className={getDesktopNavClass(playlistMatch)}
                >
                  <span>Playlist</span>
                </Link>
              </>
            )}

            {/* 6. Paket VIP */}
            <Link
              href="/pricing"
              aria-current={vipMatch.isExactActive ? "page" : undefined}
              className={getDesktopNavClass(vipMatch, true)}
            >
              <Crown
                size={15}
                weight="fill"
                className={vipMatch.isExactActive ? "text-[#D9A52E]" : undefined}
              />
              <span>VIP</span>
            </Link>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {/* VIP Badge on Desktop */}
          {user?.isVip && (
            <Link
              href="/pricing"
              title="Status Langganan: VIP Member Aktif"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D9A52E]/20 via-[#D9A52E]/10 to-transparent border border-[#D9A52E]/40 text-[#D9A52E] text-[11px] font-black uppercase tracking-wider shadow-sm hover:border-[#D9A52E] transition"
            >
              <Crown size={14} weight="fill" />
              <span>VIP Member</span>
            </Link>
          )}

          {/* Quick Search Link Button */}
          <Link
            href="/search"
            aria-label="Cari Film atau Serial"
            aria-current={searchMatch.isExactActive ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
              searchMatch.isExactActive
                ? "border-[#D9A52E] bg-[#D9A52E]/10 text-[#D9A52E] font-semibold shadow-xs shadow-[#D9A52E]/10"
                : "border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#D9A52E]/40 hover:text-[#F5F5F5]"
            }`}
          >
            <MagnifyingGlass
              size={16}
              className={searchMatch.isExactActive ? "text-[#D9A52E]" : undefined}
            />
            <span className="hidden sm:inline">Cari judul...</span>
          </Link>

          {/* Desktop Auth State */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/profile"
                aria-current={profileMatch.isExactActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  profileMatch.isExactActive
                    ? "border-[#D9A52E] bg-[#D9A52E]/15 text-[#D9A52E] ring-1 ring-[#D9A52E]/40 shadow-xs shadow-[#D9A52E]/10"
                    : "border-[#292929] bg-[#171717] text-[#F5F5F5] hover:border-[#D9A52E]/50 hover:bg-[#202020]"
                }`}
                title="Lihat Profil & Akun Anda"
              >
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-[#D9A52E]/40 bg-[#0A0A0A]">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "Avatar"}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#D9A52E]">
                      {initial}
                    </div>
                  )}
                </div>
                <span className="max-w-[110px] truncate text-xs font-medium">
                  {user.name || "Pengguna"}
                </span>
              </Link>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  title="Keluar dari akun"
                  className="flex items-center gap-1.5 rounded-lg border border-[#292929] bg-[#171717] px-2.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition hover:border-red-500/40 hover:bg-red-950/20 hover:text-red-400 cursor-pointer"
                >
                  <SignOut size={14} />
                  <span className="hidden lg:inline">Keluar</span>
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 rounded-lg border border-[#D9A52E] bg-[#D9A52E] px-4 py-1.5 text-xs font-semibold text-[#0A0A0A] shadow-sm transition hover:bg-[#c49226] hover:border-[#c49226]"
            >
              <SignIn size={16} weight="bold" />
              <span>Masuk</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileMenuOpen}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-[#292929] bg-[#171717] text-[#F5F5F5] transition"
          >
            {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navigasi Seluler"
          className="md:hidden border-b border-[#292929] bg-[#0A0A0A] px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150"
        >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={homeMatch.isExactActive ? "page" : undefined}
            className={getMobileNavClass(homeMatch)}
          >
            <House
              size={18}
              weight={homeMatch.isExactActive ? "fill" : "regular"}
              className={homeMatch.isActive ? "text-[#D9A52E]" : undefined}
            />
            <span>Beranda</span>
          </Link>

          <Link
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={catalogMatch.isExactActive ? "page" : undefined}
            title={catalogMatch.isParentActive && !catalogMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
            className={getMobileNavClass(catalogMatch)}
          >
            <FilmReel
              size={18}
              weight={catalogMatch.isExactActive ? "fill" : "regular"}
              className={catalogMatch.isActive ? "text-[#D9A52E]" : undefined}
            />
            <span>Katalog Lengkap</span>
          </Link>

          <Link
            href="/catalog?type=movie"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={movieMatch.isExactActive ? "page" : undefined}
            title={movieMatch.isParentActive && !movieMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
            className={getMobileNavClass(movieMatch)}
          >
            <span>Film</span>
          </Link>

          <Link
            href="/catalog?type=tv"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={tvMatch.isExactActive ? "page" : undefined}
            title={tvMatch.isParentActive && !tvMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
            className={getMobileNavClass(tvMatch)}
          >
            <span>Serial TV</span>
          </Link>

          {user && (
            <>
              <Link
                href="/watchlist"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={watchlistMatch.isExactActive ? "page" : undefined}
                className={getMobileNavClass(watchlistMatch)}
              >
                <span>Watchlist Pribadi</span>
              </Link>
              <Link
                href="/playlists"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={playlistMatch.isExactActive ? "page" : undefined}
                title={playlistMatch.isParentActive && !playlistMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
                className={getMobileNavClass(playlistMatch)}
              >
                <span>Daftar Putar (Playlists)</span>
              </Link>
            </>
          )}

          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={vipMatch.isExactActive ? "page" : undefined}
            className={getMobileNavClass(vipMatch, true)}
          >
            <div className="flex items-center gap-2.5">
              <Crown
                size={18}
                weight="fill"
                className={vipMatch.isExactActive ? "text-[#D9A52E]" : undefined}
              />
              <span>Paket Langganan VIP</span>
            </div>
            {user?.isVip && (
              <span className="px-2 py-0.5 rounded-full bg-[#D9A52E]/20 text-[10px] uppercase font-black text-[#D9A52E]">
                Aktif
              </span>
            )}
          </Link>

          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={searchMatch.isExactActive ? "page" : undefined}
            className={getMobileNavClass(searchMatch)}
          >
            <MagnifyingGlass
              size={18}
              className={searchMatch.isActive ? "text-[#D9A52E]" : undefined}
            />
            <span>Pencarian Film & Serial</span>
          </Link>

          <div className="pt-2 border-t border-[#292929]">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={profileMatch.isExactActive ? "page" : undefined}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition ${
                    profileMatch.isExactActive
                      ? "border-[#D9A52E] bg-[#D9A52E]/10 text-[#D9A52E] border-l-2 border-l-[#D9A52E]"
                      : "border-[#292929] bg-[#171717] text-[#F5F5F5] hover:border-[#D9A52E]/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#D9A52E]/40 bg-[#0A0A0A]">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "Avatar"}
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#D9A52E]">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="font-semibold truncate">
                        {user.name || "Pengguna LayarRika"}
                      </span>
                      <span className="text-[10px] text-[#A3A3A3] truncate">
                        {user.email || "Lihat Profil Akun"}
                      </span>
                    </div>
                  </div>
                  {user.isVip && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] text-[10px] font-black shrink-0">
                      VIP
                    </span>
                  )}
                </Link>
                <form action={handleSignOut} className="w-full">
                  <button
                    type="submit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 cursor-pointer"
                  >
                    <SignOut size={16} />
                    <span>Keluar dari LayarRika</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D9A52E] bg-[#D9A52E] py-2 text-xs font-semibold text-[#0A0A0A]"
              >
                <SignIn size={16} weight="bold" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
