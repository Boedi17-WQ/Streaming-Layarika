"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Crown,
  MagnifyingGlass,
  PencilSimple,
} from "@phosphor-icons/react";
import { UserVipModal } from "./UserVipModal";
import { UserRoleModal } from "./UserRoleModal";

export interface AdminUserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
  isVip: boolean;
  planName: string;
  vipEndDate: Date | null;
  stats: {
    watchlists: number;
    history: number;
    playlists: number;
  };
}

interface AdminUsersClientProps {
  initialUsers: AdminUserItem[];
  currentAdminId: string;
}

export function AdminUsersClient({
  initialUsers,
  currentAdminId,
}: AdminUsersClientProps) {
  const [users] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [vipFilter, setVipFilter] = useState<"ALL" | "VIP" | "FREE">("ALL");

  // Modals state
  const [selectedVipUser, setSelectedVipUser] = useState<AdminUserItem | null>(null);
  const [selectedRoleUser, setSelectedRoleUser] = useState<AdminUserItem | null>(null);

  // Client-side filtering
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) {
      return false;
    }
    if (vipFilter === "VIP" && !u.isVip) {
      return false;
    }
    if (vipFilter === "FREE" && u.isVip) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = u.name ? u.name.toLowerCase().includes(q) : false;
      const matchEmail = u.email ? u.email.toLowerCase().includes(q) : false;
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Manajemen Pengguna & Status VIP
        </h2>
        <p className="text-xs text-neutral-400">
          Kelola wewenang role (USER/ADMIN) dan aktifkan hak akses Premium VIP secara manual untuk pengujian akademik.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-neutral-800 bg-[#121212]">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email pengguna..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D9A52E] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                roleFilter === "ALL"
                  ? "bg-[#D9A52E] text-neutral-950 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Semua Role
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("ADMIN")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                roleFilter === "ADMIN"
                  ? "bg-[#D9A52E] text-neutral-950 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("USER")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                roleFilter === "USER"
                  ? "bg-[#D9A52E] text-neutral-950 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              User
            </button>
          </div>

          {/* VIP Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setVipFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                vipFilter === "ALL"
                  ? "bg-[#D9A52E] text-neutral-950 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Semua Akses
            </button>
            <button
              type="button"
              onClick={() => setVipFilter("VIP")}
              className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                vipFilter === "VIP"
                  ? "bg-[#D9A52E] text-neutral-950 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Crown size={13} weight="fill" />
              <span>VIP Saja</span>
            </button>
            <button
              type="button"
              onClick={() => setVipFilter("FREE")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                vipFilter === "FREE"
                  ? "bg-[#D9A52E] text-neutral-950 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Free Saja
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-200">
            <thead className="border-b border-neutral-800 bg-neutral-900/80 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Pengguna
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Role Akun
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Status Langganan
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Aktivitas
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Terdaftar
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Kelola
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                    Tidak ada akun pengguna yang cocok dengan kriteria pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";
                  const isCurrentAdmin = u.id === currentAdminId;
                  const formattedEndDate = u.vipEndDate
                    ? new Date(u.vipEndDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;
                  const formattedJoined = new Date(u.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={u.id} className="hover:bg-neutral-900/40 transition">
                      {/* Avatar & Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-950 flex items-center justify-center font-bold text-xs text-[#D9A52E]">
                            {u.image ? (
                              <Image
                                src={u.image}
                                alt={u.name || "Avatar"}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-sm truncate">
                                {u.name || "Tanpa Nama"}
                              </p>
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] text-neutral-400 font-medium">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 font-mono truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck size={13} weight="fill" />
                            <span>ADMIN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                            USER
                          </span>
                        )}
                      </td>

                      {/* VIP Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {u.isVip ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/30 text-[10px] font-black uppercase">
                              <Crown size={12} weight="fill" />
                              <span>VIP Member</span>
                            </span>
                            <p className="text-[10px] text-neutral-400">
                              Aktif s/d <strong className="text-neutral-300">{formattedEndDate}</strong>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold">
                              Free Tier
                            </span>
                            <p className="text-[10px] text-neutral-500">Kuota 5 eps / 60 mnt</p>
                          </div>
                        )}
                      </td>

                      {/* Stats */}
                      <td className="px-4 py-4 whitespace-nowrap text-neutral-400 text-[11px]">
                        <span>{u.stats.history} Ditonton</span> · <span>{u.stats.watchlists} Watchlist</span>
                      </td>

                      {/* Tanggal Bergabung */}
                      <td className="px-4 py-4 whitespace-nowrap text-neutral-400 text-[11px]">
                        {formattedJoined}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Kelola VIP Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedVipUser(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9A52E]/30 bg-[#D9A52E]/10 text-[#D9A52E] hover:bg-[#D9A52E]/20 text-xs font-semibold transition cursor-pointer"
                          >
                            <Crown size={14} weight="fill" />
                            <span>{u.isVip ? "Kelola VIP" : "Beri VIP"}</span>
                          </button>

                          {/* Ubah Role Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedRoleUser(u)}
                            title="Ubah Role Akun"
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
                          >
                            <PencilSimple size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIP Modal */}
      <UserVipModal
        isOpen={Boolean(selectedVipUser)}
        user={selectedVipUser}
        onClose={() => setSelectedVipUser(null)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Role Modal */}
      <UserRoleModal
        isOpen={Boolean(selectedRoleUser)}
        user={selectedRoleUser}
        currentAdminId={currentAdminId}
        onClose={() => setSelectedRoleUser(null)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
