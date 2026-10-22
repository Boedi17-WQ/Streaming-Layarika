"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getUserEntitlement,
  verifyAndConsumeTvEpisode,
  getMovieWatchEntitlement,
  recordMovieHeartbeat,
  activateSimulatedVip,
  TvEpisodeAccessDecision,
  MovieWatchAccessDecision,
  MovieHeartbeatResult,
  UserEntitlementSummary,
} from "@/services/subscription.service";
import {
  getStreamUrl,
  StreamingProviderId,
} from "@/lib/streaming/providers";
import { z } from "zod";

const episodeAccessSchema = z.object({
  tmdbId: z.number().int().positive("ID Serial TMDB harus bilangan bulat positif"),
  seasonNumber: z.number().int().nonnegative("Nomor musim harus >= 0"),
  episodeNumber: z.number().int().positive("Nomor episode harus >= 1"),
});

const movieHeartbeatSchema = z.object({
  tmdbId: z.number().int().positive("ID Film TMDB harus bilangan bulat positif"),
  deltaSeconds: z.number().min(1).max(30),
});

const playbackSourceSchema = z.object({
  mediaType: z.enum(["MOVIE", "TV"]),
  tmdbId: z.number().int().positive("ID TMDB harus bilangan bulat positif"),
  seasonNumber: z.number().int().nonnegative().optional(),
  episodeNumber: z.number().int().positive().optional(),
  providerId: z.enum(["trailer", "multiembed", "vidsrc", "demo", "licensed"]),
  youtubeKey: z.string().nullable().optional(),
  licensedUrl: z.string().nullable().optional(),
});

/**
 * Server Action: Memeriksa dan mencatat hak akses pemutaran episode serial TV.
 * Mengembalikan keputusan akses berbasis server (Free 5 episode/hari vs VIP).
 */
export async function checkTvEpisodeAccessAction(
  rawParams: {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
  }
): Promise<TvEpisodeAccessDecision> {
  const session = await auth();
  const userId =
    session?.user?.id ||
    (session?.user as { sub?: string } | undefined)?.sub ||
    null;

  const parsed = episodeAccessSchema.safeParse(rawParams);
  if (!parsed.success) {
    return {
      allowed: false,
      isVip: false,
      reason: !userId ? "UNAUTHENTICATED" : ("EPISODE_LIMIT_REACHED" as const),
      usedEpisodes: 0,
      episodeLimit: 5,
      remainingEpisodes: 0,
      message: parsed.error.issues[0]?.message || "Parameter episode tidak valid.",
    };
  }

  return verifyAndConsumeTvEpisode(userId, parsed.data);
}

/**
 * Server Action: Memeriksa hak akses tontonan film (Free 60 menit vs VIP).
 */
export async function checkMovieWatchAccessAction(
  tmdbId: number
): Promise<MovieWatchAccessDecision> {
  const session = await auth();
  const userId =
    session?.user?.id ||
    (session?.user as { sub?: string } | undefined)?.sub ||
    null;

  if (!tmdbId || typeof tmdbId !== "number" || tmdbId <= 0) {
    return {
      allowed: false,
      isVip: false,
      reason: !userId ? "UNAUTHENTICATED" : ("MOVIE_LIMIT_REACHED" as const),
      consumedSeconds: 0,
      limitSeconds: 3600,
      remainingSeconds: 0,
      message: "ID Film TMDB tidak valid.",
    };
  }

  return getMovieWatchEntitlement(userId, tmdbId);
}

/**
 * Server Action: Mencatat heartbeat konsumsi detik pemutaran film secara aman.
 */
export async function recordMovieHeartbeatAction(rawInput: {
  tmdbId: number;
  deltaSeconds: number;
}): Promise<MovieHeartbeatResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      allowed: false,
      reachedLimit: true,
      consumedSeconds: 0,
      limitSeconds: 3600,
      remainingSeconds: 0,
      reason: "UNAUTHENTICATED",
      message: "Sesi tidak valid.",
    };
  }

  const parsed = movieHeartbeatSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      allowed: false,
      reachedLimit: false,
      consumedSeconds: 0,
      limitSeconds: 3600,
      remainingSeconds: 0,
      reason: "INVALID_INPUT",
      message: "Input heartbeat tidak valid.",
    };
  }

  return recordMovieHeartbeat(
    session.user.id,
    parsed.data.tmdbId,
    parsed.data.deltaSeconds
  );
}

/**
 * Server Action: Mengambil ringkasan entitlement dan kuota pengguna saat ini.
 */
export async function getUserEntitlementAction(): Promise<UserEntitlementSummary> {
  const session = await auth();
  const userId = session?.user?.id || null;

  return getUserEntitlement(userId);
}

/**
 * Server Action: Simulasi aktivasi langganan Premium VIP untuk demo akademik.
 */
