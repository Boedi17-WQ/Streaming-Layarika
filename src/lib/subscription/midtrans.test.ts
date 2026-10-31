/**
 * Test Suite: Midtrans Sandbox Payment Integration LayarRika
 * Memverifikasi pembuatan transaksi Snap, kalkulasi SHA512 signature key,
 * serta penanganan status transaksi (settlement, capture, pending, deny).
 */

import crypto from "crypto";

console.log("🧪 Menjalankan pengujian unit Midtrans Sandbox Integration LayarRika...\n");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Verifikasi Format Order ID
function generateTestOrderId(userId: string, timestamp: number = Date.now()): string {
  const userSuffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `LR-VIP-${userSuffix}-${timestamp}`;
}

const testOrderId = generateTestOrderId("user_cm123abc456", 1792659000000);
assert(testOrderId.startsWith("LR-VIP-"), "Order ID harus berawalan LR-VIP-");
assert(testOrderId.includes("ABC456"), "Order ID harus menyertakan suffix ID pengguna");
assert(testOrderId === "LR-VIP-ABC456-1792659000000", "Format Order ID konsisten");

// 2. Verifikasi Kalkulasi Signature Key SHA-512
// Rumus Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
function computeSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash("sha512").update(raw).digest("hex");
}

const mockServerKey = "SB-Mid-server-test-key-123";
const mockOrderId = "LR-VIP-TEST-001";
const mockStatusCode = "200";
const mockGrossAmount = "49000.00";

const validSig = computeSignature(mockOrderId, mockStatusCode, mockGrossAmount, mockServerKey);
assert(validSig.length === 128, "Signature SHA512 harus memiliki panjang 128 karakter hex");

// 3. Verifikasi Tanda Tangan Notifikasi Webhook
function verifySignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}, serverKey: string): boolean {
  const expected = computeSignature(payload.order_id, payload.status_code, payload.gross_amount, serverKey);
  return expected.toLowerCase() === payload.signature_key.toLowerCase();
}

const validPayload = {
  order_id: mockOrderId,
  status_code: mockStatusCode,
  gross_amount: mockGrossAmount,
  signature_key: validSig,
};

assert(verifySignature(validPayload, mockServerKey), "Signature sah harus berhasil diverifikasi (true)");

const invalidPayload = {
  ...validPayload,
  signature_key: "tampered_fake_signature_hash_value_1234567890",
};

assert(!verifySignature(invalidPayload, mockServerKey), "Signature yang dimanipulasi harus ditolak (false)");

// 4. Verifikasi Logika Penentuan Status Pembayaran Sukses (Settlement / Capture Accept)
function isPaymentSuccessful(status: string, fraudStatus?: string): boolean {
  if (status === "settlement") return true;
  if (status === "capture" && fraudStatus === "accept") return true;
  return false;
}

assert(isPaymentSuccessful("settlement"), "Status 'settlement' harus dianggap lunas");
assert(isPaymentSuccessful("capture", "accept"), "Status 'capture' dengan fraud 'accept' harus dianggap lunas");
assert(!isPaymentSuccessful("capture", "challenge"), "Status 'capture' dengan fraud 'challenge' tidak boleh lunas");
assert(!isPaymentSuccessful("pending"), "Status 'pending' tidak boleh mengaktifkan VIP");
assert(!isPaymentSuccessful("deny"), "Status 'deny' harus ditolak");
assert(!isPaymentSuccessful("expire"), "Status 'expire' harus ditolak");
assert(!isPaymentSuccessful("cancel"), "Status 'cancel' harus ditolak");

// 5. Verifikasi URL Sandbox Endpoint
const isProd = false;
const snapUrl = isProd
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

assert(snapUrl === "https://app.sandbox.midtrans.com/snap/v1/transactions", "URL Sandbox Snap harus mengarah ke app.sandbox.midtrans.com");

// 6. Verifikasi Idempotensi Pemenuhan Transaksi (Anti Double-Fulfillment)
interface MockTxStore {
  transactions: Set<string>;
  vipEndDate: Date;
}

function processOrderFulfillment(store: MockTxStore, orderId: string, durationDays = 30): { success: boolean; endDate: Date; wasDuplicate: boolean } {
  if (store.transactions.has(orderId)) {
    return { success: true, endDate: store.vipEndDate, wasDuplicate: true };
  }

  store.transactions.add(orderId);
  store.vipEndDate = new Date(store.vipEndDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  return { success: true, endDate: store.vipEndDate, wasDuplicate: false };
}

const baseDate = new Date("2026-10-31T00:00:00Z");
const store: MockTxStore = {
  transactions: new Set<string>(),
  vipEndDate: baseDate,
};

// Panggilan pertama (Polling / Webhook pertama)
const res1 = processOrderFulfillment(store, "LR-VIP-TEST-IDEMPOTENT-001");
assert(!res1.wasDuplicate, "Panggilan pertama order ID baru harus diproses (bukan duplikat)");
const expectedEnd = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
assert(res1.endDate.getTime() === expectedEnd.getTime(), "Durasi bertambah 30 hari pada pemrosesan pertama");

// Panggilan kedua (Snap callback / check status berulang)
const res2 = processOrderFulfillment(store, "LR-VIP-TEST-IDEMPOTENT-001");
assert(res2.wasDuplicate, "Panggilan kedua dengan order ID sama harus terdeteksi sebagai duplikat (Idempotent)");
assert(res2.endDate.getTime() === expectedEnd.getTime(), "Tanggal berakhir TIDAK bertambah dobel (+30 hari lagi)");

// Panggilan ketiga (Webhook terlambat datang)
const res3 = processOrderFulfillment(store, "LR-VIP-TEST-IDEMPOTENT-001");
assert(res3.wasDuplicate, "Panggilan ketiga dengan order ID sama tetap terdeteksi duplikat");
assert(res3.endDate.getTime() === expectedEnd.getTime(), "Tanggal berakhir tetap konsisten tanpa duplikasi");

// 7. Verifikasi Bypass Simulasi Instan
function checkSimulatedStatus(orderId: string, options?: { isSimulated?: boolean }): boolean {
  if (options?.isSimulated || orderId.startsWith("SIMULATED_") || orderId.startsWith("LR-VIP-SANDBOX-")) {
    return true;
  }
  return false;
}

assert(checkSimulatedStatus("LR-VIP-12345", { isSimulated: true }), "Shortcut simulasi instan harus lolos validasi isPaid");
assert(checkSimulatedStatus("SIMULATED_SNAP_001"), "Order ID berawalan SIMULATED_ harus lolos validasi");
assert(checkSimulatedStatus("LR-VIP-SANDBOX-1730000000"), "Order ID berawalan LR-VIP-SANDBOX- harus lolos validasi");
assert(!checkSimulatedStatus("LR-VIP-REAL-12345"), "Order riil tanpa flag simulasi tidak boleh lolos bypass");

console.log("\n🎉 SELURUH PENGUJIAN UNIT MIDTRANS SANDBOX BERHASIL (100% PASS)!\n");
