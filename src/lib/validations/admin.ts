import { z } from "zod";

/**
 * Skema validasi untuk pembuatan aset video legal baru (PlaybackAsset).
 */
export const createPlaybackAssetSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Judul minimal 2 karakter")
      .max(200, "Judul maksimal 200 karakter"),
    mediaType: z.enum(["MOVIE", "TV"]),
    tmdbId: z
      .preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().positive().nullable())
      .optional(),
    seasonNumber: z
      .preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(1).nullable())
      .optional(),
    episodeNumber: z
      .preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(1).nullable())
      .optional(),
    videoUrl: z
      .string()
      .trim()
      .url("Format URL video tidak valid (harus dimulai dengan https:// atau http://)")
      .min(5, "URL video minimal 5 karakter"),
    mimeType: z
      .string()
      .trim()
      .default("application/x-mpegURL"),
    quality: z
      .string()
      .trim()
      .default("1080p"),
    durationSeconds: z
      .preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(0).nullable())
      .optional(),
    isPublic: z.boolean().default(true),
    isPremiumRequired: z.boolean().default(false),
    sourceAttribution: z
      .string()
      .trim()
      .max(300, "Atribusi sumber maksimal 300 karakter")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // Jika tipe serial TV, disarankan mengisi seasonNumber dan episodeNumber
      if (data.mediaType === "TV") {
        return data.seasonNumber !== null && data.episodeNumber !== null;
      }
      return true;
    },
    {
      message: "Untuk Serial TV, Nomor Season dan Nomor Episode wajib diisi.",
      path: ["episodeNumber"],
    }
  );

/**
 * Skema validasi untuk pembaruan aset video.
 */
export const updatePlaybackAssetSchema = createPlaybackAssetSchema.extend({
  id: z.string().min(1, "ID aset video wajib disertakan"),
});

/**
 * Skema validasi untuk pengubahan role pengguna.
 */
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "ID pengguna wajib disertakan"),
  role: z.enum(["USER", "ADMIN"]),
});

/**
 * Skema validasi untuk pemberian akses VIP manual oleh admin.
 */
export const grantVipSchema = z.object({
  userId: z.string().min(1, "ID pengguna wajib disertakan"),
  durationDays: z.coerce
    .number()
    .int("Durasi harus berupa bilangan bulat")
    .min(1, "Durasi minimal 1 hari")
    .max(365, "Durasi maksimal 365 hari (1 tahun)"),
});

export type CreatePlaybackAssetInput = z.infer<typeof createPlaybackAssetSchema>;
export type UpdatePlaybackAssetInput = z.infer<typeof updatePlaybackAssetSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type GrantVipInput = z.infer<typeof grantVipSchema>;
