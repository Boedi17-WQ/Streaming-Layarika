/**
 * Utilitas tanggal dan zona waktu untuk kuota langganan LayarRika.
 * Menggunakan zona waktu resmi Indonesia (Asia/Jakarta / WIB).
 */

export function getJakartaPeriodKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
