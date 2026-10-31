/**
 * LayarRika Invoice Utility Functions
 * Logika penomoran faktur dan kalkulasi total tagihan digital.
 */

export interface InvoiceData {
  orderId: string;
  invoiceNumber: string;
  transactionDate: Date;
  status: string;
  amount: number;
  planName: string;
  planSlug: string;
  durationDays: number;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  userId: string;
}

/**
 * Menghasilkan nomor faktur standar resmi LayarRika.
 * Format: INV/LR/YYYY/XXXXXX
 */
export function formatInvoiceNumber(orderId: string, createdAt: Date = new Date()): string {
  const year = createdAt.getFullYear();
  const cleanId = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `INV/LR/${year}/${cleanId}`;
}

/**
 * Memeriksa apakah pengguna berhak mengakses dokumen faktur.
 */
export function isInvoiceAuthorized(
  invoiceUserId: string,
  requestUserId?: string,
  requestRole?: string
): boolean {
  if (!requestUserId) return false;
  if (requestRole === "ADMIN") return true;
  return invoiceUserId === requestUserId;
}

