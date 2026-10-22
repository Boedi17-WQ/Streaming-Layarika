"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addItemToPlaylist,
  removeItemFromPlaylist,
  reorderPlaylistItems,
  getUserPlaylistsWithMediaStatus,
} from "@/services/playlist.service";
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistItemSchema,
  removePlaylistItemSchema,
  reorderPlaylistItemsSchema,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  AddPlaylistItemInput,
} from "@/lib/validations/playlist";
import { MediaType } from "@prisma/client";

export interface PlaylistActionResult<T = unknown> {
  success: boolean;
  data?: T;
  unauthenticated?: boolean;
  message?: string;
  error?: string;
}

/**
 * Server Action: Membuat playlist baru.
 */
export async function createPlaylistAction(
  rawInput: CreatePlaylistInput
): Promise<PlaylistActionResult<{ id: string; name: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Anda harus masuk terlebih dahulu untuk membuat playlist.",
    };
  }

  const parsed = createPlaylistSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid",
    };
  }

  try {
    const playlist = await createPlaylist(session.user.id, parsed.data);
    revalidatePath("/playlists");

    return {
      success: true,
      data: { id: playlist.id, name: playlist.name },
      message: `Playlist "${playlist.name}" berhasil dibuat`,
    };
  } catch (error) {
    console.error("Gagal membuat playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat playlist",
    };
  }
}

/**
 * Server Action: Memperbarui nama dan deskripsi playlist.
 */
export async function updatePlaylistAction(
  rawInput: UpdatePlaylistInput
): Promise<PlaylistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  const parsed = updatePlaylistSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid",
    };
  }

  try {
    const playlist = await updatePlaylist(session.user.id, parsed.data);
    revalidatePath("/playlists");
    revalidatePath(`/playlists/${playlist.id}`);

    return {
      success: true,
      message: `Playlist "${playlist.name}" berhasil diperbarui`,
    };
  } catch (error) {
    console.error("Gagal memperbarui playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui playlist",
    };
  }
}

/**
 * Server Action: Menghapus playlist.
 */
export async function deletePlaylistAction(
  playlistId: string
): Promise<PlaylistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  if (!playlistId || typeof playlistId !== "string") {
    return {
      success: false,
      error: "ID playlist tidak valid",
    };
  }

  try {
    await deletePlaylist(session.user.id, playlistId);
    revalidatePath("/playlists");

    return {
      success: true,
      message: "Playlist berhasil dihapus",
    };
  } catch (error) {
    console.error("Gagal menghapus playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus playlist",
    };
  }
}

/**
 * Server Action: Menambahkan item ke playlist.
 */
export async function addPlaylistItemAction(
  rawInput: AddPlaylistItemInput
): Promise<PlaylistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Anda harus masuk terlebih dahulu untuk mengelola playlist.",
    };
  }

  const parsed = addPlaylistItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data input media tidak valid",
    };
  }

  try {
    const item = await addItemToPlaylist(session.user.id, {
      playlistId: parsed.data.playlistId,
      tmdbId: parsed.data.tmdbId,
      mediaType: parsed.data.mediaType,
      title: parsed.data.title,
      posterPath: parsed.data.posterPath,
    });

    revalidatePath("/playlists");
    revalidatePath(`/playlists/${parsed.data.playlistId}`);

    return {
      success: true,
      data: item,
      message: `"${parsed.data.title}" berhasil ditambahkan ke playlist`,
    };
  } catch (error) {
    console.error("Gagal menambahkan item ke playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambahkan item ke playlist",
    };
  }
}

/**
 * Server Action: Menghapus item dari playlist.
 */
export async function removePlaylistItemAction(
  playlistId: string,
  itemId: string
): Promise<PlaylistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  const parsed = removePlaylistItemSchema.safeParse({ playlistId, itemId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Parameter tidak valid",
    };
  }

  try {
    await removeItemFromPlaylist(session.user.id, playlistId, itemId);
    revalidatePath("/playlists");
    revalidatePath(`/playlists/${playlistId}`);

    return {
      success: true,
      message: "Item berhasil dihapus dari playlist",
    };
  } catch (error) {
    console.error("Gagal menghapus item dari playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus item",
    };
  }
}

/**
 * Server Action: Mengubah urutan item dalam playlist.
 */
export async function reorderPlaylistItemsAction(
  playlistId: string,
  itemIds: string[]
): Promise<PlaylistActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  const parsed = reorderPlaylistItemsSchema.safeParse({ playlistId, itemIds });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Daftar urutan tidak valid",
    };
  }

  try {
    await reorderPlaylistItems(session.user.id, playlistId, itemIds);
    revalidatePath(`/playlists/${playlistId}`);

    return {
      success: true,
      message: "Urutan playlist berhasil diperbarui",
    };
  } catch (error) {
    console.error("Gagal mengubah urutan playlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah urutan",
    };
  }
}

/**
 * Server Action: Mengambil status playlist pengguna untuk film/serial spesifik.
 * Digunakan untuk modal Add-to-Playlist.
 */
export async function getPlaylistsForMediaAction(
  tmdbId: number,
  mediaType: "MOVIE" | "TV"
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authenticated: false,
      playlists: [],
    };
  }

  try {
    const playlists = await getUserPlaylistsWithMediaStatus(
      session.user.id,
      tmdbId,
      mediaType as MediaType
    );
    return {
      authenticated: true,
      playlists,
    };
  } catch (error) {
    console.error("Gagal mengambil status playlist:", error);
    return {
      authenticated: true,
      playlists: [],
    };
  }
}
