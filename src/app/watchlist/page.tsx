import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { getUserWatchlist } from "@/services/watchlist.service";
import { WatchlistView, WatchlistItemData } from "@/components/watchlist/WatchlistView";
import { Bookmark, SignIn, Sparkle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Watchlist Saya — LayarRika",
  description: "Daftar film dan serial TV tersimpan milik Anda di LayarRika. Tersimpan permanen dan tersinkronisasi di seluruh perangkat.",
};

export const instant = false;

async function WatchlistDataLoader() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#292929] bg-[#121212] p-10 sm:p-14 text-center space-y-4 max-w-lg mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E]">
          <Bookmark size={32} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-[#F5F5F5]">
            Masuk untuk Mengakses Watchlist Anda
          </h3>
          <p className="text-xs text-[#A3A3A3] leading-relaxed">
            Simpan film dan serial favoritmu secara permanen di database cloud, sehingga dapat diakses kapan saja dari perangkat apa saja.
          </p>
        </div>
        <Link
          href="/login?callbackUrl=/watchlist"
          className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-6 py-2.5 text-xs font-bold text-[#0A0A0A] shadow-lg shadow-[#D9A52E]/20 transition hover:bg-[#c49226]"
        >
          <SignIn size={16} weight="bold" />
          <span>Masuk Sekarang</span>
        </Link>
      </div>
    );
  }

  const rawItems = await getUserWatchlist(session.user.id);
  const items: WatchlistItemData[] = rawItems.map((item) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType as "MOVIE" | "TV",
    title: item.title,
    posterPath: item.posterPath,
    rating: item.rating,
    releaseYear: item.releaseYear,
    createdAt: item.createdAt,
  }));

  return <WatchlistView initialItems={items} />;
}

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 sm:py-14 pb-24 text-[#F5F5F5]">
      <Container className="space-y-10">
        {/* Header Watchlist */}
        <div className="max-w-2xl mx-auto space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-3 py-1 text-xs font-semibold text-[#D9A52E]">
            <Sparkle size={13} weight="fill" />
            <span>Koleksi Pribadi Tersimpan</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F5]">
            Watchlist Saya
          </h1>

          <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-md mx-auto leading-relaxed">
            Daftar film dan serial yang Anda simpan untuk ditonton nanti. Data tersimpan permanen di cloud database.
          </p>
        </div>

        {/* Content Loader */}
        <Suspense fallback={<WatchlistSkeleton />}>
          <WatchlistDataLoader />
        </Suspense>
      </Container>
    </div>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-[#171717]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col space-y-3 rounded-xl border border-[#292929] bg-[#171717] p-3"
          >
            <div className="aspect-[2/3] w-full rounded-lg bg-[#242424]" />
            <div className="h-4 w-3/4 rounded bg-[#242424]" />
            <div className="h-3 w-1/2 rounded bg-[#1F1F1F]" />
          </div>
        ))}
      </div>
    </div>
  );
}
