"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  FilmStrip,
  ClockCounterClockwise,
  Plus,
  ArrowRight,
  Play,
  ArrowSquareOut,
  Sparkle,
} from "@phosphor-icons/react";
import { AdminDashboardStats } from "@/services/admin.service";
import { AssetFormModal } from "./AssetFormModal";
import { AssetPreviewModal, PreviewAssetData } from "./AssetPreviewModal";

interface AdminDashboardClientProps {
  stats: AdminDashboardStats;
}

export function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<PreviewAssetData | null>(null);

  // Perkiraan Pendapatan Bulanan (MRR) dari VIP Aktif (Rp 49.000 per user)
  const estimatedRevenue = stats.totalVipUsers * 49000;
  const formattedRevenue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(estimatedRevenue);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E] text-xs font-bold">
              <Sparkle size={14} weight="fill" />
              <span>Tahap 8 — Panel Kontrol LayarRika Aktif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat Datang di Portal Admin
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Pantau metrik audiens, kelola aset video legal HLS / MP4, dan berikan otorisasi hak akses VIP secara instan untuk pengujian akademik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-xs font-bold uppercase tracking-wider hover:from-[#e5b33d] hover:to-[#c49226] transition shadow-md shadow-[#D9A52E]/15 cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Tambah Aset Video</span>
            </button>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-white hover:bg-neutral-700 transition"
            >
              <Users size={16} />
              <span>Kelola Pengguna</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Total Pengguna */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#121212] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Total Pengguna</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Users size={20} weight="fill" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalUsers}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              <strong className="text-emerald-400">{stats.totalAdmins} Admin</strong> · {stats.totalUsers - stats.totalAdmins} User Biasa
            </p>
          </div>
        </div>

        {/* 2. Total Member VIP */}
        <div className="p-5 rounded-2xl border border-[#D9A52E]/30 bg-[#14120c] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#D9A52E]">Member VIP Aktif</span>
            <div className="p-2 rounded-xl bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/40">
              <Crown size={20} weight="fill" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#D9A52E] tracking-tight">
              {stats.totalVipUsers}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Est. Omzet: <strong className="text-white">{formattedRevenue}</strong>
            </p>
          </div>
        </div>

        {/* 3. Aset Video Legal */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#121212] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Aset Video Legal</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <FilmStrip size={20} weight="fill" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalAssets}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {stats.totalMovieAssets} Film · {stats.totalTvAssets} Serial TV
            </p>
          </div>
        </div>

        {/* 4. Aktivitas Tontonan */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#121212] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Aktivitas Audiens</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ClockCounterClockwise size={20} weight="fill" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalWatchHistory}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Riwayat tontonan · {stats.totalWatchlists} item di Watchlist
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Recent Users & Recent Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-[#121212] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Pengguna Terbaru</h3>
              <p className="text-xs text-neutral-400">Pendaftaran akun terakhir di sistem</p>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D9A52E] hover:underline"
            >
              <span>Lihat Semua</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-neutral-800/80">
            {stats.recentUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-neutral-500">Belum ada pengguna terdaftar.</p>
            ) : (
              stats.recentUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{u.name || "Tanpa Nama"}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.isVip ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/30 text-[10px] font-black uppercase">
                        VIP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold">
                        Free
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-[10px] font-bold text-neutral-300">
                      {u.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Playback Assets */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-[#121212] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Aset Video Terdaftar</h3>
              <p className="text-xs text-neutral-400">Stream HLS & MP4 aktif</p>
            </div>
            <Link
              href="/admin/assets"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D9A52E] hover:underline"
            >
              <span>Kelola Aset</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-neutral-800/80">
            {stats.recentAssets.length === 0 ? (
              <p className="py-6 text-center text-xs text-neutral-500">Belum ada aset video legal.</p>
            ) : (
              stats.recentAssets.map((asset) => (
                <div key={asset.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{asset.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                      <span>{asset.mediaType === "MOVIE" ? "Film" : "Serial TV"}</span>
                      {asset.tmdbId && <span>· TMDB: {asset.tmdbId}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {asset.isPremiumRequired && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/30 text-[10px] font-black uppercase">
                        VIP
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-[10px] font-bold text-neutral-300">
                      {asset.quality}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      title="Test putar video"
                      className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-[#D9A52E] hover:border-[#D9A52E]/50 transition cursor-pointer"
                    >
                      <Play size={14} weight="fill" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Simulator Shortcut Box */}
      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300">
            <ArrowSquareOut size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Simulasi Transaksi Midtrans Sandbox</h4>
            <p className="text-xs text-neutral-400">
              Uji coba pembayaran Virtual Account (BCA, BNI, BRI) melalui Simulator Resmi Midtrans.
            </p>
          </div>
        </div>
        <a
          href="https://simulator.sandbox.midtrans.com/bca/va/index"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-white hover:border-[#D9A52E] hover:text-[#D9A52E] transition shrink-0"
        >
          <span>Buka Simulator Sandbox</span>
          <ArrowSquareOut size={14} />
        </a>
      </div>

      {/* Add Asset Modal */}
      <AssetFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Preview Player Modal */}
      <AssetPreviewModal
        isOpen={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
      />
    </div>
  );
}