export async function activateSimulatedVipAction(): Promise<{
  success: boolean;
  unauthenticated?: boolean;
  message?: string;
  error?: string;
  planName?: string;
  endDate?: Date;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Anda harus masuk terlebih dahulu untuk mengaktifkan langganan VIP.",
    };
  }

  try {
    const result = await activateSimulatedVip(session.user.id);

    revalidatePath("/pricing");
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: `Selamat! Paket ${result.planName} berhasil diaktifkan. Anda kini memiliki akses VIP tanpa batas kuota.`,
      planName: result.planName,
      endDate: result.endDate,
    };
  } catch (err) {
    console.error("Gagal aktivasi simulasi VIP:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengaktifkan simulasi VIP.",
    };
  }
}

/**
 * Server Action Resmi: Mengambil sumber media streaming yang terverifikasi dan sah
 * HANYA setelah lolos autentikasi dan pemeriksaan kuota server.
 * Menegakkan keamanan server-side sehingga sumber video tidak pernah diberikan ke client
 * sebelum verifikasi berhasil.
 */
export async function getPlaybackSourceAction(rawParams: {
  mediaType: "MOVIE" | "TV";
  tmdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
  providerId: StreamingProviderId;
  youtubeKey?: string | null;
  licensedUrl?: string | null;
}): Promise<{
  allowed: boolean;
  streamUrl: string | null;
  reason?: "UNAUTHENTICATED" | "EPISODE_LIMIT_REACHED" | "MOVIE_LIMIT_REACHED" | "VIP_UNLIMITED" | "WITHIN_FREE_QUOTA" | "WITHIN_FREE_LIMIT";
  message?: string;
  isVip?: boolean;
  usedEpisodes?: number;
  episodeLimit?: number | null;
  remainingEpisodes?: number | null;
  consumedSeconds?: number;
  remainingSeconds?: number | null;
}> {
  const session = await auth();
  const userId =
    session?.user?.id ||
    (session?.user as { sub?: string } | undefined)?.sub ||
    null;

  if (!userId) {
    return {
      allowed: false,
      streamUrl: null,
      reason: "UNAUTHENTICATED",
      message: "Silakan masuk ke akun LayarRika Anda untuk mulai menonton.",
    };
  }

  const parsed = playbackSourceSchema.safeParse(rawParams);
  if (!parsed.success) {
    return {
      allowed: false,
      streamUrl: null,
      message: parsed.error.issues[0]?.message || "Parameter pemutaran tidak valid.",
    };
  }

  const { mediaType, tmdbId, seasonNumber, episodeNumber, providerId, youtubeKey, licensedUrl } = parsed.data;

  // 1. Verifikasi kuota dan hak akses tontonan di server
  if (mediaType === "TV") {
    const sNum = seasonNumber || 1;
    const eNum = episodeNumber || 1;

    const decision = await verifyAndConsumeTvEpisode(userId, {
      tmdbId,
      seasonNumber: sNum,
      episodeNumber: eNum,
    });

    if (!decision.allowed) {
      return {
        allowed: false,
        streamUrl: null,
        reason: decision.reason,
        message: decision.message,
        isVip: decision.isVip,
        usedEpisodes: decision.usedEpisodes,
        episodeLimit: decision.episodeLimit,
        remainingEpisodes: decision.remainingEpisodes,
      };
    }

    // 2. Berikan sumber URL streaming hanya setelah diizinkan server
    const rawUrl = getStreamUrl({
      providerId,
      mediaType: "TV",
      tmdbId,
      seasonNumber: sNum,
      episodeNumber: eNum,
      youtubeKey: youtubeKey || undefined,
      licensedUrl: licensedUrl || undefined,
    });

    const streamUrl = rawUrl && rawUrl.includes("enablejsapi=1")
      ? rawUrl.replace("autoplay=0", "autoplay=1")
      : rawUrl;

    return {
      allowed: true,
      streamUrl,
      reason: decision.reason,
      isVip: decision.isVip,
      usedEpisodes: decision.usedEpisodes,
      episodeLimit: decision.episodeLimit,
      remainingEpisodes: decision.remainingEpisodes,
    };
  } else {
    // Media MOVIE
    const decision = await getMovieWatchEntitlement(userId, tmdbId);

    if (!decision.allowed) {
      return {
        allowed: false,
        streamUrl: null,
        reason: decision.reason,
        message: decision.message,
        isVip: decision.isVip,
        consumedSeconds: decision.consumedSeconds,
        remainingSeconds: decision.remainingSeconds,
      };
    }

    const rawUrl = getStreamUrl({
      providerId,
      mediaType: "MOVIE",
      tmdbId,
      youtubeKey: youtubeKey || undefined,
      licensedUrl: licensedUrl || undefined,
    });

    const streamUrl = rawUrl && rawUrl.includes("enablejsapi=1")
      ? rawUrl.replace("autoplay=0", "autoplay=1")
      : rawUrl;

    return {
      allowed: true,
      streamUrl,
      reason: decision.reason,
      isVip: decision.isVip,
      consumedSeconds: decision.consumedSeconds,
      remainingSeconds: decision.remainingSeconds,
    };
  }
}
