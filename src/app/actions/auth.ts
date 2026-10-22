"use server";

import { signIn, signOut as authSignOut } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server Action resmi untuk mengakhiri sesi autentikasi pengguna
 * dan mengalihkan ke halaman beranda.
 */
export async function handleSignOut() {
  await authSignOut({ redirectTo: "/" });
}

/**
 * Server Action untuk mendaftarkan akun baru (Register)
 */
export async function handleRegister(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    }
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data pendaftaran tidak valid",
      fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    // Periksa apakah email sudah terdaftar
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Alamat email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.",
        fieldErrors: { email: "Email sudah terdaftar" },
      };
    }

    // Hash kata sandi dengan salt cost 12
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat data pengguna di database
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Gagal mendaftarkan pengguna baru:", error);

    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("Can't reach database server") || errorMessage.includes("P1001")) {
      return {
        success: false,
        error: "Gagal terhubung ke database. Pastikan DATABASE_URL di berkas .env.local sudah diisi dengan connection string Neon PostgreSQL Anda yang valid.",
      };
    }

    return {
      success: false,
      error: "Terjadi kesalahan pada server saat membuat akun. Silakan coba kembali.",
    };
  }
}

/**
 * Server Action untuk masuk akun (Login) dengan email & kata sandi
 */
export async function handleLogin(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  const safeCallbackUrl = callbackUrl && !callbackUrl.startsWith("http") ? callbackUrl : "/";

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Format email atau kata sandi tidak valid",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Email atau kata sandi yang Anda masukkan salah.",
          };
        default:
          return {
            success: false,
            error: "Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.",
          };
      }
    }

    // Lempar ulang redirect error internal Next.js
    throw error;
  }
}

/**
 * Server Action untuk masuk akun melalui GitHub OAuth
 */
export async function signInWithGithubAction(callbackUrl?: string) {
  const safeCallbackUrl = callbackUrl && !callbackUrl.startsWith("http") ? callbackUrl : "/";
  await signIn("github", { redirectTo: safeCallbackUrl });
}
