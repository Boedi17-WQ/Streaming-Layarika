import type { Metadata } from "next";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getAdminUsers } from "@/services/admin.service";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = {
  title: "Manajemen Pengguna — Admin LayarRika",
  description: "Kelola role akun dan aktivasi manual status VIP pengguna.",
};

export const instant = false;

export default async function AdminUsersPage() {
  await connection();
  const session = await auth();
  const { users } = await getAdminUsers({
    limit: 100, // Ambil daftar lengkap untuk filter client-side responsif
  });

  return (
    <AdminUsersClient
      initialUsers={users}
      currentAdminId={session?.user?.id || ""}
    />
  );
}
