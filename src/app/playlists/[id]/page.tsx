import { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getPlaylistById } from "@/services/playlist.service";
import {
  PlaylistDetailView,
  DetailPlaylist,
  DetailPlaylistItem,
} from "@/components/playlist/PlaylistDetailView";
import { ArrowLeft, LockKey, SignIn, WarningCircle } from "@phosphor-icons/react/dist/ssr";

export const instant = false;

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PlaylistDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return {
      title: "Detail Playlist — LayarRika",
    };
  }

  const playlist = await getPlaylistById(session.user.id, id);
  if (!playlist) {
    return {
      title: "Playlist Tidak Ditemukan — LayarRika",
    };
  }

  return {
    title: `${playlist.name} — Playlist LayarRika`,
    description: playlist.description || `Koleksi tontonan ${playlist.name} di LayarRika.`,
  };
}

export default async function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const { id } = await params;
  await connection();
  const session = await auth();

  // 1. Pengguna belum login
  if (!session?.user?.id) {
    return (
      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <Link
          href="/playlists"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition mb-6 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Playlist</span>
        </Link>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <LockKey size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akses Terbatas</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Silakan masuk untuk mengakses playlist pribadi Anda.
          </p>
          <Link
            href={`/login?callbackUrl=/playlists/${id}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition cursor-pointer"
          >
            <SignIn size={18} weight="bold" />
            <span>Masuk Sekarang</span>
          </Link>
        </div>
      </main>
    );
  }

  // 2. Ambil playlist dengan verifikasi kepemilikan ketat
  const playlist = await getPlaylistById(session.user.id, id);

  // 3. Jika tidak ditemukan atau ID milik orang lain
  if (!playlist) {
    return (
      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <Link
          href="/playlists"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition mb-6 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Playlist</span>
        </Link>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <WarningCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Playlist Tidak Ditemukan</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Playlist tidak tersedia atau Anda tidak memiliki izin untuk melihat koleksi ini.
          </p>
          <Link
            href="/playlists"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition cursor-pointer"
          >
            <span>Buka Daftar Playlist Saya</span>
          </Link>
        </div>
      </main>
    );
  }

  // 4. Normalisasi data untuk client component
  const normalizedPlaylist: DetailPlaylist = {
    id: playlist.id,
    userId: playlist.userId,
    name: playlist.name,
    description: playlist.description,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    _count: playlist._count,
    items: playlist.items.map(
      (item): DetailPlaylistItem => ({
        id: item.id,
        playlistId: item.playlistId,
        mediaType: item.mediaType as "MOVIE" | "TV",
        tmdbId: item.tmdbId,
        title: item.title,
        posterPath: item.posterPath,
        order: item.order,
        addedAt: item.addedAt,
      })
    ),
  };

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <PlaylistDetailView initialPlaylist={normalizedPlaylist} />
    </main>
  );
}
