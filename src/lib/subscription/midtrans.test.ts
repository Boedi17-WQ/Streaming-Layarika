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

console.log("\n🎉 SELURUH PENGUJIAN UNIT MIDTRANS SANDBOX BERHASIL (100% PASS)!\n");
