"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createSnapTransaction,
  createBankVaChargeTransaction,
  getMidtransTransactionStatus,
  fulfillVipSubscription,
  SnapTransactionResult,
} from "@/services/midtrans.service";
import { SIMULATED_BILLING_ENABLED } from "@/services/subscription.service";

/**
 * Server Action: Membuat transaksi Midtrans Snap token untuk pembayaran paket langganan.
 */
export async function createMidtransSnapTokenAction(planSlug: string = "premium-monthly"): Promise<{
  success: boolean;
  unauthenticated?: boolean;
  token?: string;
  redirectUrl?: string;
  orderId?: string;
  isSimulated?: boolean;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      unauthenticated: true,
      error: "Anda harus masuk ke akun LayarRika Anda untuk melakukan pembayaran.",
    };
  }

  const result: SnapTransactionResult = await createSnapTransaction({
    userId: session.user.id,
    userName: session.user.name || null,
    userEmail: session.user.email || null,
    planSlug,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Gagal membuat sesi pembayaran Midtrans.",
    };
  }

  return {
    success: true,
    token: result.token,
    redirectUrl: result.redirectUrl,
    orderId: result.orderId,
    isSimulated: result.isSimulated,
  };
}

/**
 * Server Action: Mengonfirmasi keberhasilan transaksi pembayaran Midtrans dan mengaktifkan VIP.
 * Mendukung opsi simulasi instan dan penegakan idempotensi via orderId.
 */
export async function confirmMidtransPaymentAction(
  orderId: string,
  options?: { isSimulated?: boolean }
): Promise<{
  success: boolean;
  message?: string;
  planName?: string;
  endDate?: Date;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sesi tidak valid. Silakan masuk kembali.",
    };
  }

  if (!orderId) {
    return {
      success: false,
      error: "ID Pesanan tidak valid.",
    };
  }

  let isPaid = false;
  let currentStatus = "Belum dibayar";

  const isSimulatedBypass =
    SIMULATED_BILLING_ENABLED &&
    (options?.isSimulated ||
      orderId.startsWith("SIMULATED_") ||
      orderId.startsWith("LR-VIP-SANDBOX-"));

  if (isSimulatedBypass) {
    isPaid = true;
    currentStatus = "settlement";
  } else {
    // Periksa status transaksi ke Midtrans Core API
    const statusResult = await getMidtransTransactionStatus(orderId);
    currentStatus = statusResult?.status || "Belum dibayar";
    isPaid =
      Boolean(statusResult) &&
      (statusResult!.status === "settlement" ||
        (statusResult!.status === "capture" && statusResult!.fraudStatus === "accept"));
  }

  if (!isPaid) {
    return {
      success: false,
      error: `Status transaksi belum lunas (Status saat ini: ${currentStatus}).`,
    };
  }

  try {
    const fulfilled = await fulfillVipSubscription(session.user.id, orderId);

    revalidatePath("/pricing");
    revalidatePath("/profile");
    revalidatePath("/");

    return {
      success: true,
      message: `Pembayaran Berhasil! Paket ${fulfilled.planName} kini aktif pada akun Anda.`,
      planName: fulfilled.planName,
      endDate: fulfilled.endDate,
    };
  } catch (error) {
    console.error("Gagal memenuhi status langganan VIP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengaktifkan paket langganan VIP.",
    };
  }
}

/**
 * Server Action: Membuat Virtual Account resmi Midtrans Sandbox (BCA, BNI, BRI)
 * untuk disimulasikan langsung melalui website Midtrans Simulator.
 */
export async function createMidtransBankVaAction(
  bank: "bca" | "bni" | "bri" | "permata" = "bca",
  planSlug: string = "premium-monthly"
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      orderId: "",
      grossAmount: 0,
      paymentType: "bank_transfer",
      bank,
      simulatorUrl: `https://simulator.sandbox.midtrans.com/${bank}/va/index`,
      error: "Anda harus masuk ke akun LayarRika Anda untuk melakukan pembayaran.",
    };
  }

  const result = await createBankVaChargeTransaction({
    userId: session.user.id,
    userName: session.user.name || null,
    userEmail: session.user.email || null,
    planSlug,
    bank,
  });

  return result;
}

/**
 * Server Action: Memeriksa status transaksi terkini dari Midtrans Core API secara periodik (polling).
 * Jika status sudah settlement, otomatis penuhi hak akses VIP pengguna.
 */
export async function checkMidtransStatusAction(orderId: string): Promise<{
  success: boolean;
  isPaid: boolean;
  status: string;
  message?: string;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      isPaid: false,
      status: "unauthenticated",
      error: "Sesi tidak valid.",
    };
  }

  const statusResult = await getMidtransTransactionStatus(orderId);

  if (!statusResult) {
    return {
      success: false,
      isPaid: false,
      status: "not_found",
      error: "Data transaksi belum ditemukan di Midtrans.",
    };
  }

  const isPaid =
    statusResult.status === "settlement" ||
    (statusResult.status === "capture" && statusResult.fraudStatus === "accept");

  if (isPaid) {
    try {
      const fulfilled = await fulfillVipSubscription(session.user.id, orderId);
      revalidatePath("/pricing");
      revalidatePath("/profile");
      revalidatePath("/");

      return {
        success: true,
        isPaid: true,
        status: statusResult.status,
        message: `Pembayaran Berhasil! Paket ${fulfilled.planName} telah aktif.`,
      };
    } catch (err) {
      console.error("Gagal memenuhi VIP saat polling:", err);
    }
  }

  return {
    success: true,
    isPaid: false,
    status: statusResult.status,
    message: `Status saat ini: ${statusResult.status}`,
  };
}
