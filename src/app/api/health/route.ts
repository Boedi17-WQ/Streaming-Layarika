import { NextResponse } from "next/server";
import { connection } from "next/server";
import { checkSystemHealth } from "@/lib/health/health.service";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

/**
 * GET /api/health
 * Endpoint pemeriksaan kesehatan (Health Check) publik untuk monitoring uptime Vercel & database Neon.
 */
export async function GET() {
  await connection();
  try {
    const health = await checkSystemHealth();
    const statusCode = health.status === "unhealthy" ? 503 : 200;

    return NextResponse.json(health, {
      status: statusCode,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Kesalahan tak terduga saat evaluasi health check.";

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      {
        status: 503,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}

/**
 * HEAD /api/health
 * Digunakan oleh service uptime monitor (BetterStack, UptimeRobot, Vercel Health Checks)
 * untuk ping ringan tanpa payload body.
 */
export async function HEAD() {
  await connection();
  try {
    const health = await checkSystemHealth();
    const statusCode = health.status === "unhealthy" ? 503 : 200;

    return new Response(null, {
      status: statusCode,
      headers: NO_CACHE_HEADERS,
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: NO_CACHE_HEADERS,
    });
  }
}
