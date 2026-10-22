-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN "description" TEXT,
ADD COLUMN "episodeLimit" INTEGER,
ADD COLUMN "movieWatchSecondsLimit" INTEGER,
ADD COLUMN "quotaPeriodDays" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "episode_quota_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "periodKey" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episode_quota_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_watch_consumptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "consumedSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_watch_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "episode_quota_usages_userId_periodKey_idx" ON "episode_quota_usages"("userId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "episode_quota_usages_userId_periodKey_tmdbId_seasonNumber_epis_key" ON "episode_quota_usages"("userId", "periodKey", "tmdbId", "seasonNumber", "episodeNumber");

-- CreateIndex
CREATE INDEX "movie_watch_consumptions_userId_idx" ON "movie_watch_consumptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_watch_consumptions_userId_tmdbId_key" ON "movie_watch_consumptions"("userId", "tmdbId");

-- AddForeignKey
ALTER TABLE "episode_quota_usages" ADD CONSTRAINT "episode_quota_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_watch_consumptions" ADD CONSTRAINT "movie_watch_consumptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
