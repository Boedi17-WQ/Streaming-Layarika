import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HelpCenterContent } from "@/components/help/HelpCenterContent";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Pusat Bantuan & Panduan Lengkap — LayarRika",
  description:
    "Panduan komprehensif penggunaan platform LayarRika: fitur pemutar streaming, pemilihan server, navigasi serial TV, keanggotaan VIP, invoice bukti pembayaran digital, dan FAQ.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F5] pb-24 pt-6 sm:pt-8">
      <Container className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-[#71717A] border-b border-white/5 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#8E8E93] hover:text-[#D9A52E] transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2 text-[11px]">
            <span>Beranda</span>
            <span>/</span>
            <span className="text-[#D9A52E] font-semibold">Pusat Bantuan</span>
          </div>
        </div>

        {/* Konten Utama Pusat Bantuan Interaktif */}
        <HelpCenterContent />
      </Container>
    </div>
  );
}

