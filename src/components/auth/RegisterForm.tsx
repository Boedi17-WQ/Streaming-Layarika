"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { handleRegister, AuthActionResult } from "@/app/actions/auth";
import {
  User,
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  UserPlus,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
} from "@phosphor-icons/react";

interface RegisterFormProps {
  callbackUrl?: string;
}

export function RegisterForm({ callbackUrl = "/" }: RegisterFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    handleRegister,
    null
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Jika pendaftaran berhasil, arahkan ke halaman login dengan notifikasi sukses
  useEffect(() => {
    if (state?.success) {
      const target = `/login?registered=true${
        callbackUrl !== "/" ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
      }`;
      const timer = setTimeout(() => {
        router.push(target);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state?.success, callbackUrl, router]);

  if (state?.success) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center text-emerald-200">
        <CheckCircle size={36} className="mx-auto text-emerald-400" weight="fill" />
        <h2 className="text-lg font-bold text-[#F5F5F5]">Pendaftaran Berhasil!</h2>
        <p className="text-xs text-emerald-300">
          Akun LayarRika Anda telah berhasil dibuat. Mengalihkan Anda ke halaman login...
        </p>
        <div className="pt-2">
          <Link
            href={`/login?registered=true${
              callbackUrl !== "/" ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
            }`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D9A52E] px-4 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#c49226]"
          >
            <span>Masuk Sekarang</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Error Umum */}
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-200">
          <WarningCircle size={18} className="shrink-0 text-red-400 mt-0.5" weight="fill" />
          <p className="leading-relaxed">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Input Nama Lengkap */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
          >
            Nama Lengkap
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
              <User size={18} />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Contoh: Rika Pratama"
              className="w-full rounded-xl border border-[#292929] bg-[#0A0A0A] py-3 pl-10 pr-4 text-sm text-[#F5F5F5] placeholder-[#525252] transition focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E]"
            />
          </div>
          {state?.fieldErrors?.name && (
            <p className="text-[11px] text-red-400">{state.fieldErrors.name}</p>
          )}
        </div>

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
          {state?.fieldErrors?.email && (
            <p className="text-[11px] text-red-400">{state.fieldErrors.email}</p>
          )}
        </div>

        {/* Input Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
              <LockKey size={18} />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl border border-[#292929] bg-[#0A0A0A] py-3 pl-10 pr-11 text-sm text-[#F5F5F5] placeholder-[#525252] transition focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#737373] hover:text-[#F5F5F5] transition"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {state?.fieldErrors?.password && (
            <p className="text-[11px] text-red-400">{state.fieldErrors.password}</p>
          )}
        </div>

        {/* Input Konfirmasi Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
          >
            Konfirmasi Kata Sandi
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
              <LockKey size={18} />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Ulangi kata sandi Anda"
              className="w-full rounded-xl border border-[#292929] bg-[#0A0A0A] py-3 pl-10 pr-11 text-sm text-[#F5F5F5] placeholder-[#525252] transition focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#737373] hover:text-[#F5F5F5] transition"
              aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {state?.fieldErrors?.confirmPassword && (
            <p className="text-[11px] text-red-400">{state.fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] py-3.5 px-4 text-sm font-bold text-[#0A0A0A] shadow-lg transition-all duration-200 hover:bg-[#c49226] hover:border-[#c49226] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <SpinnerGap size={18} className="animate-spin text-[#0A0A0A]" />
              <span>Mendaftarkan Akun...</span>
            </>
          ) : (
            <>
              <UserPlus size={18} weight="bold" />
              <span>Daftar Akun Baru</span>
            </>
          )}
        </button>
      </form>

      {/* Tautan ke Halaman Login */}
      <div className="text-center text-xs text-[#A3A3A3]">
        <span>Sudah memiliki akun? </span>
        <Link
          href={`/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-bold text-[#D9A52E] hover:underline"
        >
          Masuk di Sini
        </Link>
      </div>
    </div>
  );
}
