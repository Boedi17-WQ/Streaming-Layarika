import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Container } from "@/components/ui/Container";
import { getUserWatchlist } from "@/services/watchlist.service";
import { getUserWatchHistory } from "@/services/history.service";
import {
  ProfileCollections,
  WatchlistCardItem,
  WatchHistoryCardItem,
} from "@/components/profile/ProfileCollections";
import {
  SignOut,
  ShieldCheck,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Profil & Koleksi Pengguna — LayarRika",
  description: "Kelola akun, watchlist tersimpan, dan riwayat tontonan personal LayarRika Anda.",
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

  // Ambil koleksi personal watchlist dan riwayat tontonan pengguna dari database Neon
  const [rawWatchlist, rawHistory] = await Promise.all([
    getUserWatchlist(user.id),
    getUserWatchHistory(user.id),
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

            {/* Tombol Sign Out Resmi */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 hover:border-red-500/60"
              >
                <SignOut size={16} />
                <span>Keluar</span>
              </button>
            </form>
          </div>
        </div>

        {/* Tab Koleksi Personal: Watchlist, Lanjutkan Menonton, dan Riwayat */}
        <div className="rounded-2xl border border-[#292929] bg-[#141414] p-5 sm:p-7 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">Koleksi & Aktivitas Anda</h2>
            <p className="text-xs text-[#A3A3A3]">
              Kelola film dan serial yang Anda simpan serta riwayat detik tontonan Anda.
            </p>
          </div>

          <ProfileCollections
            initialWatchlist={watchlistItems}
            initialHistory={historyItems}
          />
        </div>
      </Container>
    </div>
  );
}
