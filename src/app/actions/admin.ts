"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import {
  createPlaybackAssetSchema,
  updatePlaybackAssetSchema,
  updateUserRoleSchema,
  grantVipSchema,
} from "@/lib/validations/admin";
import {
  createAdminPlaybackAsset,
  updateAdminPlaybackAsset,
  deleteAdminPlaybackAsset,
  updateUserRole,
  grantUserVip,
  revokeUserVip,
} from "@/services/admin.service";

/**
 * Helper untuk memvalidasi otorisasi Admin di server-side.
 */
async function verifyAdminAuth() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error("Akses ditolak: Anda tidak memiliki wewenang Administrator.");
  }

  return session.user;
}

/**
 * Server Action: Mendaftarkan aset video legal baru ke database.
 */
export async function createPlaybackAssetAction(payload: unknown) {
  try {
    await verifyAdminAuth();

    const parsed = createPlaybackAssetSchema.safeParse(payload);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const created = await createAdminPlaybackAsset(parsed.data);

    revalidatePath("/admin");
    revalidatePath("/admin/assets");
    revalidatePath("/catalog");
    revalidatePath("/");

    return {
      success: true,
      data: {
        id: created.id,
        title: created.title,
      },
    };
  } catch (error) {
    console.error("Gagal membuat aset video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
    };
  }
}

/**
 * Server Action: Memperbarui aset video legal.
 */
export async function updatePlaybackAssetAction(payload: unknown) {
  try {
    await verifyAdminAuth();

    const parsed = updatePlaybackAssetSchema.safeParse(payload);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const updated = await updateAdminPlaybackAsset(parsed.data);

    revalidatePath("/admin");
    revalidatePath("/admin/assets");
    revalidatePath("/catalog");

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
      },
    };
  } catch (error) {
    console.error("Gagal memperbarui aset video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
    };
  }
}

/**
 * Server Action: Menghapus aset video legal.
 */
export async function deletePlaybackAssetAction(id: string) {
  try {
    await verifyAdminAuth();

    if (!id || typeof id !== "string") {
      return { success: false, error: "ID aset tidak valid." };
    }

    await deleteAdminPlaybackAsset(id);

    revalidatePath("/admin");
    revalidatePath("/admin/assets");
    revalidatePath("/catalog");

    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus aset video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
    };
  }
}

/**
 * Server Action: Mengubah role pengguna (USER <-> ADMIN).
 */
export async function updateUserRoleAction(targetUserId: string, newRole: string) {
  try {
    const adminUser = await verifyAdminAuth();

    const parsed = updateUserRoleSchema.safeParse({
      userId: targetUserId,
      role: newRole,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    await updateUserRole(parsed.data.userId, parsed.data.role as Role, adminUser.id);

    revalidatePath("/admin");
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Gagal mengubah role pengguna:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
    };
  }
}

/**
 * Server Action: Memberikan atau memperpanjang akses VIP secara manual.
 */
export async function grantUserVipAction(targetUserId: string, durationDays: number) {
  try {
    await verifyAdminAuth();

    const parsed = grantVipSchema.safeParse({
      userId: targetUserId,
      durationDays,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const sub = await grantUserVip(parsed.data.userId, parsed.data.durationDays);

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        endDate: sub.endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error("Gagal memberikan akses VIP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
    };
  }
}

/**
 * Server Action: Mencabut status VIP aktif pengguna.
 */
export async function revokeUserVipAction(targetUserId: string) {
  try {
    await verifyAdminAuth();

    if (!targetUserId || typeof targetUserId !== "string") {
      return { success: false, error: "ID pengguna tidak valid." };
    }

    await revokeUserVip(targetUserId);

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Gagal mencabut status VIP pengguna:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
    };
  }
}
