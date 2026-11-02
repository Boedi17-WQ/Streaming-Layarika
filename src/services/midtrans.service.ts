import "server-only";

import crypto from "crypto";
import { db } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import { SIMULATED_BILLING_ENABLED } from "./subscription.service";

export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
export const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

export const SNAP_API_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const CORE_API_URL = IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

export interface CreateSnapTransactionParams {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  planSlug: string;
}

export interface SnapTransactionResult {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  orderId: string;
  isSimulated?: boolean;
  error?: string;
}

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
}

/**
 * Memeriksa apakah kredensial Midtrans Server Key telah dikonfigurasi dengan benar.
 */
export function isMidtransConfigured(): boolean {
  return (
    Boolean(MIDTRANS_SERVER_KEY) &&
    !MIDTRANS_SERVER_KEY.includes("YOUR_SERVER_KEY") &&
    !MIDTRANS_SERVER_KEY.includes("placeholder")
  );
}

/**
 * Membuat transaksi Midtrans Snap token untuk pembayaran paket langganan VIP.
 * Mendukung pemanggilan API Midtrans Sandbox riil dengan fallback simulasi cerdas
 * jika kunci belum dimasukkan ke .env.local.
 */
export async function createSnapTransaction({
  userId,
  userName,
  userEmail,
  planSlug,
}: CreateSnapTransactionParams): Promise<SnapTransactionResult> {
  // Ambil detail paket dari database
  const plan = await db.subscriptionPlan.findUnique({
    where: { slug: planSlug },
  });

  if (!plan) {
    return {
      success: false,
      orderId: "",
      error: "Paket langganan tidak ditemukan.",
    };
  }

  // Buat Order ID unik: format LR-VIP-<userIdSuffix>-<timestamp>
  const userSuffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const orderId = `LR-VIP-${userSuffix}-${Date.now()}`;
  const grossAmount = plan.price;

  // Jika Midtrans Server Key belum diatur atau masih dummy, gunakan mode simulasi
  if (!isMidtransConfigured()) {
    return {
      success: true,
      token: `SIMULATED_SNAP_${orderId}`,
      redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/simulated-${orderId}`,
      orderId,
      isSimulated: true,
    };
  }

  const authHeader = `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`;

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: [
      {
        id: plan.slug,
        price: grossAmount,
        quantity: 1,
        name: `LayarRika ${plan.name} (${plan.durationDays} Hari)`,
      },
    ],
    customer_details: {
      first_name: userName || "Pengguna",
      email: userEmail || "user@layarrika.com",
    },
    custom_field1: userId,
    custom_field2: plan.slug,
  };

  try {
    const response = await fetch(SNAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gagal membuat Midtrans Snap Transaction:", errorText);
      return {
        success: false,
        orderId,
        error: `Gagal membuat transaksi pembayaran Midtrans (${response.status}).`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      token: data.token,
      redirectUrl: data.redirect_url,
      orderId,
      isSimulated: false,
    };
  } catch (error) {
    console.error("Kesalahan jaringan saat memanggil Midtrans Snap API:", error);
    return {
      success: false,
      orderId,
      error: "Terjadi kesalahan koneksi saat menghubungi server pembayaran Midtrans.",
    };
  }
}

export interface CreateBankChargeParams {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  planSlug: string;
  bank?: "bca" | "bni" | "bri" | "permata";
}

export interface BankChargeResult {
  success: boolean;
  orderId: string;
  grossAmount: number;
  paymentType: string;
  bank: string;
  vaNumber?: string;
  simulatorUrl: string;
  expiryTime?: string;
  error?: string;
}

/**
 * Membuat transaksi Virtual Account Bank via Midtrans Core API (/v2/charge).
 * Menghasilkan nomor VA riil dari Sandbox yang dapat disimulasikan langsung
 * di Midtrans Payment Simulator (https://simulator.sandbox.midtrans.com/).
 */
export async function createBankVaChargeTransaction({
  userId,
  userName,
  userEmail,
  planSlug,
  bank = "bca",
}: CreateBankChargeParams): Promise<BankChargeResult> {
  const plan = await db.subscriptionPlan.findUnique({
    where: { slug: planSlug },
  });

  if (!plan) {
    return {
      success: false,
      orderId: "",
      grossAmount: 0,
      paymentType: "bank_transfer",
      bank,
      simulatorUrl: `https://simulator.sandbox.midtrans.com/${bank}/va/index`,
      error: "Paket langganan tidak ditemukan.",
    };
  }

  const userSuffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const orderId = `LR-VIP-${userSuffix}-${Date.now()}`;
  const grossAmount = plan.price;

  if (!isMidtransConfigured()) {
    return {
      success: true,
      orderId,
      grossAmount,
      paymentType: "bank_transfer",
      bank,
      vaNumber: `8077708${Date.now().toString().slice(-8)}`,
      simulatorUrl: `https://simulator.sandbox.midtrans.com/${bank}/va/index`,
    };
  }

  const authHeader = `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`;

  const payload = {
    payment_type: "bank_transfer",
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    bank_transfer: {
      bank,
    },
    item_details: [
      {
        id: plan.slug,
        price: grossAmount,
        quantity: 1,
        name: `LayarRika ${plan.name} (${plan.durationDays} Hari)`,
      },
    ],
    customer_details: {
      first_name: userName || "Pengguna",
      email: userEmail || "user@layarrika.com",
    },
    custom_field1: userId,
    custom_field2: plan.slug,
  };

  try {
    const response = await fetch(`${CORE_API_URL}/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gagal membuat Midtrans Bank Charge:", errorText);
      return {
        success: false,
        orderId,
        grossAmount,
        paymentType: "bank_transfer",
        bank,
        simulatorUrl: `https://simulator.sandbox.midtrans.com/${bank}/va/index`,
        error: `Gagal membuat Virtual Account Midtrans (${response.status}).`,
      };
    }

    const data = await response.json();
    const vaNumber = data.va_numbers?.[0]?.va_number || data.permata_va_number || "";

    return {
      success: true,
      orderId,
      grossAmount,
      paymentType: "bank_transfer",
      bank,
      vaNumber,
      simulatorUrl: `https://simulator.sandbox.midtrans.com/${bank}/va/index`,
      expiryTime: data.expiry_time,
    };
  } catch (error) {
    console.error("Kesalahan jaringan saat membuat Midtrans Bank VA:", error);
    return {
      success: false,
      orderId,
      grossAmount,
      paymentType: "bank_transfer",
      bank,
      simulatorUrl: `https://simulator.sandbox.midtrans.com/${bank}/va/index`,
      error: "Terjadi kesalahan koneksi saat menghubungi server pembayaran Midtrans.",
    };
  }
}

