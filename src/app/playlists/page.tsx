import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserPlaylists } from "@/services/playlist.service";
import { PlaylistList, PlaylistSummary } from "@/components/playlist/PlaylistList";
import { SignIn, Playlist as PlaylistIcon, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Playlist Saya — LayarRika",
  description: "Kelola daftar putar film dan serial TV kustom pribadi Anda di LayarRika.",
};

export default async function PlaylistsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-bold mb-2">
            <PlaylistIcon size={16} weight="fill" />
            <span>Koleksi Sinematik Pribadi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Playlist Saya
          </h1>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={36} weight="duotone" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Masuk untuk Mengelola Playlist
          </h2>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Daftar playlist kustom Anda disimpan secara aman di cloud dan dapat diakses dari perangkat mana pun setelah masuk ke akun LayarRika Anda.
          </p>
          <Link
            href="/login?callbackUrl=/playlists"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <SignIn size={20} weight="bold" />
            <span>Masuk Sekarang</span>
          </Link>
        </div>
      </main>
    );
  }

  const rawPlaylists = await getUserPlaylists(session.user.id);

  // Normalisasi data untuk client component
  const playlists: PlaylistSummary[] = rawPlaylists.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    _count: p._count,
    items: p.items.map((item) => ({
      id: item.id,
      posterPath: item.posterPath,
      title: item.title,
      mediaType: item.mediaType as "MOVIE" | "TV",
    })),
  }));

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-bold mb-2">
          <PlaylistIcon size={16} weight="fill" />
          <span>Koleksi Sinematik Pribadi</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Playlist Saya
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Kelola daftar putar film dan serial TV kustom tersimpan di cloud Neon PostgreSQL
        </p>
      </div>

      <PlaylistList initialPlaylists={playlists} />
    </main>
  );
}
