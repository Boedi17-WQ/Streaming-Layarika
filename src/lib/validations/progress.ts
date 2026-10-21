import { z } from "zod";

/**
 * Skema validasi ketat untuk progres tontonan.
 * Memastikan detik tonton tidak negatif dan tidak melebihi total durasi media.
 */
export const watchProgressSchema = z
  .object({
    tmdbId: z.number().int().positive("TMDB ID harus berupa bilangan bulat positif"),
    mediaType: z.enum(["MOVIE", "TV"], {
      message: "Jenis media harus berupa MOVIE atau TV",
    }),
    title: z.string().min(1, "Judul konten wajib diisi").max(255),
    posterPath: z.string().nullable().optional(),
    seasonNumber: z.number().int().nonnegative().nullable().optional(),
    episodeNumber: z.number().int().positive().nullable().optional(),
    progressSeconds: z
      .number()
      .int()
      .nonnegative("Progres waktu tonton tidak boleh negatif"),
    durationSeconds: z
      .number()
      .int()
      .positive("Durasi media harus berupa bilangan positif")
      .nullable()
      .optional(),
    playbackAssetId: z.string().cuid().nullable().optional(),
  })
  .refine(
    (data) => {
      // Jika durasi media diketahui, progres detik tidak boleh melebihi durasi
      if (data.durationSeconds && data.durationSeconds > 0) {
        return data.progressSeconds <= data.durationSeconds + 5; // Toleransi 5 detik untuk buffer
      }
      return true;
    },
    {
      message: "Progres tontonan tidak boleh melebihi durasi total video",
      path: ["progressSeconds"],
    }
  );

export type WatchProgressInput = z.infer<typeof watchProgressSchema>;

/**
 * Helper validasi aman yang mengembalikan hasil tervalidasi atau error deskriptif
 */
export function validateWatchProgress(input: unknown): {
  success: boolean;
  data?: WatchProgressInput;
  error?: string;
} {
  const result = watchProgressSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: (result.error.issues || []).map((e) => e.message).join(", ") || result.error.message,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}
