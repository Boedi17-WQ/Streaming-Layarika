import { PrismaClient, MediaType } from '@prisma/client';
import dotenv from 'dotenv';
import { z } from 'zod';
import { validateWatchProgress } from '../lib/validations/progress';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

const watchlistSchema = z.object({
  tmdbId: z.number().int().positive('ID TMDB harus bernilai positif'),
  mediaType: z.enum(['MOVIE', 'TV'], { message: 'Jenis media harus MOVIE atau TV' }),
  title: z.string().min(1, 'Judul wajib disertakan'),
  posterPath: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
});

async function runTahap5IntegrationTest() {
  console.log('--- STARTING TAHAP 5 DATABASE & LOGIC INTEGRATION TEST ---');
  
  // 1. Get test user
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found in Neon DB for testing');
  }
  console.log(`[PASS] Using test user: ${user.name} (${user.id})`);

  const testTmdbId = 888888; // Unique test ID
  
  // Cleanup any leftover test data
  await prisma.watchlist.deleteMany({
    where: { userId: user.id, tmdbId: testTmdbId },
  });
  await prisma.watchHistory.deleteMany({
    where: { userId: user.id, tmdbId: testTmdbId },
  });

  // 2. Validate input with Zod
  const validWatchlistPayload = {
    mediaType: 'MOVIE' as const,
    tmdbId: testTmdbId,
    title: 'Testing Tahap 5 Movie',
    posterPath: '/test-poster.jpg',
    rating: 8.5,
    releaseYear: 2026,
  };
  const parsedWatchlist = watchlistSchema.parse(validWatchlistPayload);
  console.log('[PASS] Zod validation for valid Watchlist payload passed.');

  // 3. Test Watchlist Addition
  const createdWatchlist = await prisma.watchlist.create({
    data: {
      userId: user.id,
      mediaType: parsedWatchlist.mediaType as MediaType,
      tmdbId: parsedWatchlist.tmdbId,
      title: parsedWatchlist.title,
      posterPath: parsedWatchlist.posterPath,
      rating: parsedWatchlist.rating,
      releaseYear: parsedWatchlist.releaseYear,
    },
  });
  console.log(`[PASS] Watchlist item created successfully in Neon DB with ID: ${createdWatchlist.id}`);

  // 4. Test Duplicate Constraint Prevention
  let duplicateThrew = false;
  try {
    await prisma.watchlist.create({
      data: {
        userId: user.id,
        mediaType: parsedWatchlist.mediaType as MediaType,
        tmdbId: parsedWatchlist.tmdbId,
        title: parsedWatchlist.title,
      },
    });
  } catch (err: unknown) {
    duplicateThrew = true;
    console.log('[PASS] Duplicate Watchlist insertion correctly rejected by database constraint:', (err as Error).message.slice(0, 70));
  }
  if (!duplicateThrew) {
    throw new Error('Database allowed duplicate watchlist entry!');
  }

  // 5. Query user watchlist
  const userList = await prisma.watchlist.findMany({
    where: { userId: user.id },
  });
  const found = userList.some((item) => item.tmdbId === testTmdbId);
  if (!found) throw new Error('Created item not found in user watchlist query');
  console.log(`[PASS] User watchlist query returned ${userList.length} item(s), including test item.`);

  // 6. Test Watch History & Progress Validation
  const validProgressPayload = {
    mediaType: 'MOVIE' as const,
    tmdbId: testTmdbId,
    title: 'Testing Tahap 5 Movie',
    posterPath: '/test-poster.jpg',
    progressSeconds: 1500, // 25 minutes
    durationSeconds: 6000, // 100 minutes (25% watched)
  };
  const validatedProgress = validateWatchProgress(validProgressPayload);
  if (!validatedProgress.success || !validatedProgress.data) {
    throw new Error('validateWatchProgress failed');
  }
  const progressData = validatedProgress.data;
  console.log('[PASS] validateWatchProgress passed:', progressData);

  // 7. Save Watch Progress
  const historyEntry = await prisma.watchHistory.create({
    data: {
      userId: user.id,
      mediaType: progressData.mediaType as MediaType,
      tmdbId: progressData.tmdbId,
      title: progressData.title,
      posterPath: progressData.posterPath,
      progressSeconds: progressData.progressSeconds,
      durationSeconds: progressData.durationSeconds,
      completed: false,
      lastWatchedAt: new Date(),
    },
  });
  console.log(`[PASS] Watch history progress recorded in Neon DB with ID: ${historyEntry.id}`);

  // 8. Update Progress to Completed (> 90%)
  const completedProgress = 5800; // > 95% of 6000
  const isCompleted = completedProgress >= 6000 * 0.9;
  const updatedHistory = await prisma.watchHistory.update({
    where: { id: historyEntry.id },
    data: {
      progressSeconds: completedProgress,
      completed: isCompleted,
      lastWatchedAt: new Date(),
    },
  });
  console.log(`[PASS] Progress updated to ${updatedHistory.progressSeconds}s, completed status: ${updatedHistory.completed}`);
  if (!updatedHistory.completed) {
    throw new Error('Progress >= 90% should mark item as completed');
  }

  // 9. Query Resume Playback (Completed items should NOT appear in Resume Playback list)
  const resumeItems = await prisma.watchHistory.findMany({
    where: {
      userId: user.id,
      completed: false,
      progressSeconds: { gt: 0 },
    },
  });
  const shouldNotBeInResume = resumeItems.some((item) => item.tmdbId === testTmdbId);
  if (shouldNotBeInResume) {
    throw new Error('Completed item appeared in resume playback list!');
  }
  console.log('[PASS] Completed item is correctly excluded from Resume Playback list.');

  // 10. Clean up test records
  await prisma.watchlist.deleteMany({
    where: { userId: user.id, tmdbId: testTmdbId },
  });
  await prisma.watchHistory.deleteMany({
    where: { userId: user.id, tmdbId: testTmdbId },
  });
  console.log('[PASS] Test records cleanly removed from database.');

  console.log('--- ALL TAHAP 5 INTEGRATION TESTS PASSED WITH 100% SUCCESS ---');
}

runTahap5IntegrationTest()
  .catch((e) => {
    console.error('Integration test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
