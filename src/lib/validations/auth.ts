import { z } from "zod";

/**
 * Skema validasi untuk formulir Masuk (Login)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format alamat email tidak valid"),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi")
    .min(6, "Kata sandi minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Skema validasi untuk formulir Pendaftaran (Register)
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter")
      .max(60, "Nama maksimal 60 karakter"),
    email: z
      .string()
      .trim()
      .min(1, "Email wajib diisi")
      .email("Format alamat email tidak valid")
      .toLowerCase(),
    password: z
      .string()
      .min(6, "Kata sandi minimal 6 karakter")
      .max(100, "Kata sandi terlalu panjang"),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok dengan kata sandi",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
