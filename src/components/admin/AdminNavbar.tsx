"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  X,
  FilmStrip,
  SquaresFour,
  Users,
  ArrowLeft,
  ShieldCheck,
} from "@phosphor-icons/react";

interface AdminNavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    if (pathname.startsWith("/admin/assets")) return "Manajemen Aset Video Legal";
    if (pathname.startsWith("/admin/users")) return "Manajemen Pengguna & VIP";
    return "Panel Administrator";
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#222] bg-[#0E0E0E]/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Buka menu navigasi admin"
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
          >
            {mobileOpen ? <X size={20} /> : <List size={20} />}
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-bold text-white">
              {getPageTitle()}
            </h1>
            <p className="hidden sm:block text-[11px] text-neutral-400">
              LayarRika Full-Stack Streaming Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <ShieldCheck size={14} weight="fill" />
            <span>Mode Admin Aktif</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white hover:border-[#D9A52E] transition"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Ke Situs Utama</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0E0E0E] border-r border-neutral-800 p-6 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#D9A52E] to-[#73520e]">
                    <FilmStrip size={20} weight="fill" className="text-neutral-950" />
                  </div>
                  <span className="font-extrabold text-base text-white">
                    Layar<span className="text-[#D9A52E]">Rika</span> Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="pt-6 space-y-2">
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    pathname === "/admin"
                      ? "bg-[#D9A52E]/15 text-[#D9A52E] border border-[#D9A52E]/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <SquaresFour size={18} weight={pathname === "/admin" ? "fill" : "regular"} />
                  <span>Dashboard Overview</span>
                </Link>

                <Link
                  href="/admin/assets"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith("/admin/assets")
                      ? "bg-[#D9A52E]/15 text-[#D9A52E] border border-[#D9A52E]/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <FilmStrip size={18} weight={pathname.startsWith("/admin/assets") ? "fill" : "regular"} />
                  <span>Aset Video Legal</span>
                </Link>

                <Link
                  href="/admin/users"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith("/admin/users")
                      ? "bg-[#D9A52E]/15 text-[#D9A52E] border border-[#D9A52E]/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Users size={18} weight={pathname.startsWith("/admin/users") ? "fill" : "regular"} />
                  <span>Pengguna & VIP</span>
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-neutral-800 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Beranda</span>
              </Link>
              <div className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
                Masuk sebagai <strong className="text-white">{user.name || user.email}</strong> (ADMIN)
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
