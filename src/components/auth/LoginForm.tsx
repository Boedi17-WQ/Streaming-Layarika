"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { handleLogin, signInWithGithubAction, AuthActionResult } from "@/app/actions/auth";
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
  const [isGithubPending, setIsGithubPending] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tombol Masuk Cepat dengan GitHub OAuth */}
      <form
        action={async () => {
          setIsGithubPending(true);
          try {
            await signInWithGithubAction(callbackUrl);
          } catch {
            setIsGithubPending(false);
          }
        }}
      >
        <button
          type="submit"
          disabled={isGithubPending}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-[#333333] bg-[#24292e] py-3 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[#2b3137] hover:border-[#444444] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGithubPending ? (
            <>
              <SpinnerGap size={18} className="animate-spin text-white" />
              <span>Menghubungkan ke GitHub...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Lanjutkan dengan GitHub</span>
            </>
          )}
        </button>
      </form>

      {/* Pembatas / Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#292929]" />
        </div>
        <div className="relative bg-[#171717] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
          Atau Masuk dengan Email
        </div>
      </div>

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
