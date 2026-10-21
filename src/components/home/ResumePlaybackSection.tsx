import { connection } from "next/server";
import { auth } from "@/auth";
import { getResumePlaybackList } from "@/services/history.service";
import { ResumePlaybackClient, ResumePlaybackItem } from "./ResumePlaybackClient";

/**
 * Server Component untuk memuat daftar Lanjutkan Menonton pengguna.
 * Menggunakan await connection() agar dievaluasi secara dinamis pada request time
 * di dalam Suspense boundary, sehingga tidak mengganggu Partial Prerendering halaman beranda.
 */
export async function ResumePlaybackSection() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  let items: ResumePlaybackItem[] = [];

  try {
    const rawList = await getResumePlaybackList(session.user.id, 10);

    if (rawList && rawList.length > 0) {
      items = rawList.map((item) => ({
        id: item.id,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        seasonNumber: item.seasonNumber,
        episodeNumber: item.episodeNumber,
        progressSeconds: item.progressSeconds,
        durationSeconds: item.durationSeconds,
        lastWatchedAt: item.lastWatchedAt.toISOString(),
      }));
    }
  } catch (error) {
    console.error("Gagal memuat daftar lanjutkan menonton:", error);
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return <ResumePlaybackClient initialItems={items} />;
}
