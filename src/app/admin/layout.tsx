import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { ShieldSlash, ArrowLeft, SignIn } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Admin Panel — LayarRika",
  description: "Portal manajemen aset video legal, pengguna, dan langganan VIP LayarRika.",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await auth();

  // 1. Jika belum login, alihkan ke /login dengan callbackUrl
  if (!session || !session.user || !session.user.id) {
    redirect("/login?callbackUrl=/admin");
  }

  // 2. Proteksi Otorisasi Ketat: Jika role bukan ADMIN, tampilkan 403 Forbidden Screen Sinematik
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 text-[#F5F5F5]">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#161212] p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400">
            <ShieldSlash size={36} weight="fill" />
          </div>

          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
              HTTP 403 — Terlarang
            </span>
            <h1 className="text-xl font-black text-white">
              Akses Administrator Ditolak
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Akun Anda (<strong className="text-neutral-200">{session.user.email}</strong>) terdaftar dengan role{" "}
              <span className="font-bold text-amber-400">USER</span>. Halaman ini hanya dapat diakses oleh Administrator sistem LayarRika.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-white hover:bg-neutral-700 transition"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link
              href="/login?callbackUrl=/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A52E] to-[#b3821c] text-neutral-950 text-xs font-bold uppercase tracking-wider hover:from-[#e5b33d] hover:to-[#c49226] transition shadow-md shadow-[#D9A52E]/10"
            >
              <SignIn size={16} weight="bold" />
              <span>Ganti Akun Admin</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex">
      {/* Desktop Sidebar */}
      <AdminSidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
