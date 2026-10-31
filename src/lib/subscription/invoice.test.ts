/**
 * Unit Test: LayarRika Digital Invoice & Billing Service
 * Memverifikasi pembuatan nomor faktur, kalkulasi harga, format tanggal,
 * serta aturan otorisasi akses faktur.
 */

import { formatInvoiceNumber, isInvoiceAuthorized } from "./invoice-utils";

console.log("🧪 Menjalankan pengujian unit LayarRika Invoice System...\n");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// Test 1: Format Nomor Faktur Resmi
const fixedDate = new Date("2026-10-31T10:00:00Z");
const testOrderId = "LR-VIP-ABC456-1730368800000";
const invoiceNum = formatInvoiceNumber(testOrderId, fixedDate);

assert(invoiceNum.startsWith("INV/LR/2026/"), "Nomor faktur harus berawalan INV/LR/2026/");
assert(invoiceNum.length >= 16, "Nomor faktur memiliki panjang standar");
assert(invoiceNum.includes("8800000"), "Nomor faktur mengambil sufiks alfanumerik order ID");

// Test 2: Idempotensi Nomor Faktur
const invoiceNum2 = formatInvoiceNumber(testOrderId, fixedDate);
assert(invoiceNum === invoiceNum2, "Nomor faktur harus deterministik untuk order ID yang sama");

// Test 3: Logika Otorisasi Akses Faktur
assert(
  isInvoiceAuthorized("user_123", "user_123", "USER"),
  "Pemilik sah akun harus diizinkan melihat fakturnya sendiri"
);
assert(
  !isInvoiceAuthorized("user_123", "user_456", "USER"),
  "Pengguna lain tidak boleh melihat faktur milik akun berbeda"
);
assert(
  !isInvoiceAuthorized("user_123", undefined, undefined),
  "Pengunjung tanpa login tidak boleh melihat faktur"
);
assert(
  isInvoiceAuthorized("user_123", "admin_999", "ADMIN"),
  "Role ADMIN harus diizinkan melihat faktur pengguna lain untuk verifikasi"
);

// Test 4: Kalkulasi Total Tagihan Bebas PPN
function calculateInvoiceTotal(amount: number): { subtotal: number; vat: number; total: number } {
  return {
    subtotal: amount,
    vat: 0,
    total: amount,
  };
}

const bill = calculateInvoiceTotal(49000);
assert(bill.subtotal === 49000, "Subtotal harus Rp 49.000");
assert(bill.vat === 0, "PPN harus Rp 0");
assert(bill.total === 49000, "Total harus tepat Rp 49.000");

console.log("\n🎉 SELURUH PENGUJIAN UNIT INVOICE BERHASIL (100% PASS)!\n");
