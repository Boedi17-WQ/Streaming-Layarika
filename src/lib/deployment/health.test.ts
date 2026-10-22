import assert from "node:assert/strict";
import { checkSystemHealth } from "../health/health.service";

async function runHealthCheckTests() {
  console.log("=================================================");
  console.log("🧪 LayarRika — Tahap 10: Health Check Unit Tests");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Skenario 1: Server Sehat Lengkap (All green)
  await test("Status 'ok' ketika database terhubung dan konfigurasi lengkap", async () => {
    const result = await checkSystemHealth({
      dbPing: async () => {
        // simulasi query latency 15ms
        await new Promise((res) => setTimeout(res, 15));
      },
      env: {
        DATABASE_URL: "postgresql://user:pass@ep-pooler.neon.tech/neondb",
        DIRECT_URL: "postgresql://user:pass@ep.neon.tech/neondb",
        AUTH_SECRET: "super-secret-random-key-32-bytes",
        AUTH_GITHUB_ID: "github-client-id",
        AUTH_GITHUB_SECRET: "github-client-secret",
        TMDB_API_READ_ACCESS_TOKEN: "tmdb-read-token",
        MIDTRANS_SERVER_KEY: "SB-Mid-server-key",
        NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "SB-Mid-client-key",
        NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION: "false",
        NODE_ENV: "production",
      },
    });

    assert.equal(result.status, "ok");
    assert.equal(result.checks.database.status, "ok");
    assert.ok(typeof result.checks.database.latencyMs === "number");
    assert.ok(result.checks.database.latencyMs! >= 10);
    assert.equal(result.checks.environment.status, "ok");
    assert.equal(result.checks.environment.databaseConfigured, true);
    assert.equal(result.checks.environment.authConfigured, true);
    assert.equal(result.checks.environment.tmdbConfigured, true);
    assert.equal(result.checks.environment.midtransConfigured, true);
    assert.equal(result.checks.environment.midtransMode, "sandbox");
    assert.equal(result.version, "0.1.0");
    assert.ok(result.nodeVersion.startsWith("v"));
  });

  // Skenario 2: Database down -> status 'unhealthy'
  await test("Status 'unhealthy' ketika database gagal dijangkau (Connection Error)", async () => {
    const result = await checkSystemHealth({
      dbPing: async () => {
        throw new Error("Connection timeout to Neon pooler");
      },
      env: {
        DATABASE_URL: "postgresql://user:pass@ep-pooler.neon.tech/neondb",
        AUTH_SECRET: "super-secret-key",
        TMDB_API_READ_ACCESS_TOKEN: "tmdb-token",
        MIDTRANS_SERVER_KEY: "midtrans-key",
        NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "client-key",
      },
    });

    assert.equal(result.status, "unhealthy");
    assert.equal(result.checks.database.status, "error");
    assert.equal(result.checks.database.error, "Connection timeout to Neon pooler");
    assert.equal(result.checks.database.latencyMs, null);
  });

  // Skenario 3: Missing critical env (AUTH_SECRET / DATABASE_URL) -> status 'unhealthy'
  await test("Status 'unhealthy' ketika DATABASE_URL atau AUTH_SECRET tidak ada", async () => {
    const result = await checkSystemHealth({
      dbPing: async () => {},
      env: {
        DATABASE_URL: "",
        AUTH_SECRET: "",
      },
    });

    assert.equal(result.status, "unhealthy");
    assert.equal(result.checks.environment.databaseConfigured, false);
    assert.equal(result.checks.environment.authConfigured, false);
  });

  // Skenario 4: Missing secondary env (TMDB atau Midtrans) -> status 'degraded'
  await test("Status 'degraded' ketika database hidup namun API eksternal belum dikonfigurasi", async () => {
    const result = await checkSystemHealth({
      dbPing: async () => {},
      env: {
        DATABASE_URL: "postgresql://user:pass@ep-pooler.neon.tech/neondb",
        AUTH_SECRET: "secret-key",
        TMDB_API_READ_ACCESS_TOKEN: "",
        MIDTRANS_SERVER_KEY: "",
      },
    });

    assert.equal(result.status, "degraded");
    assert.equal(result.checks.database.status, "ok");
    assert.equal(result.checks.environment.status, "degraded");
    assert.equal(result.checks.environment.tmdbConfigured, false);
    assert.equal(result.checks.environment.midtransConfigured, false);
  });

  // Skenario 5: Secret Redaction (Pencegahan kebocoran kredensial)
  await test("Pencegahan kebocoran kredensial rahasia pada payload respons JSON", async () => {
    const secretPassword = "SECRET_PASSWORD_P4$$W0RD";
    const secretToken = "SECRET_TOKEN_XYZ123ABC999";
    const secretMidtrans = "SB-Mid-server-SUPER_SECRET_KEY";

    const result = await checkSystemHealth({
      dbPing: async () => {},
      env: {
        DATABASE_URL: `postgresql://user:${secretPassword}@ep-pooler.neon.tech/neondb`,
        AUTH_SECRET: secretToken,
        MIDTRANS_SERVER_KEY: secretMidtrans,
      },
    });

    const serialized = JSON.stringify(result);

    assert.ok(!serialized.includes(secretPassword), "Password database bocor!");
    assert.ok(!serialized.includes(secretToken), "Auth secret bocor!");
    assert.ok(!serialized.includes(secretMidtrans), "Midtrans key bocor!");
  });

  // Skenario 6: Format Timestamp ISO 8601 dan Uptime
  await test("Format timestamp sesuai ISO 8601 dan uptime non-negatif", async () => {
    const result = await checkSystemHealth({
      dbPing: async () => {},
      env: {
        DATABASE_URL: "postgresql://...",
        AUTH_SECRET: "secret",
      },
    });

    assert.ok(!isNaN(Date.parse(result.timestamp)), "Bukan ISO date valid");
    assert.ok(typeof result.uptimeSeconds === "number" && result.uptimeSeconds >= 0);
  });

  console.log("\n=================================================");
  console.log(`📊 Hasil Pengujian: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runHealthCheckTests();
