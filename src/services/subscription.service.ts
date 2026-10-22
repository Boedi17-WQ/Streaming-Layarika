import "server-only";

import { db } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import { getJakartaPeriodKey } from "@/lib/subscription/date-utils";

export { getJakartaPeriodKey };

/**
 * Konfigurasi flag simulasi aktivasi langganan.
 * Diaktifkan secara aman untuk demonstrasi akademik dan development.
 */
export const SIMULATED_BILLING_ENABLED =
  process.env.SIMULATED_BILLING_ENABLED === "true" ||
  process.env.NODE_ENV !== "production";

export interface UserSubscriptionSummary {
  isVip: boolean;
  isGuest: boolean;
  planSlug: "free" | "premium-monthly" | string;
  planName: string;
  status: SubscriptionStatus | "GUEST" | "FREE_DEFAULT";
  startDate: Date | null;
  endDate: Date | null;
  simulatedBillingEnabled: boolean;
}

export interface UserEntitlementSummary extends UserSubscriptionSummary {
  episodeQuota: {
    periodKey: string;
    used: number;
    limit: number | null; // null jika VIP
    remaining: number | null; // null jika VIP
  };
}

export interface TvEpisodeAccessDecision {
  allowed: boolean;
  isVip: boolean;
  reason?: "UNAUTHENTICATED" | "EPISODE_LIMIT_REACHED" | "VIP_UNLIMITED" | "WITHIN_FREE_QUOTA";
  alreadyCounted?: boolean;
  usedEpisodes: number;
  episodeLimit: number | null;
  remainingEpisodes: number | null;
  message?: string;
}

export interface MovieWatchAccessDecision {
  allowed: boolean;
  isVip: boolean;
  reason?: "UNAUTHENTICATED" | "MOVIE_LIMIT_REACHED" | "VIP_UNLIMITED" | "WITHIN_FREE_LIMIT";
  consumedSeconds: number;
  limitSeconds: number | null;
  remainingSeconds: number | null;
  message?: string;
}

export interface MovieHeartbeatResult {
  allowed: boolean;
  reachedLimit: boolean;
  consumedSeconds: number;
  limitSeconds: number | null;
  remainingSeconds: number | null;
  reason?: string;
  message?: string;
}

/**
 * Memeriksa status langganan aktif pengguna di server.
 * Memastikan pemeriksaan langganan memperhitungkan tanggal masa berlaku (startDate & endDate).
 */
export async function getUserSubscriptionStatus(
  userId: string | null
): Promise<UserSubscriptionSummary> {
  if (!userId) {
    return {
      isVip: false,
      isGuest: true,
      planSlug: "free",
      planName: "Tamu (Belum Masuk)",
      status: "GUEST",
      startDate: null,
      endDate: null,
      simulatedBillingEnabled: SIMULATED_BILLING_ENABLED,
    };
  }

  const now = new Date();

  // Cari langganan aktif yang mencakup waktu saat ini
  const activeSub = await db.userSubscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      plan: true,
    },
    orderBy: {
      endDate: "desc",
    },
  });

  if (activeSub && activeSub.plan) {
    const isVipPlan =
      activeSub.plan.slug === "premium-monthly" ||
      activeSub.plan.episodeLimit === null;

    return {
      isVip: isVipPlan,
      isGuest: false,
      planSlug: activeSub.plan.slug,
      planName: activeSub.plan.name,
      status: activeSub.status,
      startDate: activeSub.startDate,
      endDate: activeSub.endDate,
      simulatedBillingEnabled: SIMULATED_BILLING_ENABLED,
    };
  }

  return {
    isVip: false,
    isGuest: false,
    planSlug: "free",
    planName: "LayarRika Free",
    status: "FREE_DEFAULT",
    startDate: null,
    endDate: null,
    simulatedBillingEnabled: SIMULATED_BILLING_ENABLED,
  };
}

/**
 * Mengambil ringkasan entitlement lengkap pengguna (status VIP dan kuota episode periode berjalan).
 */
export async function getUserEntitlement(
  userId: string | null
): Promise<UserEntitlementSummary> {
  const subStatus = await getUserSubscriptionStatus(userId);
  const periodKey = getJakartaPeriodKey();

  if (subStatus.isVip) {
    return {
      ...subStatus,
      episodeQuota: {
        periodKey,
        used: 0,
        limit: null,
        remaining: null,
      },
    };
  }

  let used = 0;
  if (userId) {
    used = await db.episodeQuotaUsage.count({
      where: {
        userId,
        periodKey,
      },
    });
  }

  const limit = 5;
  const remaining = Math.max(0, limit - used);

  return {
    ...subStatus,
    episodeQuota: {
      periodKey,
      used,
      limit,
      remaining,
    },
  };
}

/**
 * Memverifikasi dan mencatat akses pemutaran episode serial TV untuk pengguna.
 * Jika Free: Menegakkan batas 5 episode unik per periode hari (Asia/Jakarta).
 * Episode yang sama pada hari yang sama tidak dihitung ulang.
 */
