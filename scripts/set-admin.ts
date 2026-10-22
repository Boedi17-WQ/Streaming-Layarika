import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2];

  if (targetEmail) {
    const user = await prisma.user.findUnique({
      where: { email: targetEmail.toLowerCase() },
    });

    if (!user) {
      console.error(`❌ Pengguna dengan email "${targetEmail}" tidak ditemukan.`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.ADMIN },
    });

    console.log(`✅ Berhasil! Pengguna "${updated.name || updated.email}" (${updated.email}) sekarang memiliki wewenang: ADMIN.`);
    return;
  }

  // Jika tidak ada argumen email, cari akun yang ada
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  if (allUsers.length === 0) {
    console.log("ℹ️ Belum ada pengguna terdaftar di database.");
    return;
  }

  const existingAdmin = allUsers.find((u) => u.role === Role.ADMIN);

  if (existingAdmin) {
    console.log(`ℹ️ Admin aktif saat ini: ${existingAdmin.name} (${existingAdmin.email})`);
    console.log("Untuk mempromosikan user lain menjadi admin, jalankan:");
    console.log("  npx tsx scripts/set-admin.ts <email_pengguna>");
    return;
  }

  // Jika belum ada admin, jadikan pengguna pertama atau budibagas sebagai ADMIN
  const candidate =
    allUsers.find((u) => u.email?.includes("budi") || u.email?.includes("rika")) ||
    allUsers[0];

  const updated = await prisma.user.update({
    where: { id: candidate.id },
    data: { role: Role.ADMIN },
  });

  console.log(`👑 Mengangkat akun pertama "${updated.name || updated.email}" (${updated.email}) menjadi ADMIN!`);
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
