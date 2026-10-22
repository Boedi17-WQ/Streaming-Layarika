"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  SquaresFour,
  FilmStrip,
  Users,
  ArrowLeft,
  ShieldCheck,
  Crown,
} from "@phosphor-icons/react";

interface AdminSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: SquaresFour,
      exact: true,
      description: "Ringkasan statistik & metrik platform",
    },
    {
      label: "Aset Video Legal",
      href: "/admin/assets",
      icon: FilmStrip,
      exact: false,
      description: "Kelola stream HLS, MP4, dan kuota VIP",
    },
    {
      label: "Pengguna & VIP",
      href: "/admin/users",
      icon: Users,
      exact: false,
      description: "Manajemen role dan aktivasi langganan",
    },
  ];

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#222] bg-[#0E0E0E] text-[#F5F5F5] min-h-screen shrink-0">
      {/* Top Branding */}
      <div>
        <div className="p-6 border-b border-[#222]/80">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D9A52E] via-[#b3821c] to-[#73520e] shadow-md shadow-[#D9A52E]/15 group-hover:scale-105 transition">
              <FilmStrip size={22} weight="fill" className="text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#D9A52E] transition">
                  Layar<span className="text-[#D9A52E]">Rika</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/30">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">Portal Manajemen Sinema</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5" aria-label="Navigasi Panel Admin">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Menu Utama
          </p>

          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#D9A52E]/15 text-[#D9A52E] border border-[#D9A52E]/30 shadow-xs shadow-[#D9A52E]/10"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                  className={isActive ? "text-[#D9A52E]" : "text-neutral-400"}
                />
                <div className="flex-1">
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A52E] shadow-sm shadow-[#D9A52E]" />
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Pintas Cepat
            </p>
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 transition border border-transparent"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Situs</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 transition border border-transparent"
            >
              <Crown size={16} className="text-[#D9A52E]" />
              <span>Katalog Langganan</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Admin User Profile Bottom Footer */}
      <div className="p-4 border-t border-[#222]/80 bg-[#0B0B0B]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#D9A52E]/40 bg-neutral-950">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "Admin"}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#D9A52E]">
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user.name || "Administrator"}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <ShieldCheck size={12} weight="fill" />
              <span className="font-medium">Admin Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