export async function verifyAndConsumeTvEpisode(
  userId: string | null,
  params: {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
  }
): Promise<TvEpisodeAccessDecision> {
  if (!userId) {
    return {
      allowed: false,
      isVip: false,
      reason: "UNAUTHENTICATED",
      usedEpisodes: 0,
      episodeLimit: 5,
      remainingEpisodes: 0,
      message: "Silakan masuk ke akun LayarRika Anda untuk memutar episode ini.",
    };
  }

  const subStatus = await getUserSubscriptionStatus(userId);
  if (subStatus.isVip) {
    return {
      allowed: true,
      isVip: true,
      reason: "VIP_UNLIMITED",
      usedEpisodes: 0,
      episodeLimit: null,
      remainingEpisodes: null,
    };
  }

  const periodKey = getJakartaPeriodKey();

  return await db.$transaction(async (tx) => {
    // 1. Cek apakah episode ini sudah pernah diakses pada periode hari ini
    const existingAccess = await tx.episodeQuotaUsage.findUnique({
      where: {
        userId_periodKey_tmdbId_seasonNumber_episodeNumber: {
          userId,
          periodKey,
          tmdbId: params.tmdbId,
          seasonNumber: params.seasonNumber,
          episodeNumber: params.episodeNumber,
        },
      },
    });

    const currentCount = await tx.episodeQuotaUsage.count({
      where: {
        userId,
        periodKey,
      },
    });

    // Jika sudah pernah diakses hari ini, izinkan memutar ulang tanpa memotong kuota baru
    if (existingAccess) {
      return {
        allowed: true,
        isVip: false,
        reason: "WITHIN_FREE_QUOTA" as const,
        alreadyCounted: true,
        usedEpisodes: currentCount,
        episodeLimit: 5,
        remainingEpisodes: Math.max(0, 5 - currentCount),
      };
    }

    // 2. Jika belum pernah diakses hari ini, periksa apakah kuota 5 episode sudah habis
    if (currentCount >= 5) {
      return {
        allowed: false,
        isVip: false,
        reason: "EPISODE_LIMIT_REACHED" as const,
        alreadyCounted: false,
        usedEpisodes: currentCount,
        episodeLimit: 5,
        remainingEpisodes: 0,
        message:
          "Kamu telah mencapai batas 5 episode untuk paket Free pada periode ini. Aktifkan Premium VIP untuk melanjutkan tanpa batas kuota Free.",
      };
    }

    // 3. Catat akses episode baru secara atomik
    await tx.episodeQuotaUsage.upsert({
      where: {
        userId_periodKey_tmdbId_seasonNumber_episodeNumber: {
          userId,
          periodKey,
          tmdbId: params.tmdbId,
          seasonNumber: params.seasonNumber,
          episodeNumber: params.episodeNumber,
        },
      },
      update: {},
      create: {
        userId,
        periodKey,
        tmdbId: params.tmdbId,
        seasonNumber: params.seasonNumber,
        episodeNumber: params.episodeNumber,
      },
    });

    const updatedCount = await tx.episodeQuotaUsage.count({
      where: {
        userId,
        periodKey,
      },
    });

    return {
      allowed: true,
      isVip: false,
      reason: "WITHIN_FREE_QUOTA" as const,
      alreadyCounted: false,
      usedEpisodes: updatedCount,
      episodeLimit: 5,
      remainingEpisodes: Math.max(0, 5 - updatedCount),
    };
  });
}

/**
 * Memeriksa hak akses tontonan film pengguna Free vs VIP.
 * Pengguna Free dibatasi maksimal 3.600 detik (60 menit) per film.
 */
export async function getMovieWatchEntitlement(
  userId: string | null,
  tmdbId: number
): Promise<MovieWatchAccessDecision> {
  if (!userId) {
    return {
      allowed: false,
      isVip: false,
      reason: "UNAUTHENTICATED",
      consumedSeconds: 0,
      limitSeconds: 3600,
      remainingSeconds: 0,
      message: "Silakan masuk ke akun LayarRika Anda untuk memutar film ini.",
    };
  }

  const subStatus = await getUserSubscriptionStatus(userId);
  if (subStatus.isVip) {
    return {
      allowed: true,
      isVip: true,
      reason: "VIP_UNLIMITED",
      consumedSeconds: 0,
      limitSeconds: null,
      remainingSeconds: null,
    };
  }

  const consumption = await db.movieWatchConsumption.findUnique({
    where: {
      userId_tmdbId: {
        userId,
        tmdbId,
      },
    },
  });

  const consumed = consumption ? consumption.consumedSeconds : 0;
  const limitSeconds = 3600;

  if (consumed >= limitSeconds) {
    return {
      allowed: false,
      isVip: false,
      reason: "MOVIE_LIMIT_REACHED",
      consumedSeconds: consumed,
      limitSeconds,
      remainingSeconds: 0,
      message:
        "Batas tontonan Free untuk film ini telah tercapai. Aktifkan Premium VIP untuk melanjutkan menonton.",
    };
  }

  return {
    allowed: true,
    isVip: false,
    reason: "WITHIN_FREE_LIMIT",
    consumedSeconds: consumed,
    limitSeconds,
    remainingSeconds: Math.max(0, limitSeconds - consumed),
  };
}

