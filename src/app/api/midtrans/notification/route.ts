import { NextRequest, NextResponse } from "next/server";
import {
  verifyMidtransNotificationSignature,
  fulfillVipSubscription,
  MidtransNotificationPayload,
} from "@/services/midtrans.service";

/**
 * Webhook HTTP POST Endpoint: Menerima notifikasi status transaksi dari Midtrans.
 * Endpoint ini dipanggil secara asinkron oleh server Midtrans saat transaksi berubah status.
 * URL Callback Sandbox: https://domain-anda.com/api/midtrans/notification
 */
export async function POST(req: NextRequest) {
  try {
    const payload: MidtransNotificationPayload & { custom_field1?: string } = await req.json();

    // 1. Verifikasi tanda tangan digital (Signature Key) dari Midtrans
    const isValidSignature = verifyMidtransNotificationSignature(payload);

    if (!isValidSignature) {
      console.warn("Menerima notifikasi Midtrans dengan signature tidak sah:", payload.order_id);
      return NextResponse.json(
        { error: "Tanda tangan digital tidak valid." },
        { status: 403 }
      );
    }

    const { transaction_status, fraud_status, custom_field1: userId } = payload;

    // 2. Periksa apakah pembayaran telah berstatus sukses (settlement atau capture accept)
    const isPaymentSettled =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    if (isPaymentSettled && userId) {
      console.log(`Pembayaran Midtrans berhasil untuk order ${payload.order_id}, mengaktifkan VIP untuk user ${userId}`);
      await fulfillVipSubscription(userId);
    }

    return NextResponse.json({ status: "ok", message: "Notifikasi berhasil diproses." });
  } catch (error) {
    console.error("Gagal memproses notifikasi webhook Midtrans:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses webhook." },
      { status: 500 }
    );
  }
}
