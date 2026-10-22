import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama playlist tidak boleh kosong")
    .max(100, "Nama playlist maksimal 100 karakter"),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .nullable(),
});

export const updatePlaylistSchema = z.object({
  id: z.string().min(1, "ID playlist wajib disertakan"),
  name: z
    .string()
    .trim()
    .min(1, "Nama playlist tidak boleh kosong")
    .max(100, "Nama playlist maksimal 100 karakter"),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .nullable(),
});

export const addPlaylistItemSchema = z.object({
  playlistId: z.string().min(1, "ID playlist wajib disertakan"),
  tmdbId: z.number().int().positive("ID TMDB harus bilangan bulat positif"),
  mediaType: z.enum(["MOVIE", "TV"], { message: "Jenis media harus MOVIE atau TV" }),
  title: z.string().trim().min(1, "Judul media wajib disertakan"),
  posterPath: z.string().nullable().optional(),
});

export const removePlaylistItemSchema = z.object({
  playlistId: z.string().min(1, "ID playlist wajib disertakan"),
  itemId: z.string().min(1, "ID item wajib disertakan"),
});

export const reorderPlaylistItemsSchema = z.object({
  playlistId: z.string().min(1, "ID playlist wajib disertakan"),
  itemIds: z.array(z.string()).min(1, "Daftar ID item wajib disertakan"),
});

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddPlaylistItemInput = z.infer<typeof addPlaylistItemSchema>;
export type RemovePlaylistItemInput = z.infer<typeof removePlaylistItemSchema>;
export type ReorderPlaylistItemsInput = z.infer<typeof reorderPlaylistItemsSchema>;
