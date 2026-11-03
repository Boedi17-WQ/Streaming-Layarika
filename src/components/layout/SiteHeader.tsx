"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  FilmStrip,
  Television,
  House,
  Compass,
  MagnifyingGlass,
  SignIn,
  SignOut,
  Crown,
  ShieldCheck,
  BookmarkSimple,
  Queue,
  Receipt,
  User,
  CaretDown,
  Question,
} from "@phosphor-icons/react";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
import { checkNavActive, NavItemMatch } from "@/lib/navigation/active-nav";

export interface SiteHeaderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
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

/**
 * Gaya tipografi tautan navigasi desktop modern & kreatif (Floating Capsule Glassmorphism).
 * Menggunakan pill kapsul bergradasi halus dan pendaran emas sinematik saat aktif.
 */
function getDesktopNavClass(match: NavItemMatch, isVip = false): string {
  if (isVip) {
    if (match.isExactActive) {
      return "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-[#D9A52E] bg-gradient-to-r from-[#D9A52E]/30 to-[#D9A52E]/15 border border-[#D9A52E]/60 shadow-[0_0_12px_rgba(217,165,46,0.35)] transition-all";
    }
    return "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#D9A52E] hover:bg-[#D9A52E]/15 hover:text-[#f3c254] transition-all";
  }

  if (match.isExactActive) {
    return "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-[#F5F5F5] bg-gradient-to-r from-[#D9A52E]/25 via-[#D9A52E]/15 to-[#D9A52E]/10 border border-[#D9A52E]/50 shadow-[0_0_14px_rgba(217,165,46,0.3)] transition-all";
  }

  if (match.isParentActive) {
    return "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#D9A52E] bg-white/5 border border-white/10 transition-all";
  }

  return "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-all";
}

/**
 * Gaya tab navigasi kategori seluler dengan desain Floating Capsule persis seperti desktop saat aktif.
 * Menggunakan pill kapsul bergradasi halus dan pendaran emas sinematik saat aktif (hanya exact active).
 */
