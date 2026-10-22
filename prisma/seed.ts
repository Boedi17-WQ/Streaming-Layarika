import { PrismaClient, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data LayarRika...");

  // 1. Seed Paket Langganan (Free & Premium VIP)
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {
      name: "LayarRika Free",
      description: "Akses eksplorasi dasar sinematik LayarRika dengan batas harian.",
      price: 0,
      durationDays: 3650,
      episodeLimit: 5, // Maksimal 5 episode unik per hari
      movieWatchSecondsLimit: 3600, // Maksimal 60 menit per film
      quotaPeriodDays: 1,
      features: [
        "Akses seluruh katalog film & serial TV TMDB",
        "Pencarian real-time & genre filtering dinamis",
        "Maksimal 5 episode serial unik per hari",
        "Maksimal 60 menit tontonan per film",
        "Penyimpanan Watchlist & Custom Playlists",
      ],
      isActive: true,
    },
    create: {
      name: "LayarRika Free",
      slug: "free",
      description: "Akses eksplorasi dasar sinematik LayarRika dengan batas harian.",
      price: 0,
      durationDays: 3650,
      episodeLimit: 5,
      movieWatchSecondsLimit: 3600,
      quotaPeriodDays: 1,
      features: [
        "Akses seluruh katalog film & serial TV TMDB",
        "Pencarian real-time & genre filtering dinamis",
        "Maksimal 5 episode serial unik per hari",
        "Maksimal 60 menit tontonan per film",
        "Penyimpanan Watchlist & Custom Playlists",
      ],
      isActive: true,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "premium-monthly" },
    update: {
      name: "LayarRika Premium VIP",
      description: "Akses penuh tanpa batas kuota tontonan dengan badge eksklusif VIP Member.",
      price: 49000, // Rp 49.000 / bulan
      durationDays: 30,
      episodeLimit: null, // Unlimited episode
      movieWatchSecondsLimit: null, // Unlimited film
      quotaPeriodDays: 30,
      features: [
        "Akses seluruh episode serial tanpa batas kuota Free",
        "Nonton film penuh tanpa batas 60 menit",
        "Lencana resmi VIP Member di profil dan header",
        "Kualitas streaming tertinggi hingga Full HD / 4K",
        "Akses prioritas seluruh server pemutar legal",
      ],
      isActive: true,
    },
    create: {
      name: "LayarRika Premium VIP",
      slug: "premium-monthly",
      description: "Akses penuh tanpa batas kuota tontonan dengan badge eksklusif VIP Member.",
      price: 49000,
      durationDays: 30,
      episodeLimit: null,
      movieWatchSecondsLimit: null,
      quotaPeriodDays: 30,
      features: [
        "Akses seluruh episode serial tanpa batas kuota Free",
        "Nonton film penuh tanpa batas 60 menit",
        "Lencana resmi VIP Member di profil dan header",
        "Kualitas streaming tertinggi hingga Full HD / 4K",
        "Akses prioritas seluruh server pemutar legal",
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
