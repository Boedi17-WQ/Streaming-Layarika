import "server-only";

import { db } from "@/lib/db";
import { MediaType, Role, SubscriptionStatus, Prisma } from "@prisma/client";
import {
  CreatePlaybackAssetInput,
  UpdatePlaybackAssetInput,
} from "@/lib/validations/admin";

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalVipUsers: number;
  totalAssets: number;
  totalMovieAssets: number;
  totalTvAssets: number;
  totalWatchHistory: number;
  totalWatchlists: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: Role;
    createdAt: Date;
    isVip: boolean;
    planName: string;
  }>;
  recentAssets: Array<{
    id: string;
    title: string;
    mediaType: MediaType;
    tmdbId: number | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    videoUrl: string;
    mimeType: string;
    quality: string;
    isPremiumRequired: boolean;
    sourceAttribution: string | null;
    createdAt: Date;
  }>;
}

/**
 * Mengambil statistik agregasi untuk dashboard admin.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();

  const [
    totalUsers,
    totalAdmins,
    activeVipSubscriptions,
    totalAssets,
    totalMovieAssets,
    totalTvAssets,
    totalWatchHistory,
    totalWatchlists,
    recentRawUsers,
    recentRawAssets,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: Role.ADMIN } }),
    db.userSubscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: now },
      },
    }),
    db.playbackAsset.count(),
    db.playbackAsset.count({ where: { mediaType: MediaType.MOVIE } }),
    db.playbackAsset.count({ where: { mediaType: MediaType.TV } }),
    db.watchHistory.count(),
    db.watchlist.count(),
    db.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            endDate: { gte: now },
          },
          include: { plan: true },
          take: 1,
        },
      },
    }),
    db.playbackAsset.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        mediaType: true,
        tmdbId: true,
        seasonNumber: true,
        episodeNumber: true,
        videoUrl: true,
        mimeType: true,
        quality: true,
        isPremiumRequired: true,
        sourceAttribution: true,
        createdAt: true,
      },
    }),
  ]);

  const recentUsers = recentRawUsers.map((u) => {
    const activeSub = u.subscriptions[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      isVip: Boolean(activeSub),
      planName: activeSub?.plan?.name || "LayarRika Free",
    };
  });

  return {
    totalUsers,
    totalAdmins,
    totalVipUsers: activeVipSubscriptions,
    totalAssets,
    totalMovieAssets,
    totalTvAssets,
    totalWatchHistory,
    totalWatchlists,
    recentUsers,
    recentAssets: recentRawAssets,
  };
}

export interface GetPlaybackAssetsParams {
  query?: string;
  mediaType?: "ALL" | "MOVIE" | "TV";
  page?: number;
  limit?: number;
}

/**
 * Mengambil daftar aset video legal dengan pencarian, filter, dan pagination.
 */