function getMobileTabClass(match: NavItemMatch, isVip = false): string {
  if (isVip) {
    if (match.isExactActive) {
      return "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold text-[#D9A52E] bg-gradient-to-r from-[#D9A52E]/30 to-[#D9A52E]/15 border border-[#D9A52E]/60 shadow-[0_0_12px_rgba(217,165,46,0.35)] transition-all";
    }
    return "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-[#D9A52E] hover:bg-[#D9A52E]/15 hover:text-[#f3c254] transition-all";
  }

  if (match.isExactActive) {
    return "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold text-[#F5F5F5] bg-gradient-to-r from-[#D9A52E]/25 via-[#D9A52E]/15 to-[#D9A52E]/10 border border-[#D9A52E]/50 shadow-[0_0_14px_rgba(217,165,46,0.3)] transition-all";
  }

  return "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-all";
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const [searchParamsType, setSearchParamsType] = useState<string | null>(null);

  const handleTypeChange = useCallback((type: string | null) => {
    setSearchParamsType(type);
  }, []);

  // Handler klik di luar dropdown profil pengguna untuk menutup menu secara mulus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
  const helpMatch = checkNavActive(pathname, searchParamsType, "/help");

  // Pada halaman detail tontonan (Movie/TV), sembunyikan header di mobile agar tampilan bersih & edge-to-edge
  const isDetailPage = pathname.startsWith("/tv/") || pathname.startsWith("/movie/");

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b border-[#222222] bg-[#0A0A0A]/95 backdrop-blur-xl transition-all ${
          isDetailPage ? "hidden md:block" : ""
        }`}
      >
        <Suspense fallback={null}>
          <SearchParamsWatcher onTypeChange={handleTypeChange} />
        </Suspense>

        <Container className="flex h-16 items-center justify-between">
          {/* Brand Logo & Navigasi Utama */}
          <div className="flex items-center gap-8 lg:gap-10">
            {/* Brand Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1c1c1c] to-[#121212] border border-[#D9A52E]/30 shadow-sm transition group-hover:border-[#D9A52E] group-hover:scale-105 p-1.5 overflow-hidden">
                <Image
                  src="/images/layarrika-logo.png"
                  alt="LayarRika Logo"
                  width={24}
                  height={24}
                  priority
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-wider text-[#F5F5F5]">
                  LAYAR<span className="text-[#D9A52E]">RIKA</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#737373] -mt-1 font-semibold">
                  Sinematik
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Kapsul Sinematik Glassmorphism */}
            <nav
              aria-label="Navigasi Utama"
              className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-[#121212]/90 p-1 shadow-inner shadow-black/80 backdrop-blur-md"
            >
              {/* 1. Beranda */}
              <Link
                href="/"
                aria-current={homeMatch.isExactActive ? "page" : undefined}
                className={getDesktopNavClass(homeMatch)}
              >
                <House
                  size={14}
                  weight={homeMatch.isExactActive ? "fill" : "regular"}
                  className={homeMatch.isExactActive ? "text-[#D9A52E]" : "opacity-80"}
                />
                <span>Beranda</span>
              </Link>

              {/* 2. Movies */}
              <Link
                href="/catalog?type=movie"
                aria-current={movieMatch.isExactActive ? "page" : undefined}
                title={movieMatch.isParentActive && !movieMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
                className={getDesktopNavClass(movieMatch)}
              >
                <FilmStrip
                  size={14}
                  weight={movieMatch.isExactActive ? "fill" : "regular"}
                  className={movieMatch.isExactActive ? "text-[#D9A52E]" : "opacity-80"}
                />
                <span>Movies</span>
              </Link>

              {/* 3. Series */}
              <Link
                href="/catalog?type=tv"
                aria-current={tvMatch.isExactActive ? "page" : undefined}
                title={tvMatch.isParentActive && !tvMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
                className={getDesktopNavClass(tvMatch)}
              >
                <Television
                  size={14}
                  weight={tvMatch.isExactActive ? "fill" : "regular"}
                  className={tvMatch.isExactActive ? "text-[#D9A52E]" : "opacity-80"}
                />
                <span>Series</span>
              </Link>

              {/* 4. Katalog Lengkap */}
              <Link
                href="/catalog"
                aria-current={catalogMatch.isExactActive ? "page" : undefined}
                title={catalogMatch.isParentActive && !catalogMatch.isExactActive ? "Kategori Induk Aktif" : undefined}
                className={getDesktopNavClass(catalogMatch)}
              >
                <Compass
                  size={14}
                  weight={catalogMatch.isExactActive ? "fill" : "regular"}
                  className={catalogMatch.isExactActive ? "text-[#D9A52E]" : "opacity-80"}
                />
                <span>Katalog</span>
              </Link>

              {/* 5. Tautan VIP Khusus Pengguna Free (Jika Sudah VIP, Status otomatis ada di profil) */}
              {!user?.isVip && (
                <Link
                  href="/pricing"
                  aria-current={vipMatch.isExactActive ? "page" : undefined}
                  className={getDesktopNavClass(vipMatch, true)}
                >
                  <Crown
                    size={14}
                    weight="fill"
                    className="text-[#D9A52E]"
                  />
                  <span>VIP</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Sisi Kanan: Pencarian Ringkas & Menu Akun Profil */}
          <div className="flex items-center gap-3">
            {/* Tombol Pencarian Ramping */}
            <Link
              href="/search"
              aria-label="Cari Film atau Serial"
              aria-current={searchMatch.isExactActive ? "page" : undefined}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${
                searchMatch.isExactActive
                  ? "border-[#D9A52E] bg-[#D9A52E]/10 text-[#D9A52E] font-semibold shadow-xs shadow-[#D9A52E]/10"
                  : "border-[#292929] bg-[#141414] text-[#A3A3A3] hover:border-[#D9A52E]/40 hover:text-[#F5F5F5]"
              }`}
            >
              <MagnifyingGlass
                size={16}
                className={searchMatch.isExactActive ? "text-[#D9A52E]" : undefined}
              />
              <span className="hidden sm:inline">Cari judul...</span>
            </Link>

            {/* Tombol Akses Cepat Bantuan & Panduan */}
            <Link
              href="/help"
              aria-label="Pusat Bantuan & Panduan"
              title="Pusat Bantuan & Panduan LayarRika"
              className={`flex items-center justify-center h-8 w-8 rounded-xl border text-xs transition cursor-pointer ${
                helpMatch.isExactActive
                  ? "border-[#D9A52E] bg-[#D9A52E]/15 text-[#D9A52E] shadow-xs"
                  : "border-[#292929] bg-[#141414] text-[#A3A3A3] hover:border-[#D9A52E]/40 hover:text-[#D9A52E]"
              }`}
            >
              <Question size={16} weight={helpMatch.isExactActive ? "bold" : "regular"} />
            </Link>

            {/* Menu Pengguna (Dropdown Profil Terpadu ala HBO Max / Netflix) */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  title="Buka Menu Profil & Koleksi Anda"
                  className={`group flex items-center gap-2 rounded-full p-1 sm:pr-2.5 transition border ${
                    userDropdownOpen
                      ? "border-[#D9A52E] bg-[#1a1710]"
                      : "border-transparent hover:border-[#292929] hover:bg-[#141414]"
                  }`}
                >
                  <div
                    className={`relative h-8 w-8 sm:h-7 sm:w-7 shrink-0 overflow-hidden rounded-full bg-[#171717] transition ${
                      user.isVip
                        ? "ring-2 ring-[#D9A52E] shadow-sm shadow-[#D9A52E]/30"
                        : "border border-white/10"
                    }`}
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "Avatar"}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#D9A52E]">
                        {initial}
                      </div>
                    )}
                  </div>

                  <span className="hidden sm:inline max-w-[100px] truncate text-xs font-semibold text-[#F5F5F5] group-hover:text-[#D9A52E] transition">
                    {user.name || "Pengguna"}
                  </span>

                  <CaretDown
                    size={12}
                    weight="bold"
                    className={`hidden sm:inline text-[#737373] transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180 text-[#D9A52E]" : "group-hover:text-[#F5F5F5]"
                    }`}
                  />
                </button>

                {/* Backdrop Overlay di Layar Mobile saat Dropdown Terbuka */}
                {userDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                )}

                {/* Popover Dropdown Profil Elegan */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-64 origin-top-right rounded-2xl border border-white/10 bg-[#121212]/98 backdrop-blur-2xl p-2.5 shadow-2xl shadow-black/95 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                    {/* Header Profil & Status VIP */}
                    <div className="px-3 py-2.5 border-b border-[#222222] mb-1">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#1a1a1a] ${
                            user.isVip ? "ring-2 ring-[#D9A52E]" : "border border-[#333]"
                          }`}
                        >
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || "Avatar"}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#D9A52E]">
                              {initial}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#F5F5F5] truncate">
                            {user.name || "Pengguna LayarRika"}
                          </span>
                          <span className="text-[11px] text-[#737373] truncate">
                            {user.email || ""}
                          </span>
                        </div>
                      </div>

                      {/* Status Langganan Badge */}
                      {user.isVip ? (
                        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-[#D9A52E]/10 border border-[#D9A52E]/30 px-2.5 py-1.5 text-[11px] font-bold text-[#D9A52E]">
                          <span className="flex items-center gap-1.5">
                            <Crown size={14} weight="fill" />
                            <span>VIP Member Aktif</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Aktif</span>
                        </div>
                      ) : (
                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="mt-2.5 flex items-center justify-between rounded-lg bg-gradient-to-r from-[#D9A52E]/20 to-[#D9A52E]/10 border border-[#D9A52E]/40 px-2.5 py-1.5 text-[11px] font-bold text-[#D9A52E] transition hover:bg-[#D9A52E]/25"
                        >
                          <span className="flex items-center gap-1.5">
                            <Crown size={14} weight="fill" />
                            <span>Upgrade ke VIP</span>
                          </span>
                          <span className="text-[10px] bg-[#D9A52E] text-[#0A0A0A] px-1.5 py-0.2 rounded font-extrabold">
                            PROMO
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* Menu Koleksi Personal */}
                    <div className="space-y-0.5 py-1 border-b border-[#222222]">
                      <Link
                        href="/watchlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          watchlistMatch.isExactActive
                            ? "bg-[#D9A52E]/15 text-[#D9A52E] font-semibold"
                            : "text-[#A3A3A3] hover:bg-[#1a1a1a] hover:text-[#F5F5F5]"
                        }`}
                      >
                        <BookmarkSimple size={16} weight={watchlistMatch.isExactActive ? "fill" : "regular"} className="text-[#D9A52E]" />
                        <span>Watchlist Tersimpan</span>
                      </Link>

                      <Link
                        href="/playlists"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          playlistMatch.isExactActive
                            ? "bg-[#D9A52E]/15 text-[#D9A52E] font-semibold"
                            : "text-[#A3A3A3] hover:bg-[#1a1a1a] hover:text-[#F5F5F5]"
                        }`}
                      >
                        <Queue size={16} weight={playlistMatch.isExactActive ? "fill" : "regular"} className="text-[#D9A52E]" />
                        <span>Playlist Kustom</span>
                      </Link>

                      <Link
                        href="/profile#riwayat-faktur"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#A3A3A3] hover:bg-[#1a1a1a] hover:text-[#F5F5F5] transition"
                      >
                        <Receipt size={16} className="text-[#D9A52E]" />
                        <span>Faktur & Riwayat Transaksi</span>
                      </Link>
                    </div>

                    {/* Pengaturan Akun & Admin */}
                    <div className="space-y-0.5 py-1 border-b border-[#222222]">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          profileMatch.isExactActive
                            ? "bg-[#D9A52E]/15 text-[#D9A52E] font-semibold"
                            : "text-[#A3A3A3] hover:bg-[#1a1a1a] hover:text-[#F5F5F5]"
                        }`}
                      >
                        <User size={16} weight={profileMatch.isExactActive ? "fill" : "regular"} />
                        <span>Pengaturan Akun & Profil</span>
                      </Link>

                      {/* Tautan Pusat Bantuan & Panduan */}
                      <Link
                        href="/help"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          helpMatch.isExactActive
                            ? "bg-[#D9A52E]/15 text-[#D9A52E] font-semibold"
                            : "text-[#A3A3A3] hover:bg-[#1a1a1a] hover:text-[#F5F5F5]"
                        }`}
                      >
                        <Question size={16} weight={helpMatch.isExactActive ? "bold" : "regular"} />
                        <span>Pusat Bantuan & Panduan</span>
                      </Link>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/15 transition"
                        >
                          <ShieldCheck size={16} weight="fill" />
                          <span>Panel Administrator</span>
                        </Link>
                      )}
                    </div>

                    {/* Tombol Keluar / Sign Out */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                      >
                        <SignOut size={16} />
                        <span>Keluar dari Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-[#D9A52E] bg-[#D9A52E] px-3.5 py-1.5 text-xs font-bold text-[#0A0A0A] shadow-md shadow-[#D9A52E]/10 transition hover:bg-[#c49226]"
              >
                <SignIn size={15} weight="bold" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </Container>

        {/* Mobile Subnav Bar — Desain Floating Capsule Persis Seperti Desktop saat Aktif */}
        <nav
          aria-label="Navigasi Kategori Seluler"
          className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 border-t border-white/5 bg-[#0A0A0A]/95 backdrop-blur-xl scrollbar-none"
        >
          {/* 1. Beranda / Home */}
          <Link
            href="/"
            aria-current={homeMatch.isExactActive ? "page" : undefined}
            className={getMobileTabClass(homeMatch)}
          >
            <House size={13} weight={homeMatch.isExactActive ? "fill" : "regular"} className={homeMatch.isExactActive ? "text-[#D9A52E]" : ""} />
            <span>Beranda</span>
          </Link>

          {/* 2. Series */}
          <Link
            href="/catalog?type=tv"
            aria-current={tvMatch.isExactActive ? "page" : undefined}
            className={getMobileTabClass(tvMatch)}
          >
            <Television size={13} weight={tvMatch.isExactActive ? "fill" : "regular"} className={tvMatch.isExactActive ? "text-[#D9A52E]" : ""} />
            <span>Series</span>
          </Link>

          {/* 3. Movies */}
          <Link
            href="/catalog?type=movie"
            aria-current={movieMatch.isExactActive ? "page" : undefined}
            className={getMobileTabClass(movieMatch)}
          >
            <FilmStrip size={13} weight={movieMatch.isExactActive ? "fill" : "regular"} className={movieMatch.isExactActive ? "text-[#D9A52E]" : ""} />
            <span>Movies</span>
          </Link>

          {/* 4. Katalog */}
          <Link
            href="/catalog"
            aria-current={catalogMatch.isExactActive ? "page" : undefined}
            className={getMobileTabClass(catalogMatch)}
          >
            <Compass size={13} weight={catalogMatch.isExactActive ? "fill" : "regular"} className={catalogMatch.isExactActive ? "text-[#D9A52E]" : ""} />
            <span>Katalog</span>
          </Link>

          {/* 5. VIP (jika bukan VIP) */}
          {!user?.isVip && (
            <Link
              href="/pricing"
              aria-current={vipMatch.isExactActive ? "page" : undefined}
              className={getMobileTabClass(vipMatch, true)}
            >
              <Crown size={13} weight={vipMatch.isExactActive ? "fill" : "regular"} className={vipMatch.isExactActive ? "text-[#D9A52E]" : ""} />
              <span>VIP</span>
            </Link>
          )}

          {/* 6. Bantuan */}
          <Link
            href="/help"
            aria-current={helpMatch.isExactActive ? "page" : undefined}
            className={getMobileTabClass(helpMatch)}
          >
            <Question size={13} weight={helpMatch.isExactActive ? "fill" : "regular"} className={helpMatch.isExactActive ? "text-[#D9A52E]" : ""} />
            <span>Bantuan</span>
          </Link>
        </nav>
      </header>

      {/* Modal Konfirmasi Keluar Akun */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        userName={user?.name}
        userEmail={user?.email}
      />
    </>
  );
}
