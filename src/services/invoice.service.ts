import "server-only";

import { db } from "@/lib/db";
import {
  InvoiceData,
  formatInvoiceNumber,
  isInvoiceAuthorized,
} from "@/lib/subscription/invoice-utils";

export type { InvoiceData };
export { formatInvoiceNumber, isInvoiceAuthorized };

/**
 * Mengambil detail invoice resmi berdasarkan orderId.
 * Memverifikasi kepemilikan akun agar pengguna hanya dapat mengakses invoice miliknya
 * (kecuali pengguna berwewenang ADMIN).
 */
export async function getInvoiceByOrderId(
  orderId: string,
  currentUserId?: string,
  userRole?: string
): Promise<{ invoice: InvoiceData | null; unauthorized?: boolean; notFound?: boolean }> {
  if (!orderId) {
    return { invoice: null, notFound: true };
  }

  // 1. Cari data transaksi di tabel payment_transactions
  let tx = await db.paymentTransaction.findUnique({
    where: { orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Jika tidak ditemukan langsung dengan orderId, periksa apakah pengguna mencari transaksinya
  if (!tx && currentUserId) {
    const userTx = await db.paymentTransaction.findFirst({
      where: { userId: currentUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (userTx && (orderId === "latest" || orderId.includes(currentUserId.slice(-6).toUpperCase()))) {
      tx = userTx;
    }
  }

  if (tx) {
    // Verifikasi otorisasi pemilik atau admin
    if (currentUserId && tx.userId !== currentUserId && userRole !== "ADMIN") {
      return { invoice: null, unauthorized: true };
    }

    const plan = await db.subscriptionPlan.findUnique({
      where: { slug: tx.planSlug },
    });

    const paymentMethodLabel = tx.paymentType
      ? tx.paymentType.replace(/_/g, " ").toUpperCase()
      : "Midtrans Payment Gateway";

    return {
      invoice: {
        orderId: tx.orderId,
        invoiceNumber: formatInvoiceNumber(tx.orderId, tx.createdAt),
        transactionDate: tx.createdAt,
        status: tx.status,
        amount: tx.amount,
        planName: plan?.name || "LayarRika Premium VIP",
        planSlug: tx.planSlug,
        durationDays: plan?.durationDays || 30,
        paymentMethod: paymentMethodLabel,
        customerName: tx.user.name || "Penikmat Sinema",
        customerEmail: tx.user.email || "user@layarrika.com",
        userId: tx.userId,
      },
    };
  }

  // 2. Fallback: Jika pengguna saat ini terautentikasi dan memiliki langganan aktif
  if (currentUserId) {
    const activeSub = await db.userSubscription.findFirst({
      where: {
        userId: currentUserId,
        status: "ACTIVE",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeSub && activeSub.user) {
      const generatedOrderId = orderId.startsWith("LR-")
        ? orderId
        : `LR-VIP-${currentUserId.slice(-6).toUpperCase()}-${new Date(activeSub.startDate).getTime()}`;

      return {
        invoice: {
          orderId: generatedOrderId,
          invoiceNumber: formatInvoiceNumber(generatedOrderId, activeSub.startDate || new Date()),
          transactionDate: activeSub.startDate || new Date(),
          status: "settlement",
          amount: activeSub.plan?.price || 49000,
          planName: activeSub.plan?.name || "LayarRika Premium VIP",
          planSlug: activeSub.plan?.slug || "premium-monthly",
          durationDays: activeSub.plan?.durationDays || 30,
          paymentMethod: "AKTIVASI VIP LAYARRIKA",
          customerName: activeSub.user.name || "Penikmat Sinema",
          customerEmail: activeSub.user.email || "user@layarrika.com",
          userId: activeSub.userId,
        },
      };
    }
  }

  return { invoice: null, notFound: true };
}

/**
 * Mengambil seluruh daftar faktur / riwayat transaksi milik pengguna tertentu.
 * Jika belum ada data transaksi tetapi pengguna memiliki langganan aktif,
 * menyajikan ringkasan faktur berbasis langganan aktif tanpa side-effect write.
 */
export async function getUserInvoices(userId: string): Promise<InvoiceData[]> {
  if (!userId) return [];

  const transactions = await db.paymentTransaction.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const plans = await db.subscriptionPlan.findMany();
  const planMap = new Map(plans.map((p) => [p.slug, p]));

  // Jika belum ada data transaksi tetapi pengguna memiliki langganan aktif
  if (transactions.length === 0) {
    const activeSub = await db.userSubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeSub && activeSub.user) {
      const generatedOrderId = `LR-VIP-${userId.slice(-6).toUpperCase()}-${new Date(activeSub.startDate).getTime()}`;
      return [
        {
          orderId: generatedOrderId,
          invoiceNumber: formatInvoiceNumber(generatedOrderId, activeSub.startDate || new Date()),
          transactionDate: activeSub.startDate || new Date(),
          status: "settlement",
          amount: activeSub.plan?.price || 49000,
          planName: activeSub.plan?.name || "LayarRika Premium VIP",
          planSlug: activeSub.plan?.slug || "premium-monthly",
          durationDays: activeSub.plan?.durationDays || 30,
          paymentMethod: "AKTIVASI VIP LAYARRIKA",
          customerName: activeSub.user.name || "Penikmat Sinema",
          customerEmail: activeSub.user.email || "user@layarrika.com",
          userId: activeSub.userId,
        },
      ];
    }
  }

  return transactions.map((tx) => {
    const plan = planMap.get(tx.planSlug);
    return {
      orderId: tx.orderId,
      invoiceNumber: formatInvoiceNumber(tx.orderId, tx.createdAt),
      transactionDate: tx.createdAt,
      status: tx.status,
      amount: tx.amount,
      planName: plan?.name || "LayarRika Premium VIP",
      planSlug: tx.planSlug,
      durationDays: plan?.durationDays || 30,
      paymentMethod: tx.paymentType
        ? tx.paymentType.replace(/_/g, " ").toUpperCase()
        : "MIDTRANS GATEWAY",
      customerName: tx.user.name || "Penikmat Sinema",
      customerEmail: tx.user.email || "user@layarrika.com",
      userId: tx.userId,
    };
  });
}