/**
 * Memvalidasi signature key dari webhook notifikasi Midtrans.
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransNotificationSignature(
  payload: MidtransNotificationPayload,
  serverKey: string = MIDTRANS_SERVER_KEY
): boolean {
  if (!serverKey) return false;

  const rawString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const computedSignature = crypto
    .createHash("sha512")
    .update(rawString)
    .digest("hex");

  return computedSignature.toLowerCase() === payload.signature_key.toLowerCase();
}

/**
 * Memverifikasi status transaksi langsung ke Midtrans Core API.
 */
export async function getMidtransTransactionStatus(orderId: string): Promise<{
  status: string;
  fraudStatus?: string;
  statusCode?: string;
  grossAmount?: string;
  paymentType?: string;
  raw?: unknown;
} | null> {
  // Mode simulasi: hanya diizinkan jika SIMULATED_BILLING_ENABLED aktif
  if (
    SIMULATED_BILLING_ENABLED &&
    (!isMidtransConfigured() ||
      orderId.startsWith("SIMULATED_") ||
      orderId.startsWith("LR-VIP-SANDBOX-"))
  ) {
    return {
      status: "settlement",
      fraudStatus: "accept",
      statusCode: "200",
    };
  }

  if (!isMidtransConfigured()) {
    console.warn("Midtrans Server Key belum dikonfigurasi dan mode simulasi non-aktif.");
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`;

  try {
    const response = await fetch(`${CORE_API_URL}/${orderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      console.warn(`Gagal memeriksa status Midtrans untuk order ${orderId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      status: data.transaction_status,
      fraudStatus: data.fraud_status,
      statusCode: data.status_code,
      grossAmount: data.gross_amount,
      paymentType: data.payment_type,
      raw: data,
    };
  } catch (error) {
    console.error(`Error saat mengambil status transaksi ${orderId}:`, error);
    return null;
  }
}

/**
 * Mengaktifkan langganan VIP setelah pembayaran Midtrans dinyatakan settlement atau capture accept.
 * Mendukung idempotensi via orderId untuk mencegah dobel perpanjangan hari jika dipanggil berkali-kali.
 */
export async function fulfillVipSubscription(
  userId: string,
  orderId?: string
): Promise<{
  success: boolean;
  planName: string;
  startDate: Date;
  endDate: Date;
}> {
  const premiumPlan = await db.subscriptionPlan.findUnique({
    where: { slug: "premium-monthly" },
  });

  if (!premiumPlan) {
    throw new Error("Paket Premium VIP tidak ditemukan di database.");
  }

  // Verifikasi keberadaan akun user
  const userExists = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    throw new Error(`Pengguna dengan ID ${userId} tidak ditemukan di database.`);
  }

  const now = new Date();

  // 1. Idempotency Check: Jika orderId diberikan dan sudah pernah dicatat, kembalikan status aktif tanpa memperpanjang dobel
  if (orderId) {
    const existingTx = await db.paymentTransaction.findUnique({
      where: { orderId },
    });

    if (existingTx) {
      console.log(
        `[Midtrans Fulfillment] Order ${orderId} sudah pernah diproses sebelumnya (Idempotent). Mengembalikan masa aktif saat ini.`
      );
      const activeSub = await db.userSubscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        orderBy: { endDate: "desc" },
      });

      return {
        success: true,
        planName: premiumPlan.name,
        startDate: activeSub?.startDate || now,
        endDate: activeSub?.endDate || now,
      };
    }
  }

  const durationMs = (premiumPlan.durationDays || 30) * 24 * 60 * 60 * 1000;

  return await db.$transaction(async (tx) => {
    // Jika orderId disediakan, rekam transaksi pembayaran untuk mencegah dobel fulfillment
    if (orderId) {
      await tx.paymentTransaction.create({
        data: {
          orderId,
          userId,
          planSlug: premiumPlan.slug,
          amount: premiumPlan.price,
          status: "settlement",
        },
      });
    }

    // Cek apakah pengguna saat ini sudah memiliki langganan aktif
    const existingActive = await tx.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: now },
      },
      orderBy: { endDate: "desc" },
    });

    // Jika sudah ada langganan aktif, perpanjang dari tanggal berakhir sebelumnya
    const startDate = existingActive ? existingActive.startDate : now;
    const baseEnd = existingActive ? existingActive.endDate : now;
    const endDate = new Date(baseEnd.getTime() + durationMs);

    if (existingActive) {
      await tx.userSubscription.update({
        where: { id: existingActive.id },
        data: {
          planId: premiumPlan.id,
          status: SubscriptionStatus.ACTIVE,
          endDate,
        },
      });
    } else {
      await tx.userSubscription.create({
        data: {
          userId,
          planId: premiumPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
        },
      });
    }

    return {
      success: true,
      planName: premiumPlan.name,
      startDate,
      endDate,
    };
  });
}
