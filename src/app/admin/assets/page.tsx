import type { Metadata } from "next";
import { connection } from "next/server";
import { getAdminPlaybackAssets } from "@/services/admin.service";
import { AdminAssetsClient } from "@/components/admin/AdminAssetsClient";

export const metadata: Metadata = {
  title: "Aset Video Legal — Admin LayarRika",
  description: "Manajemen katalog aset video sah, stream HLS, dan kuota VIP.",
};

export const instant = false;

export default async function AdminAssetsPage() {
  await connection();
  const { assets } = await getAdminPlaybackAssets({
    limit: 100, // Ambil daftar lengkap untuk filter client-side responsif
  });

  return <AdminAssetsClient initialAssets={assets} />;
}
