import type { Metadata } from "next";
import { connection } from "next/server";
import { getAdminDashboardStats } from "@/services/admin.service";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard Overview — Admin LayarRika",
  description: "Ringkasan statistik metrik pengguna, aset video, dan aktivitas streaming LayarRika.",
};

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const stats = await getAdminDashboardStats();

  return <AdminDashboardClient stats={stats} />;
}
