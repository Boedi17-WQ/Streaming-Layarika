export interface SystemChecks {
  database: {
    status: "ok" | "error";
    latencyMs: number | null;
    error?: string;
  };
  environment: {
    status: "ok" | "degraded";
    databaseConfigured: boolean;
    directUrlConfigured: boolean;
    authConfigured: boolean;
    githubOAuthConfigured: boolean;
    tmdbConfigured: boolean;
    midtransConfigured: boolean;
    midtransMode: "production" | "sandbox";
    simulatedPaymentsEnabled: boolean;
    nodeEnv: string;
    appUrlConfigured: boolean;
  };
}

export interface HealthCheckResult {
  status: "ok" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  nodeVersion: string;
  checks: SystemChecks;
}

export interface HealthCheckOptions {
  dbPing?: () => Promise<void>;
  env?: Record<string, string | undefined>;
}

/**
 * Memeriksa status kesehatan server Next.js, konektivitas database Neon PostgreSQL,
 * dan ketersediaan variabel lingkungan penting tanpa membocorkan nilai rahasia.
 */
export async function checkSystemHealth(
  options?: HealthCheckOptions
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const env = options?.env ?? process.env;

  // 1. Audit Ketersediaan Variabel Lingkungan Kritis
  const databaseConfigured = Boolean(env.DATABASE_URL);
  const directUrlConfigured = Boolean(env.DIRECT_URL);
  const authConfigured = Boolean(env.AUTH_SECRET);
  const githubOAuthConfigured = Boolean(
    (env.AUTH_GITHUB_ID || env.GITHUB_CLIENT_ID) &&
    (env.AUTH_GITHUB_SECRET || env.GITHUB_CLIENT_SECRET)
  );
  const tmdbConfigured = Boolean(
    env.TMDB_API_READ_ACCESS_TOKEN ||
    env.TMDB_ACCESS_TOKEN ||
    env.TMDB_API_KEY
  );
  const midtransConfigured = Boolean(
    env.MIDTRANS_SERVER_KEY && env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
  );
  const midtransMode =
    env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ? "production" : "sandbox";
  const simulatedPaymentsEnabled =
    env.ENABLE_SIMULATED_PAYMENTS === "true" ||
    env.SIMULATED_BILLING_ENABLED === "true";
  const appUrlConfigured = Boolean(env.NEXT_PUBLIC_APP_URL);
  const nodeEnv = env.NODE_ENV || "development";

  const isCriticalEnvMissing = !databaseConfigured || !authConfigured;
  const isSecondaryEnvMissing = !tmdbConfigured || !midtransConfigured;

  const envStatus: "ok" | "degraded" = isSecondaryEnvMissing ? "degraded" : "ok";

  // 2. Uji Konektivitas Database Neon Serverless PostgreSQL
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;
  let dbError: string | undefined = undefined;

  try {
    const dbPingStart = performance.now();
    if (options?.dbPing) {
      await options.dbPing();
    } else {
      const { db } = await import("@/lib/db");
      await db.$queryRaw`SELECT 1 as ping`;
    }
    const dbPingEnd = performance.now();
    dbLatencyMs = Math.round(dbPingEnd - dbPingStart);
  } catch (error: unknown) {
    dbStatus = "error";
    dbError = error instanceof Error ? error.message : "Gagal terhubung ke database Neon.";
  }

  // 3. Tentukan Status Menyeluruh (Overall Status)
  let status: "ok" | "degraded" | "unhealthy" = "ok";
  if (dbStatus === "error" || isCriticalEnvMissing) {
    status = "unhealthy";
  } else if (envStatus === "degraded" || (dbLatencyMs !== null && dbLatencyMs > 2500)) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date(startTime).toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: "0.1.0",
    nodeVersion: process.version,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      environment: {
        status: envStatus,
        databaseConfigured,
        directUrlConfigured,
        authConfigured,
        githubOAuthConfigured,
        tmdbConfigured,
        midtransConfigured,
        midtransMode,
        simulatedPaymentsEnabled,
        nodeEnv,
        appUrlConfigured,
      },
    },
  };
}
