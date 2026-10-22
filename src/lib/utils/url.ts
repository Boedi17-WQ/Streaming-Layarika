/**
 * Menormalkan URL aplikasi agar selalu memiliki skema protokol valid (https://)
 * Mencegah error 'TypeError: Invalid URL (ERR_INVALID_URL)' saat variabel lingkungan
 * diisi tanpa awalan http:// atau https:// (misal: 'boedi.my.id').
 */
export function getAppBaseUrl(overrideUrl?: string): string {
  const raw =
    overrideUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://streaming-layarika.vercel.app";

  const trimmed = raw.trim();
  if (!trimmed) {
    return "https://streaming-layarika.vercel.app";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }

  return `https://${trimmed}`.replace(/\/+$/, "");
}
