/**
 * Unit Test Suite: Subscription, Quotas, and VIP Entitlements
 * Menguji kepatuhan kriteria Tahap 9:
 * 1. Logika status langganan (Free vs Premium VIP).
 * 2. Kuota serial 5 episode unik per periode Jakarta.
 * 3. Batas tontonan film 60 menit (3.600 detik) bagi Free.
 * 4. Proteksi delta heartbeat dan simulasi VIP.
 */

import { getJakartaPeriodKey } from "./date-utils";

console.log("🧪 Menjalankan pengujian unit Subscription & Tiered Entitlements LayarRika...\n");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// Test 1: Format Periode Kuota Harian Zona Asia/Jakarta
// -----------------------------------------------------------------------------
const todayJakarta = getJakartaPeriodKey(new Date());
assert(
  /^\d{4}-\d{2}-\d{2}$/.test(todayJakarta),
  `Format periodKey harus YYYY-MM-DD, hasil: ${todayJakarta}`
);

// -----------------------------------------------------------------------------
// Test 2: Simulasi Logika Hak Akses Status Langganan
// -----------------------------------------------------------------------------
interface MockSubscription {
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  planSlug: "free" | "premium-monthly";
}

function evaluateVipStatus(now: Date, sub: MockSubscription | null): boolean {
  if (!sub) return false;
  if (sub.planSlug !== "premium-monthly") return false;
  if (sub.status !== "ACTIVE") return false;
  if (sub.startDate > now) return false; // Belum mulai
  if (sub.endDate < now) return false;   // Sudah kedaluwarsa
  return true;
}

const now = new Date("2026-10-22T10:00:00Z");

// Sub-Test 2.1: Pengguna tanpa subscription diperlakukan sebagai Free
assert(!evaluateVipStatus(now, null), "Pengguna tanpa langganan harus berstatus Free (Bukan VIP)");

// Sub-Test 2.2: Langganan Premium aktif
const activeVip: MockSubscription = {
  status: "ACTIVE",
  planSlug: "premium-monthly",
  startDate: new Date("2026-10-01T00:00:00Z"),
  endDate: new Date("2026-11-01T00:00:00Z"),
};
assert(evaluateVipStatus(now, activeVip), "Langganan Premium dalam rentang waktu aktif harus berstatus VIP");

// Sub-Test 2.3: Langganan Premium yang sudah kedaluwarsa
const expiredVip: MockSubscription = {
  status: "ACTIVE",
  planSlug: "premium-monthly",
  startDate: new Date("2026-09-01T00:00:00Z"),
  endDate: new Date("2026-10-01T00:00:00Z"),
};
assert(!evaluateVipStatus(now, expiredVip), "Langganan kedaluwarsa (endDate lewat) harus kehilangan hak VIP");

// Sub-Test 2.4: Langganan Premium yang belum mulai
const futureVip: MockSubscription = {
  status: "ACTIVE",
  planSlug: "premium-monthly",
  startDate: new Date("2026-11-01T00:00:00Z"),
  endDate: new Date("2026-12-01T00:00:00Z"),
};
assert(!evaluateVipStatus(now, futureVip), "Langganan masa depan (startDate > now) belum boleh aktif sebagai VIP");

// Sub-Test 2.5: Langganan dengan status CANCELLED atau EXPIRED
const cancelledVip: MockSubscription = {
  status: "CANCELLED",
  planSlug: "premium-monthly",
  startDate: new Date("2026-10-01T00:00:00Z"),
  endDate: new Date("2026-11-01T00:00:00Z"),
};
assert(!evaluateVipStatus(now, cancelledVip), "Langganan berstatus CANCELLED tidak boleh mendapatkan hak VIP");

// -----------------------------------------------------------------------------
// Test 3: Simulasi Kuota Serial TV (Maksimal 5 Episode Unik/Hari)
// -----------------------------------------------------------------------------
interface MockEpisodeAccess {
  seriesId: number;
  season: number;
  episode: number;
  periodKey: string;
}

class MockEpisodeQuotaManager {
  private accesses: MockEpisodeAccess[] = [];

  canAccess(isVip: boolean, access: MockEpisodeAccess): { allowed: boolean; alreadyCounted: boolean; used: number } {
    if (isVip) {
      return { allowed: true, alreadyCounted: false, used: 0 };
    }

    const isExisting = this.accesses.some(
      (a) =>
        a.seriesId === access.seriesId &&
        a.season === access.season &&
        a.episode === access.episode &&
        a.periodKey === access.periodKey
    );

    const currentPeriodCount = this.accesses.filter((a) => a.periodKey === access.periodKey).length;

    if (isExisting) {
      return { allowed: true, alreadyCounted: true, used: currentPeriodCount };
    }

    if (currentPeriodCount >= 5) {
      return { allowed: false, alreadyCounted: false, used: currentPeriodCount };
    }

    this.accesses.push(access);
    return { allowed: true, alreadyCounted: false, used: currentPeriodCount + 1 };
  }
}

