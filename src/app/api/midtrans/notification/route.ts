import { NextRequest, NextResponse } from "next/server";
import {
  verifyMidtransNotificationSignature,
  fulfillVipSubscription,
  isMidtransConfigured,
  IS_PRODUCTION,
  MidtransNotificationPayload,
} from "@/services/midtrans.service";

/**
 * Webhook HTTP POST Endpoint: Menerima notifikasi status transaksi resmi dari Midtrans.
 * Endpoint ini dipanggil secara asinkron dari server-ke-server oleh Midtrans saat status transaksi berubah.
 * URL Callback Produksi/Sandbox: https://<domain-anda>.vercel.app/api/midtrans/notification
 */
export async function POST(req: NextRequest) {
  try {
    const payload: MidtransNotificationPayload & { custom_field1?: string } = await req.json();

    // 1. Verifikasi tanda tangan digital (SHA512 Signature Key) dari Midtrans
    const isValidSignature = verifyMidtransNotificationSignature(payload);

    if (!isValidSignature) {
      console.warn("Menerima notifikasi Midtrans dengan signature tidak sah:", payload.order_id);
      return NextResponse.json(
        { error: "Tanda tangan digital tidak valid (Unauthorized signature)." },
        { status: 403 }
      );
    }

    const { transaction_status, fraud_status, custom_field1: userId } = payload;

    // 2. Periksa apakah pembayaran telah berstatus sukses (settlement atau capture accept)
    const isPaymentSettled =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    if (isPaymentSettled && userId) {
      console.log(
        `[Midtrans Webhook] Pembayaran sukses untuk order ${payload.order_id}. Mengaktifkan paket VIP untuk user: ${userId}`
      );
      await fulfillVipSubscription(userId, payload.order_id);
    }

    return NextResponse.json({
      status: "ok",
      message: "Notifikasi webhook Midtrans berhasil diverifikasi dan diproses.",
      order_id: payload.order_id,
      transaction_status,
    });
  } catch (error) {
    console.error("[Midtrans Webhook] Gagal memproses notifikasi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses webhook Midtrans." },
      { status: 500 }
    );
  }
}

/**
 * HTTP GET Endpoint: Diagnostics & status endpoint untuk pengujian URL callback di Midtrans Dashboard.
 */
export async function GET() {
  const configured = isMidtransConfigured();

  return NextResponse.json({
    service: "LayarRika Midtrans Payment Webhook Handler",
    status: "active",
    environment: IS_PRODUCTION ? "production" : "sandbox",
    configured,
    endpoint: "/api/midtrans/notification",
    supportedMethods: ["POST", "GET"],
    setupInstructions: {
      dashboardLocation: "Midtrans Dashboard -> Settings -> Configuration -> Payment Notification URL",
      expectedPayload: "JSON formatted notification payload signed with SHA512 signature key",
    },
    timestamp: new Date().toISOString(),
  });
}
