import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FilmReel, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-16">
      <Container className="text-center space-y-6 max-w-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#171717] border border-[#D9A52E]/30 text-[#D9A52E]">
          <FilmReel size={36} weight="duotone" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D9A52E]">
            Error 404
          </span>
          <h1 className="text-3xl font-extrabold text-[#F5F5F5]">
            Adegan Tidak Ditemukan
          </h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            Halaman atau judul yang Anda cari mungkin telah dipindahkan, belum dirilis, atau alamat URL yang dimasukkan kurang tepat.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D9A52E] bg-[#D9A52E] px-5 py-2.5 text-xs font-semibold text-[#0A0A0A] shadow-md transition hover:bg-[#c49226]"
          >
            <House size={16} weight="bold" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
