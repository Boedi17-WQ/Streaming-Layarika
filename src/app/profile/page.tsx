import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Container } from "@/components/ui/Container";
import { getUserWatchlist } from "@/services/watchlist.service";
import { getUserWatchHistory } from "@/services/history.service";
import { getUserEntitlement } from "@/services/subscription.service";
import { getUserInvoices } from "@/services/invoice.service";
import {
  ProfileCollections,
  WatchlistCardItem,
  WatchHistoryCardItem,
} from "@/components/profile/ProfileCollections";
import { ProfileSignOutButton } from "@/components/profile/ProfileSignOutButton";
import {
  ShieldCheck,
  ArrowLeft,
  Crown,
  Sparkle,
  Television,
  FilmReel,
  ArrowRight,
  Receipt,
  Printer,
  ArrowSquareOut,
  Question,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Profil & Koleksi Pengguna — LayarRika",
  description: "Kelola akun, watchlist tersimpan, dan riwayat tontonan personal LayarRika Anda.",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function ProfilePage() {
  await connection();
  const session = await auth();

  // Proteksi server-side: Alihkan pengguna yang belum terautentikasi ke /login
  if (!session || !session.user || !session.user.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const { user } = session;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  // Ambil koleksi personal watchlist, riwayat tontonan, entitlement langganan, dan faktur pengguna dari database Neon
  const [rawWatchlist, rawHistory, entitlement, invoices] = await Promise.all([
    getUserWatchlist(user.id),
    getUserWatchHistory(user.id),
    getUserEntitlement(user.id),
    getUserInvoices(user.id),
  ]);

  // Serialisasi data tanggal untuk Client Component
  const watchlistItems: WatchlistCardItem[] = rawWatchlist.map((item) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    rating: item.rating,
    releaseYear: item.releaseYear,
    createdAt: item.createdAt.toISOString(),
  }));

  const historyItems: WatchHistoryCardItem[] = rawHistory.map((item) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    seasonNumber: item.seasonNumber,
    episodeNumber: item.episodeNumber,
    progressSeconds: item.progressSeconds,
    durationSeconds: item.durationSeconds,
    completed: item.completed,
    lastWatchedAt: item.lastWatchedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 pb-24 text-[#F5F5F5]">
      <Container className="max-w-4xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A3A3A3] transition hover:text-[#D9A52E]"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="rounded-2xl border border-[#292929] bg-[#171717] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Pengguna */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-[#D9A52E]/50 bg-[#0A0A0A] shadow-md">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Avatar Pengguna"}
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#D9A52E]">
                  {initial}
                </div>
              )}
            </div>

            {/* Nama & Email */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5]">
                  {user.name || "Penikmat Sinema"}
                </h1>
                <span className="rounded-full bg-[#D9A52E]/15 px-3 py-0.5 text-[11px] font-bold text-[#D9A52E] border border-[#D9A52E]/30">
                  {user.role || "USER"}
                </span>
              </div>

              <p className="text-sm text-[#A3A3A3]">{user.email || "Email akun terverifikasi"}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-[#737373]">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0A0A0A] px-2.5 py-1 border border-[#292929] text-[#D9A52E]">
                  <ShieldCheck size={14} weight="bold" />
                  <span>Autentikasi Akun LayarRika</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0A0A0A] px-2.5 py-1 border border-[#292929] text-emerald-400">
                  <ShieldCheck size={14} weight="fill" />
                  <span>Sesi Aman Aktif</span>
                </span>
              </div>
            </div>

            {/* Tombol Sign Out Resmi dengan Konfirmasi */}
            <ProfileSignOutButton
              userName={session.user.name}
              userEmail={session.user.email}
            />
          </div>
        </div>

        {/* Banner Administrator Khusus Role ADMIN */}
        {user.role === "ADMIN" && (
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-neutral-900/60 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                <ShieldCheck size={26} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Portal Administrator LayarRika</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase">
                    Admin Aktif
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Anda memiliki akses penuh untuk mengelola aset video legal, pengguna, dan transaksi VIP.
                </p>
              </div>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold uppercase tracking-wider transition shadow-md shadow-amber-500/15 shrink-0"
            >
              <span>Buka Admin Panel</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        )}

        {/* Status Langganan & Kuota Tiered Content */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  entitlement.isVip
                    ? "bg-[#D9A52E]/15 border border-[#D9A52E]/40 text-[#D9A52E]"
                    : "bg-neutral-800/80 border border-neutral-700 text-neutral-400"
                }`}
              >
                {entitlement.isVip ? (
                  <Crown size={24} weight="fill" />
                ) : (
                  <Sparkle size={24} weight="duotone" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {entitlement.planName}
                  </h3>
                  {entitlement.isVip ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D9A52E]/20 border border-[#D9A52E]/40 text-[#D9A52E] text-[10px] font-black uppercase tracking-wider">
                      VIP Member
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                      Free Tier
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {entitlement.isVip && entitlement.endDate
                    ? `Langganan aktif hingga ${new Date(
                        entitlement.endDate
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}`
                    : "Batas tontonan Free berlaku setiap hari"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {entitlement.isVip && (
                <Link
                  href={
                    invoices.length > 0
                      ? `/invoice/${encodeURIComponent(invoices[0].orderId)}`
                      : "#riwayat-faktur"
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D9A52E]/40 bg-[#D9A52E]/10 hover:bg-[#D9A52E]/20 text-[#D9A52E] text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Receipt size={15} weight="bold" />
                  <span>Bukti Bayar</span>
                </Link>
              )}

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] hover:from-[#e5b33d] hover:to-[#c49226] text-neutral-950 text-xs font-bold uppercase tracking-wider transition shadow-md shadow-[#D9A52E]/10"
              >
                <span>{entitlement.isVip ? "Kelola / Perpanjang VIP" : "Upgrade ke Premium VIP"}</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Kuota Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex items-start gap-3">
              <Television size={20} className="text-[#D9A52E] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-neutral-300 block">
                  Kuota Episode Serial
                </span>
                <p className="text-xs text-neutral-400">
                  {entitlement.isVip
                    ? "Akses seluruh episode serial tanpa batas kuota."
                    : `${entitlement.episodeQuota.used} dari 5 episode terpakai hari ini (${entitlement.episodeQuota.remaining} tersisa). Reset tiap tengah malam WIB.`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex items-start gap-3">
              <FilmReel size={20} className="text-[#D9A52E] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-neutral-300 block">
                  Batas Durasi Film
                </span>
                <p className="text-xs text-neutral-400">
                  {entitlement.isVip
                    ? "Nonton film berdurasi penuh tanpa jeda batas waktu."
                    : "Maksimal 60 menit (3.600 detik) pemutaran aktual untuk setiap film."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Faktur & Transaksi Pembayaran */}
        <div id="riwayat-faktur" className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-7 shadow-xl space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9A52E]/10 border border-[#D9A52E]/30 text-[#D9A52E] flex items-center justify-center">
                <Receipt size={22} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Faktur & Riwayat Transaksi</span>
                  {invoices.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                      {invoices.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Bukti pembayaran sah untuk paket langganan VIP LayarRika.
                </p>
              </div>
            </div>

            {invoices.length > 0 && (
              <span className="text-[11px] text-neutral-500">
                Format PDF Siap Cetak
              </span>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="py-6 px-4 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/80 space-y-2">
              <p className="text-xs text-neutral-400">
                Belum ada transaksi pembayaran. Pembelian paket VIP akan otomatis mencatat faktur di sini.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D9A52E] hover:underline"
              >
                <span>Lihat Pilihan Paket Langganan</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/70 overflow-hidden">
              {invoices.map((inv) => (
                <div
                  key={inv.orderId}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-neutral-800/20 px-2 rounded-xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase">
                        Lunas
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                      <span>{inv.planName}</span>
                      <span>•</span>
                      <span>
                        {new Date(inv.transactionDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-neutral-300 font-mono">
                        Rp {inv.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/invoice/${encodeURIComponent(inv.orderId)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer"
                    >
                      <ArrowSquareOut size={14} />
                      <span>Lihat Faktur</span>
                    </Link>
                    <Link
                      href={`/invoice/${encodeURIComponent(inv.orderId)}?print=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9A52E]/30 bg-[#D9A52E]/10 hover:bg-[#D9A52E]/20 text-[#D9A52E] text-xs font-semibold transition cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Cetak PDF</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab Koleksi Personal: Watchlist, Lanjutkan Menonton, dan Riwayat */}
        <div className="rounded-2xl border border-[#292929] bg-[#141414] p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Koleksi & Aktivitas Anda</h2>
              <p className="text-xs text-[#A3A3A3]">
                Kelola film dan serial yang Anda simpan serta riwayat detik tontonan Anda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/watchlist"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#292929] bg-[#1a1a1a] text-xs font-semibold text-[#D9A52E] hover:border-[#D9A52E] transition"
              >
                <span>Watchlist Penuh</span>
              </Link>
              <Link
                href="/playlists"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#292929] bg-[#1a1a1a] text-xs font-semibold text-white hover:border-amber-500 transition"
              >
                <span>Kelola Playlist</span>
              </Link>
            </div>
          </div>

          <ProfileCollections
            initialWatchlist={watchlistItems}
            initialHistory={historyItems}
          />
        </div>

        {/* Banner Pintasan Pusat Bantuan & FAQ */}
        <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D9A52E]/15 border border-[#D9A52E]/30 text-[#D9A52E]">
              <Question size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Butuh Bantuan atau Panduan Fitur?</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pelajari panduan fitur streaming, cara memilih server, navigasi serial TV, dan faktur bukti pembayaran.
              </p>
            </div>
          </div>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition shrink-0"
          >
            <span>Buka Pusat Bantuan</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
