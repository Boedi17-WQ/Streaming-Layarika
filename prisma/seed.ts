import { PrismaClient, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data LayarRika...");

  // 1. Seed Paket Langganan (Free & Premium)
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "LayarRika Free",
      slug: "free",
      price: 0,
      durationDays: 3650, // 10 tahun
      features: [
        "Akses seluruh katalog metadata film & serial TMDB",
        "Pencarian multi-katalog tanpa batas",
        "Pemutaran konten berlisensi publik & demo (HD 720p)",
        "Manajemen playlist & riwayat tontonan pribadi",
      ],
      isActive: true,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "premium-monthly" },
    update: {},
    create: {
      name: "LayarRika Premium Sinematik",
      slug: "premium-monthly",
      price: 49000, // Rp 49.000 / bulan
      durationDays: 30,
      features: [
        "Seluruh fitur paket Free",
        "Kualitas video tertinggi hingga 4K UHD & HDR Audio",
        "Akses tanpa batas ke seluruh aset video eksklusif",
        "Dukungan prioritas & badge profil emas",
      ],
      isActive: true,
    },
  });

  console.log(`✓ Paket langganan berhasil disiapkan: ${freePlan.name}, ${premiumPlan.name}`);

  // 2. Seed Aset Video Legal (Open-Movie Blender Foundation & Test Stream Resmi)
  const assets = [
    {
      title: "Tears of Steel — Official Blender Open Movie",
      mediaType: MediaType.MOVIE,
      tmdbId: 111111,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      mimeType: "video/mp4",
      quality: "1080p",
      durationSeconds: 734,
      isPublic: true,
      isPremiumRequired: false,
      sourceAttribution: "Blender Foundation (Creative Commons Attribution 3.0)",
    },
    {
      title: "Big Buck Bunny — Open Movie Project",
      mediaType: MediaType.MOVIE,
      tmdbId: 222222,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      mimeType: "video/mp4",
      quality: "1080p",
      durationSeconds: 596,
      isPublic: true,
      isPremiumRequired: false,
      sourceAttribution: "Blender Foundation (Creative Commons Attribution 3.0)",
    },
    {
      title: "Sintel — The Durian Open Movie Project",
      mediaType: MediaType.MOVIE,
      tmdbId: 333333,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      mimeType: "video/mp4",
      quality: "1080p",
      durationSeconds: 888,
      isPublic: true,
      isPremiumRequired: false,
      sourceAttribution: "Blender Foundation (Creative Commons Attribution 3.0)",
    },
  ];

  for (const asset of assets) {
    const existing = await prisma.playbackAsset.findFirst({
      where: { title: asset.title },
    });

    if (!existing) {
      await prisma.playbackAsset.create({
        data: asset,
      });
    }
  }

  console.log(`✓ Berhasil memverifikasi ${assets.length} aset video legal terdaftar.`);
  console.log("✅ Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
