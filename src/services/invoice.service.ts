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
  const tx = await db.paymentTransaction.findUnique({
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

  // 2. Fallback: Jika pengguna saat ini terautentikasi dan memiliki orderId format valid
  if (currentUserId && (orderId.startsWith("LR-VIP-") || orderId.startsWith("LR-SIM-"))) {
    const user = await db.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, email: true },
    });

    const premiumPlan = await db.subscriptionPlan.findUnique({
      where: { slug: "premium-monthly" },
    });

    if (user && premiumPlan) {
      const now = new Date();
      return {
        invoice: {
          orderId,
          invoiceNumber: formatInvoiceNumber(orderId, now),
          transactionDate: now,
          status: "settlement",
          amount: premiumPlan.price,
          planName: premiumPlan.name,
          planSlug: premiumPlan.slug,
          durationDays: premiumPlan.durationDays || 30,
          paymentMethod: "Midtrans Sandbox Gateway",
          customerName: user.name || "Penikmat Sinema",
          customerEmail: user.email || "user@layarrika.com",
          userId: user.id,
        },
      };
    }
  }

  return { invoice: null, notFound: true };
}

/**
 * Mengambil seluruh daftar faktur / riwayat transaksi milik pengguna tertentu.
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

  const premiumPlan = await db.subscriptionPlan.findUnique({
    where: { slug: "premium-monthly" },
  });

  return transactions.map((tx) => ({
    orderId: tx.orderId,
    invoiceNumber: formatInvoiceNumber(tx.orderId, tx.createdAt),
    transactionDate: tx.createdAt,
    status: tx.status,
    amount: tx.amount,
    planName: premiumPlan?.name || "LayarRika Premium VIP",
    planSlug: tx.planSlug,
    durationDays: premiumPlan?.durationDays || 30,
    paymentMethod: tx.paymentType
      ? tx.paymentType.replace(/_/g, " ").toUpperCase()
      : "Midtrans Gateway",
    customerName: tx.user.name || "Penikmat Sinema",
    customerEmail: tx.user.email || "user@layarrika.com",
    userId: tx.userId,
  }));
}
