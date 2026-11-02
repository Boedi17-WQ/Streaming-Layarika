"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { handleLogin, AuthActionResult } from "@/app/actions/auth";
import {
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  SignIn,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
} from "@phosphor-icons/react";

interface LoginFormProps {
  callbackUrl?: string;
  isRegistered?: boolean;
}

export function LoginForm({ callbackUrl = "/", isRegistered = false }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    handleLogin,
    null
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Banner Sukses jika baru selesai Registrasi */}
      {isRegistered && !state?.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
          <CheckCircle size={18} className="shrink-0 text-emerald-400 mt-0.5" weight="fill" />
          <p className="leading-relaxed">
            Akun Anda berhasil didaftarkan! Silakan masukkan email dan kata sandi Anda untuk masuk.
          </p>
        </div>
      )}

      {/* Alert Error jika login gagal */}
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-200">
          <WarningCircle size={18} className="shrink-0 text-red-400 mt-0.5" weight="fill" />
          <p className="leading-relaxed">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {/* Input Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
          >
            Alamat Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
              <EnvelopeSimple size={18} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-[#292929] bg-[#0A0A0A] py-3 pl-10 pr-4 text-sm text-[#F5F5F5] placeholder-[#525252] transition focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E]"
            />
          </div>
        </div>

        {/* Input Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
            >
              Kata Sandi
            </label>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
              <LockKey size={18} />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl border border-[#292929] bg-[#0A0A0A] py-3 pl-10 pr-11 text-sm text-[#F5F5F5] placeholder-[#525252] transition focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#737373] hover:text-[#F5F5F5] transition cursor-pointer"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] py-3.5 px-4 text-sm font-bold text-[#0A0A0A] shadow-lg transition-all duration-200 hover:bg-[#c49226] hover:border-[#c49226] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <SpinnerGap size={18} className="animate-spin text-[#0A0A0A]" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <SignIn size={18} weight="bold" />
              <span>Masuk ke Akun</span>
            </>
          )}
        </button>
      </form>

      {/* Tautan ke Halaman Register */}
      <div className="text-center text-xs text-[#A3A3A3]">
        <span>Belum memiliki akun LayarRika? </span>
        <Link
          href={`/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-bold text-[#D9A52E] hover:underline"
        >
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}
