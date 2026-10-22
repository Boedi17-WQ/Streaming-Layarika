import "server-only";

import { db } from "@/lib/db";
import { MediaType } from "@prisma/client";

export interface CreatePlaylistParams {
  name: string;
  description?: string | null;
}

export interface UpdatePlaylistParams {
  id: string;
  name: string;
  description?: string | null;
}

export interface AddPlaylistItemParams {
  playlistId: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
}

/**
 * Mengambil seluruh daftar playlist milik pengguna tertentu.
 * Termasuk jumlah item dan 4 poster pertama untuk preview cover.
 */
export async function getUserPlaylists(userId: string) {
  if (!userId) throw new Error("User ID wajib disertakan");

  return db.playlist.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
      items: {
        take: 4,
        orderBy: { order: "asc" },
        select: {
          id: true,
          posterPath: true,
          title: true,
          mediaType: true,
        },
      },
    },
  });
}

/**
 * Mengambil detail playlist spesifik berdasarkan ID.
 * Akses dibatasi ketat: hanya pemilik (userId) yang dapat melihat playlist ini.
 */
export async function getPlaylistById(userId: string, playlistId: string) {
  if (!userId || !playlistId) return null;

  return db.playlist.findFirst({
    where: {
      id: playlistId,
      userId,
    },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: { items: true },
      },
    },
  });
}

/**
 * Membuat playlist baru untuk pengguna yang terautentikasi.
 */
export async function createPlaylist(userId: string, data: CreatePlaylistParams) {
  if (!userId) throw new Error("User ID wajib disertakan");

  const trimmedName = data.name.trim();
  if (!trimmedName) throw new Error("Nama playlist tidak boleh kosong");

  return db.playlist.create({
    data: {
      userId,
      name: trimmedName,
      description: data.description?.trim() || null,
    },
  });
}

/**
 * Memperbarui nama dan deskripsi playlist.
 * Memverifikasi bahwa playlist benar-benar milik pengguna.
 */
export async function updatePlaylist(userId: string, data: UpdatePlaylistParams) {
  if (!userId) throw new Error("User ID wajib disertakan");

  const trimmedName = data.name.trim();
  if (!trimmedName) throw new Error("Nama playlist tidak boleh kosong");

  // Pastikan playlist milik user ini
  const existing = await db.playlist.findFirst({
    where: { id: data.id, userId },
  });

  if (!existing) {
    throw new Error("Playlist tidak ditemukan atau Anda tidak memiliki akses");
  }

  return db.playlist.update({
    where: { id: data.id },
    data: {
      name: trimmedName,
      description: data.description?.trim() || null,
    },
  });
}

/**
 * Menghapus playlist beserta seluruh item di dalamnya.
 * Memverifikasi bahwa playlist benar-benar milik pengguna.
 */
export async function deletePlaylist(userId: string, playlistId: string) {
  if (!userId) throw new Error("User ID wajib disertakan");

  // Pastikan playlist milik user ini
  const existing = await db.playlist.findFirst({
    where: { id: playlistId, userId },
  });

  if (!existing) {
    throw new Error("Playlist tidak ditemukan atau Anda tidak memiliki akses");
  }

  return db.playlist.delete({
    where: { id: playlistId },
  });
}

/**
 * Menambahkan film atau serial ke dalam playlist.
 * Memastikan playlist milik pengguna dan item tidak diduplikasi.
 */
export async function addItemToPlaylist(userId: string, data: AddPlaylistItemParams) {
  if (!userId) throw new Error("User ID wajib disertakan");

  // 1. Verifikasi kepemilikan playlist
  const playlist = await db.playlist.findFirst({
    where: { id: data.playlistId, userId },
    include: {
      items: {
        orderBy: { order: "desc" },
        take: 1,
      },
    },
  });

  if (!playlist) {
    throw new Error("Playlist tidak ditemukan atau Anda tidak memiliki akses");
  }

  // 2. Cek apakah item sudah ada di dalam playlist
  const existingItem = await db.playlistItem.findUnique({
    where: {
      playlistId_mediaType_tmdbId: {
        playlistId: data.playlistId,
        mediaType: data.mediaType,
        tmdbId: data.tmdbId,
      },
    },
  });

  if (existingItem) {
    throw new Error("Konten sudah ada di dalam playlist ini");
  }

  // 3. Tentukan nilai urutan (order) berikutnya
  const nextOrder = playlist.items.length > 0 ? playlist.items[0].order + 1 : 0;

  // 4. Buat item baru dan perbarui waktu updatedAt pada playlist
  const [item] = await db.$transaction([
    db.playlistItem.create({
      data: {
        playlistId: data.playlistId,
        mediaType: data.mediaType,
        tmdbId: data.tmdbId,
        title: data.title,
        posterPath: data.posterPath || null,
        order: nextOrder,
      },
    }),
    db.playlist.update({
      where: { id: data.playlistId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return item;
}

/**
 * Menghapus item dari playlist.
 * Memverifikasi kepemilikan playlist sebelum menghapus item.
 */
export async function removeItemFromPlaylist(
  userId: string,
  playlistId: string,
  itemId: string
) {
  if (!userId) throw new Error("User ID wajib disertakan");

  const playlist = await db.playlist.findFirst({
    where: { id: playlistId, userId },
  });

  if (!playlist) {
    throw new Error("Playlist tidak ditemukan atau Anda tidak memiliki akses");
  }

  const [item] = await db.$transaction([
    db.playlistItem.delete({
      where: { id: itemId, playlistId },
    }),
    db.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return item;
}

/**
 * Memperbarui urutan item dalam playlist.
 */
export async function reorderPlaylistItems(
  userId: string,
  playlistId: string,
  itemIds: string[]
) {
  if (!userId) throw new Error("User ID wajib disertakan");

  const playlist = await db.playlist.findFirst({
    where: { id: playlistId, userId },
  });

  if (!playlist) {
    throw new Error("Playlist tidak ditemukan atau Anda tidak memiliki akses");
  }

  // Perbarui urutan tiap item dalam transaksi database
  const updatePromises = itemIds.map((itemId, index) =>
    db.playlistItem.update({
      where: { id: itemId, playlistId },
      data: { order: index },
    })
  );

  return db.$transaction([
    ...updatePromises,
    db.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

/**
 * Mengambil seluruh playlist pengguna disertai status apakah konten (tmdbId & mediaType)
 * sudah ada di dalamnya. Digunakan untuk modal Add-to-Playlist di halaman detail film/serial.
 */
export async function getUserPlaylistsWithMediaStatus(
  userId: string,
  tmdbId: number,
  mediaType: MediaType
) {
  if (!userId) return [];

  const playlists = await db.playlist.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
      items: {
        where: {
          tmdbId,
          mediaType,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return playlists.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    itemCount: p._count.items,
    containsMedia: p.items.length > 0,
    mediaItemId: p.items[0]?.id || null,
  }));
}
