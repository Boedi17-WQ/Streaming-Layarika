"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  saveWatchProgress,
  deleteWatchHistory,
  clearUserWatchHistory,
  SaveProgressPayload,
} from "@/services/history.service";

export interface HistoryActionResult {
  success: boolean;
  unauthenticated?: boolean;
  error?: string;
  message?: string;
}

/**
 * Server Action untuk mencatat progres tontonan (detik tonton dan durasi).
 * Memverifikasi sesi server-side dan memvalidasi payload via Zod di service layer.
 */
export async function recordWatchProgressAction(
  payload: SaveProgressPayload
): Promise<HistoryActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Pengguna belum terautentikasi.",
    };
  }

  try {
    await saveWatchProgress(session.user.id, payload);
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: "Progres tontonan berhasil disimpan",
    };
  } catch (error: unknown) {
    console.error("Gagal mencatat progres tontonan:", error);
    const message = error instanceof Error ? error.message : "Gagal menyimpan progres tontonan.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action untuk menghapus satu entri riwayat tontonan dari profil.
 */
export async function deleteWatchHistoryAction(historyId: string): Promise<HistoryActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  if (!historyId) {
    return {
      success: false,
      error: "ID riwayat tontonan tidak valid",
    };
  }

  try {
    await deleteWatchHistory(session.user.id, historyId);
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: "Riwayat tontonan berhasil dihapus",
    };
  } catch (error) {
    console.error("Gagal menghapus riwayat tontonan:", error);
    return {
      success: false,
      error: "Gagal menghapus riwayat tontonan.",
    };
  }
}

/**
 * Server Action untuk membersihkan seluruh riwayat tontonan pengguna.
 */
export async function clearWatchHistoryAction(): Promise<HistoryActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  try {
    await clearUserWatchHistory(session.user.id);
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: "Seluruh riwayat tontonan berhasil dibersihkan",
    };
  } catch (error) {
    console.error("Gagal membersihkan riwayat tontonan:", error);
    return {
      success: false,
      error: "Gagal membersihkan riwayat tontonan.",
    };
  }
}