/**
 * Mencatat heartbeat durasi tontonan film aktual secara berkala.
 * Mengamankan delta waktu agar tidak dapat dimanipulasi oleh client.
 */
export async function recordMovieHeartbeat(
  userId: string,
  tmdbId: number,
  deltaSeconds: number
): Promise<MovieHeartbeatResult> {
  if (!userId) {
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

  // Batasi rentang delta: minimal 1 detik, maksimal 20 detik per request heartbeat
  const safeDelta = Math.max(1, Math.min(20, Math.floor(deltaSeconds)));

  const subStatus = await getUserSubscriptionStatus(userId);
  if (subStatus.isVip) {
    return {
      allowed: true,
      reachedLimit: false,
      consumedSeconds: 0,
      limitSeconds: null,
      remainingSeconds: null,
    };
  }

  return await db.$transaction(async (tx) => {
    // Ambil data konsumsi saat ini
    const existing = await tx.movieWatchConsumption.findUnique({
      where: {
        userId_tmdbId: {
          userId,
          tmdbId,
        },
      },
    });

    const currentSeconds = existing ? existing.consumedSeconds : 0;

    if (currentSeconds >= 3600) {
      return {
        allowed: false,
        reachedLimit: true,
        consumedSeconds: 3600,
        limitSeconds: 3600,
        remainingSeconds: 0,
        reason: "MOVIE_LIMIT_REACHED",
        message:
          "Batas tontonan Free untuk film ini telah tercapai. Aktifkan Premium VIP untuk melanjutkan menonton.",
      };
    }

    const nextSeconds = Math.min(3600, currentSeconds + safeDelta);

    const updated = await tx.movieWatchConsumption.upsert({
      where: {
        userId_tmdbId: {
          userId,
          tmdbId,
        },
      },
      create: {
        userId,
        tmdbId,
        consumedSeconds: nextSeconds,
      },
      update: {
        consumedSeconds: nextSeconds,
      },
    });

    const reached = updated.consumedSeconds >= 3600;

    return {
      allowed: !reached,
      reachedLimit: reached,
      consumedSeconds: updated.consumedSeconds,
      limitSeconds: 3600,
      remainingSeconds: Math.max(0, 3600 - updated.consumedSeconds),
      reason: reached ? "MOVIE_LIMIT_REACHED" : undefined,
      message: reached
        ? "Batas tontonan Free untuk film ini telah tercapai. Aktifkan Premium VIP untuk melanjutkan menonton."
        : undefined,
    };
  });
}

/**
 * Simulasi aktivasi langganan Premium VIP untuk kebutuhan demo akademik.
 * Memperbarui data langganan pengguna di Neon PostgreSQL secara persisten.
 */
export async function activateSimulatedVip(userId: string) {
  if (!userId) {
    throw new Error("User ID wajib disertakan");
  }

  if (!SIMULATED_BILLING_ENABLED) {
    throw new Error("Fitur simulasi billing dinonaktifkan di lingkungan ini.");
  }

  const premiumPlan = await db.subscriptionPlan.findUnique({
    where: { slug: "premium-monthly" },
  });

  if (!premiumPlan) {
    throw new Error("Paket Premium VIP tidak ditemukan di database.");
  }

  const now = new Date();
  const durationMs = (premiumPlan.durationDays || 30) * 24 * 60 * 60 * 1000;

  // Cek apakah pengguna saat ini sudah memiliki langganan aktif
  const existingActive = await db.userSubscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      endDate: { gte: now },
    },
    orderBy: { endDate: "desc" },
  });

  // Jika sudah ada langganan aktif, perpanjang dari tanggal berakhir sebelumnya
  const startDate = existingActive ? existingActive.startDate : now;
  const baseEnd = existingActive ? existingActive.endDate : now;
  const endDate = new Date(baseEnd.getTime() + durationMs);

  let subscription;

  if (existingActive) {
    subscription = await db.userSubscription.update({
      where: { id: existingActive.id },
      data: {
        planId: premiumPlan.id,
        status: SubscriptionStatus.ACTIVE,
        endDate,
      },
    });
  } else {
    subscription = await db.userSubscription.create({
      data: {
        userId,
        planId: premiumPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
    });
  }

  return {
    success: true,
    planName: premiumPlan.name,
    startDate,
    endDate,
    subscriptionId: subscription.id,
  };
}

/**
 * Mengambil seluruh paket langganan aktif untuk ditampilkan pada halaman /pricing.
 */
export async function getSubscriptionPlans() {
  return db.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
}
