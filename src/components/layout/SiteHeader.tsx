"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import {
  FilmReel,
  Television,
  House,
  MagnifyingGlass,
  SignIn,
  SignOut,
  List,
  X,
} from "@phosphor-icons/react";
import { handleSignOut } from "@/app/actions/auth";

export interface SiteHeaderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SiteHeaderProps {
  user?: SiteHeaderUser | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#292929] bg-[#0A0A0A]/90 backdrop-blur-md transition-colors">
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
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717]/60 transition"
            >
              <House size={16} weight="fill" />
              <span>Beranda</span>
            </Link>
            <Link
              href="/#movies"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717]/60 transition"
            >
              <FilmReel size={16} />
              <span>Film</span>
            </Link>
            <Link
              href="/#series"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717]/60 transition"
            >
              <Television size={16} />
              <span>Serial</span>
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[#D9A52E] hover:bg-[#171717]/60 transition"
            >
              <MagnifyingGlass size={16} weight="bold" />
              <span>Cari Katalog</span>
            </Link>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search Link Button */}
          <Link
            href="/search"
            aria-label="Cari Film atau Serial"
            className="flex items-center gap-2 rounded-lg border border-[#292929] bg-[#171717] px-3 py-1.5 text-xs text-[#A3A3A3] transition hover:border-[#D9A52E]/40 hover:text-[#F5F5F5]"
          >
            <MagnifyingGlass size={16} />
            <span className="hidden sm:inline">Cari judul...</span>
          </Link>

          {/* Desktop Auth State */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-[#292929] bg-[#171717] px-2.5 py-1 text-xs font-medium text-[#F5F5F5] transition hover:border-[#D9A52E]/50 hover:bg-[#202020]"
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
                  className="flex items-center gap-1.5 rounded-lg border border-[#292929] bg-[#171717] px-2.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition hover:border-red-500/40 hover:bg-red-950/20 hover:text-red-400"
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
            aria-label="Buka menu navigasi"
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-[#292929] bg-[#171717] text-[#F5F5F5] transition"
          >
            {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#292929] bg-[#0A0A0A] px-4 py-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[#F5F5F5] hover:bg-[#171717]"
          >
            <House size={18} weight="fill" />
            <span>Beranda</span>
          </Link>
          <Link
            href="/#movies"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            <FilmReel size={18} />
            <span>Film</span>
          </Link>
          <Link
            href="/#series"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            <Television size={18} />
            <span>Serial</span>
          </Link>
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[#D9A52E] bg-[#171717]"
          >
            <MagnifyingGlass size={18} weight="bold" />
            <span>Pencarian Katalog</span>
          </Link>
          <div className="pt-2 border-t border-[#292929]">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg border border-[#292929] bg-[#171717] p-2.5 text-xs font-medium text-[#F5F5F5] hover:border-[#D9A52E]/40"
                >
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
                    <span className="font-semibold truncate">{user.name || "Pengguna LayarRika"}</span>
                    <span className="text-[10px] text-[#A3A3A3] truncate">{user.email || "Lihat Profil Akun"}</span>
                  </div>
                </Link>
                <form action={handleSignOut} className="w-full">
                  <button
                    type="submit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40"
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
        </div>
      )}
    </header>
  );
}