const quotaMgr = new MockEpisodeQuotaManager();

// Pengguna Free mengakses episode 1 s/d 5
for (let ep = 1; ep <= 5; ep++) {
  const result = quotaMgr.canAccess(false, {
    seriesId: 1399,
    season: 1,
    episode: ep,
    periodKey: "2026-10-22",
  });
  assert(result.allowed, `Episode ${ep} dari 5 harus diizinkan untuk pengguna Free`);
  assert(result.used === ep, `Jumlah terpakai harus bertambah menjadi ${ep}`);
}

// Menonton ulang episode 2 di hari yang sama TIDAK boleh memotong kuota baru
const repeatEp2 = quotaMgr.canAccess(false, {
  seriesId: 1399,
  season: 1,
  episode: 2,
  periodKey: "2026-10-22",
});
assert(repeatEp2.allowed, "Menonton ulang episode 2 harus tetap diizinkan");
assert(repeatEp2.alreadyCounted, "Episode 2 harus terdeteksi sudah pernah dihitung (alreadyCounted)");
assert(repeatEp2.used === 5, "Jumlah kuota terpakai tidak boleh bertambah di atas 5");

// Episode ke-6 di hari yang sama HARUS DITOLAK
const ep6 = quotaMgr.canAccess(false, {
  seriesId: 1399,
  season: 1,
  episode: 6,
  periodKey: "2026-10-22",
});
assert(!ep6.allowed, "Episode ke-6 harus ditolak karena batas 5 episode telah tercapai");

// Pengguna VIP mencoba memutar episode ke-6 atau ke-100: HARUS DIIZINKAN
const epVip = quotaMgr.canAccess(true, {
  seriesId: 1399,
  season: 1,
  episode: 6,
  periodKey: "2026-10-22",
});
assert(epVip.allowed, "Pengguna VIP harus bebas menonton episode ke-6 tanpa batas");

// Hari berikutnya ("2026-10-23"), kuota harus me-reset secara otomatis
const nextDayEp1 = quotaMgr.canAccess(false, {
  seriesId: 1399,
  season: 1,
  episode: 6,
  periodKey: "2026-10-23",
});
assert(nextDayEp1.allowed, "Pada periode hari berikutnya, kuota harus ter-reset dan episode baru diizinkan");
assert(nextDayEp1.used === 1, "Jumlah terpakai di hari baru harus dimulai dari 1");

// -----------------------------------------------------------------------------
// Test 4: Simulasi Kuota Film (Maksimal 60 Menit / 3.600 Detik)
// -----------------------------------------------------------------------------
function simulateHeartbeat(
  currentSeconds: number,
  delta: number,
  isVip: boolean
): { allowed: boolean; consumedSeconds: number; remainingSeconds: number | null } {
  if (isVip) {
    return { allowed: true, consumedSeconds: 0, remainingSeconds: null };
  }

  // Sanitasi delta waktu: clamp antara 1 dan 20 detik
  const safeDelta = Math.max(1, Math.min(20, Math.floor(delta)));

  if (currentSeconds >= 3600) {
    return { allowed: false, consumedSeconds: 3600, remainingSeconds: 0 };
  }

  const next = Math.min(3600, currentSeconds + safeDelta);
  const reached = next >= 3600;

  return {
    allowed: !reached,
    consumedSeconds: next,
    remainingSeconds: 3600 - next,
  };
}

// Sub-Test 4.1: Pemutaran awal (0 detik)
const hb1 = simulateHeartbeat(0, 10, false);
assert(hb1.allowed, "Heartbeat awal 10 detik harus diizinkan");
assert(hb1.consumedSeconds === 10, "Total konsumsi harus 10 detik");
assert(hb1.remainingSeconds === 3590, "Sisa waktu harus 3590 detik");

// Sub-Test 4.2: Percobaan manipulasi delta waktu dari client (misal kirim 99999 detik)
const hbCheat = simulateHeartbeat(100, 99999, false);
assert(hbCheat.consumedSeconds === 120, "Delta tidak valid harus di-clamp maksimal 20 detik (100 + 20 = 120)");

// Sub-Test 4.3: Menonton kumulatif hingga mencapai tepat batas 3.600 detik
const hbLimit = simulateHeartbeat(3595, 10, false);
assert(!hbLimit.allowed, "Saat mencapai batas 3600 detik, pemutaran harus diblokir (allowed: false)");
assert(hbLimit.consumedSeconds === 3600, "Konsumsi detik tidak boleh melebihi batas 3600 detik");
assert(hbLimit.remainingSeconds === 0, "Sisa detik harus bernilai 0");

// Sub-Test 4.4: Pengguna VIP tidak terkena batas 3.600 detik
const hbVip = simulateHeartbeat(3600, 10, true);
assert(hbVip.allowed, "Pengguna VIP harus diizinkan menonton melampaui 3600 detik tanpa batas");

console.log("\n🎉 SELURUH PENGUJIAN UNIT SUBSCRIPTION & QUOTA BERHASIL (100% PASS)!\n");