export async function getAdminPlaybackAssets(params: GetPlaybackAssetsParams = {}) {
  const { query, mediaType = "ALL", page = 1, limit = 15 } = params;
  const skip = (page - 1) * limit;

  // Build Prisma where filter
  const where: Prisma.PlaybackAssetWhereInput = {};

  if (mediaType && mediaType !== "ALL") {
    where.mediaType = mediaType as MediaType;
  }

  if (query && query.trim() !== "") {
    const trimmed = query.trim();
    const parsedTmdbId = parseInt(trimmed, 10);
    const tmdbCondition = !isNaN(parsedTmdbId) ? [{ tmdbId: parsedTmdbId }] : [];

    where.OR = [
      { title: { contains: trimmed, mode: "insensitive" } },
      { videoUrl: { contains: trimmed, mode: "insensitive" } },
      { sourceAttribution: { contains: trimmed, mode: "insensitive" } },
      ...tmdbCondition,
    ];
  }

  const [assets, total] = await Promise.all([
    db.playbackAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.playbackAsset.count({ where }),
  ]);

  return {
    assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Mengambil detail aset video berdasarkan ID.
 */
export async function getAdminPlaybackAssetById(id: string) {
  if (!id) return null;
  return db.playbackAsset.findUnique({
    where: { id },
  });
}

/**
 * Membuat aset video legal baru.
 */
export async function createAdminPlaybackAsset(data: CreatePlaybackAssetInput) {
  return db.playbackAsset.create({
    data: {
      title: data.title,
      mediaType: data.mediaType as MediaType,
      tmdbId: data.tmdbId ?? null,
      seasonNumber: data.mediaType === "TV" ? (data.seasonNumber ?? null) : null,
      episodeNumber: data.mediaType === "TV" ? (data.episodeNumber ?? null) : null,
      videoUrl: data.videoUrl,
      mimeType: data.mimeType || "application/x-mpegURL",
      quality: data.quality || "1080p",
      durationSeconds: data.durationSeconds ?? null,
      isPublic: data.isPublic ?? true,
      isPremiumRequired: data.isPremiumRequired ?? false,
      sourceAttribution: data.sourceAttribution ?? null,
    },
  });
}

/**
 * Memperbarui aset video legal yang ada.
 */
export async function updateAdminPlaybackAsset(data: UpdatePlaybackAssetInput) {
  const existing = await db.playbackAsset.findUnique({
    where: { id: data.id },
  });

  if (!existing) {
    throw new Error("Aset video tidak ditemukan di database.");
  }

  return db.playbackAsset.update({
    where: { id: data.id },
    data: {
      title: data.title,
      mediaType: data.mediaType as MediaType,
      tmdbId: data.tmdbId ?? null,
      seasonNumber: data.mediaType === "TV" ? (data.seasonNumber ?? null) : null,
      episodeNumber: data.mediaType === "TV" ? (data.episodeNumber ?? null) : null,
      videoUrl: data.videoUrl,
      mimeType: data.mimeType || existing.mimeType,
      quality: data.quality || existing.quality,
      durationSeconds: data.durationSeconds ?? null,
      isPublic: data.isPublic ?? existing.isPublic,
      isPremiumRequired: data.isPremiumRequired ?? existing.isPremiumRequired,
      sourceAttribution: data.sourceAttribution ?? null,
    },
  });
}

/**
 * Menghapus aset video legal.
 */
export async function deleteAdminPlaybackAsset(id: string) {
  const existing = await db.playbackAsset.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Aset video tidak ditemukan.");
  }

  return db.playbackAsset.delete({
    where: { id },
  });
}

export interface GetUsersParams {
  query?: string;
  role?: "ALL" | "USER" | "ADMIN";
  isVip?: "ALL" | "VIP" | "FREE";
  page?: number;
  limit?: number;
}

/**
 * Mengambil daftar pengguna dengan filter, role, dan status langganan.
 */
export async function getAdminUsers(params: GetUsersParams = {}) {
  const { query, role = "ALL", isVip = "ALL", page = 1, limit = 15 } = params;
  const skip = (page - 1) * limit;
  const now = new Date();
  const where: Prisma.UserWhereInput = {};

  if (role && role !== "ALL") {
    where.role = role as Role;
  }

  if (query && query.trim() !== "") {
    const trimmed = query.trim();
    where.OR = [
      { name: { contains: trimmed, mode: "insensitive" } },
      { email: { contains: trimmed, mode: "insensitive" } },
    ];
  }

  if (isVip === "VIP") {
    where.subscriptions = {
      some: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: now },
      },
    };
  } else if (isVip === "FREE") {
    where.subscriptions = {
      none: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: now },
      },
    };
  }

  const [rawUsers, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            endDate: { gte: now },
          },
          include: { plan: true },
          take: 1,
        },
        _count: {
          select: {
            watchlists: true,
            watchHistory: true,
            playlists: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  const users = rawUsers.map((u) => {
    const activeSub = u.subscriptions[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      createdAt: u.createdAt,
      isVip: Boolean(activeSub),
      planName: activeSub?.plan?.name || "LayarRika Free",
      vipEndDate: activeSub?.endDate || null,
      stats: {
        watchlists: u._count.watchlists,
        history: u._count.watchHistory,
        playlists: u._count.playlists,
      },
    };
  });

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Mengubah role pengguna (USER <-> ADMIN).
 * Mencegah admin menurunkan status akun miliknya sendiri agar tidak terkunci.
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: Role,
  currentAdminId: string
) {
  if (targetUserId === currentAdminId && newRole !== Role.ADMIN) {
    throw new Error("Anda tidak dapat mencabut hak akses Admin dari akun Anda sendiri.");
  }

  const user = await db.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  return db.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });
}

/**
 * Memberikan atau memperpanjang akses VIP secara manual untuk pengguna tertentu.
 */
export async function grantUserVip(targetUserId: string, durationDays: number) {
  const user = await db.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  // Temukan paket VIP di database (atau buat fallback jika belum ada)
  let vipPlan = await db.subscriptionPlan.findUnique({
    where: { slug: "premium-monthly" },
  });

  if (!vipPlan) {
    vipPlan = await db.subscriptionPlan.create({
      data: {
        slug: "premium-monthly",
        name: "LayarRika Premium VIP",
        description: "Akses penuh tanpa batas kuota tontonan LayarRika.",
        price: 49000,
        durationDays: 30,
        features: ["Akses tanpa batas episode", "Nonton film penuh tanpa jeda 60 menit"],
        isActive: true,
      },
    });
  }

  const now = new Date();
  const durationMs = durationDays * 24 * 60 * 60 * 1000;

  // Cek apakah ada langganan aktif yang belum berakhir
  const activeSub = await db.userSubscription.findFirst({
    where: {
      userId: targetUserId,
      status: SubscriptionStatus.ACTIVE,
      endDate: { gte: now },
    },
    orderBy: { endDate: "desc" },
  });

  const baseDate = activeSub ? activeSub.endDate : now;
  const newEndDate = new Date(baseDate.getTime() + durationMs);

  if (activeSub) {
    return db.userSubscription.update({
      where: { id: activeSub.id },
      data: {
        endDate: newEndDate,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  return db.userSubscription.create({
    data: {
      userId: targetUserId,
      planId: vipPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate: newEndDate,
    },
  });
}

/**
 * Mencabut status VIP aktif pengguna.
 */
export async function revokeUserVip(targetUserId: string) {
  const now = new Date();

  return db.userSubscription.updateMany({
    where: {
      userId: targetUserId,
      status: SubscriptionStatus.ACTIVE,
    },
    data: {
      status: SubscriptionStatus.CANCELLED,
      endDate: now,
    },
  });
}
