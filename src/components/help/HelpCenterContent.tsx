"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  FilmReel,
  Play,
  Crown,
  Receipt,
  User,
  Television,
  Compass,
  Queue,
  CaretDown,
  Question,
  Sparkle,
  CheckCircle,
  EnvelopeSimple,
} from "@phosphor-icons/react";

interface FAQItem {
  id: string;
  category: "streaming" | "catalog" | "account" | "vip" | "general";
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "general",
    question: "Apa itu LayarRika?",
    answer:
      "LayarRika adalah platform katalog dan streaming sinematik modern yang menggabungkan metadata resmi TMDB (The Movie Database) dengan pemutar video berkecepatan tinggi, integrasi trailer resmi berlisensi, serta server streaming cadangan (Server 1 HD dan Server 2 MULTI). Platform ini dirancang responsif, aman, dan elegan baik di perangkat ponsel pintar maupun desktop.",
  },
  {
    id: "faq-2",
    category: "streaming",
    question: "Apakah saya bisa menonton film dan serial secara gratis?",
    answer:
      "Ya! Pengguna akun gratis (Free Tier) dapat menjelajahi seluruh katalog, memutar trailer resmi, serta menonton episode pengenalan (episode 1 sampai 5) pada serial TV tanpa biaya.",
  },
  {
    id: "faq-3",
    category: "streaming",
    question: "Apa perbedaan Server 1 (HD) dan Server 2 (MULTI)?",
    answer:
      "Server 1 (HD) adalah server primer dengan kualitas gambar definisi tinggi (HD) dan performa optimal. Server 2 (MULTI) adalah server cadangan berkecepatan tinggi dengan multi-source yang dapat Anda gunakan apabila Server 1 sedang mengalami kendala jaringan atau buffering.",
  },
  {
    id: "faq-4",
    category: "streaming",
    question: "Kenapa video buffering atau tidak berputar?",
    answer:
      "Kendala buffering biasanya dipengaruhi oleh fluktuasi koneksi internet atau ekstensi browser tertentu (seperti adblocker agresif). Solusinya: 1) Beralih ke Server 2 dengan menekan tombol Server 2 di bawah player, 2) Muat ulang (refresh) halaman, 3) Pastikan koneksi internet Anda stabil.",
  },
  {
    id: "faq-5",
    category: "vip",
    question: "Kenapa episode 6 ke atas terkunci dengan ikon gembok?",
    answer:
      "Episode 6 dan seterusnya pada serial TV merupakan konten khusus untuk pelanggan VIP Member. Untuk membukanya, Anda cukup berlangganan paket VIP melalui menu VIP Member.",
  },
  {
    id: "faq-6",
    category: "vip",
    question: "Apa saja keuntungan menjadi VIP Member?",
    answer:
      "Sebagai VIP Member, Anda mendapatkan: 1) Akses tanpa batas ke seluruh episode serial TV (episode 6+ terbuka penuh), 2) Bebas batasan kuota tontonan harian, 3) Akses server prioritas berkecepatan tinggi, 4) Badge VIP Emas eksklusif di profil dan navigasi, 5) Bukti pembayaran resmi (Invoice) digital yang dapat diunduh dan dicetak.",
  },
  {
    id: "faq-7",
    category: "vip",
    question: "Metode pembayaran apa saja yang didukung?",
    answer:
      "LayarRika bekerja sama dengan Midtrans Payment Gateway resmi berlisensi Bank Indonesia. Kami mendukung pembayaran instan melalui: QRIS (GoPay, OVO, DANA, ShopeePay, LinkAja, BCA Mobile, Livin Mandiri, BRImo), Virtual Account Bank (BCA, Mandiri, BNI, BRI, Permata), serta Kartu Kredit / Debit Online (Visa, MasterCard, JCB).",
  },
  {
    id: "faq-8",
    category: "vip",
    question: "Berapa lama status VIP aktif setelah pembayaran?",
    answer:
      "Status VIP Anda akan aktif secara instan otomatis dalam hitungan detik setelah pembayaran terverifikasi oleh gateway Midtrans. Sistem webhook kami langsung memperbarui status akun Anda tanpa perlu konfirmasi manual.",
  },
  {
    id: "faq-9",
    category: "vip",
    question: "Di mana saya bisa melihat bukti pembayaran / invoice VIP?",
    answer:
      "Bukti pembayaran Anda tersimpan aman selamanya di akun Anda. Buka halaman Profil Akun Anda (/profile), lalu klik tombol 'Bukti Bayar' pada kartu keanggotaan VIP atau lihat daftar riwayat transaksi di bagian 'Riwayat Transaksi & Faktur'. Anda juga dapat mencetak atau mengunduh invoice dalam format PDF.",
  },
  {
    id: "faq-10",
    category: "account",
    question: "Bagaimana cara menyimpan film favorit ke Watchlist atau Playlist?",
    answer:
      "Pada halaman detail film atau serial apa pun, klik tombol 'Simpan ke Watchlist' (ikon bookmark) untuk memasukkannya ke daftar tontonan nanti. Anda juga dapat menekan tombol '+ Playlist' untuk membuat koleksi khusus dengan nama dan deskripsi pilihan Anda.",
  },
  {
    id: "faq-11",
    category: "account",
    question: "Apakah LayarRika menyimpan menit tontonan terakhir saya?",
    answer:
      "Ya. Saat Anda menonton dalam kondisi masuk ke akun (login), sistem secara otomatis merekam menit terakhir tontonan Anda ke dalam Riwayat Tontonan (Watch History). Anda dapat melanjutkan tontonan kapan saja melalui halaman Profil.",
  },
  {
    id: "faq-12",
    category: "catalog",
    question: "Dari mana data film dan serial di LayarRika berasal?",
    answer:
      "Seluruh data judul, sinopsis, poster, tanggal rilis, rating, pemeran (cast), dan trailer resmi terhubung langsung dengan TMDB API (The Movie Database), basis data hiburan sinematik global terkemuka yang diperbarui secara berkala.",
  },
];

type CategoryFilter = "all" | "streaming" | "catalog" | "account" | "vip" | "general";

export function HelpCenterContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1");

  // Filter FAQ berdasarkan pencarian dan kategori yang dipilih
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-12">
      {/* 1. Hero Search Section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#18181c] via-[#121215] to-[#0A0A0C] p-6 sm:p-10 text-center shadow-2xl">
        <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-[#D9A52E]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -z-10 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D9A52E]/30 bg-[#D9A52E]/10 text-[#D9A52E] text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkle size={14} weight="fill" />
          <span>Pusat Bantuan Resmi</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
          Bagaimana kami dapat membantu Anda hari ini?
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Temukan panduan lengkap tentang fitur streaming, cara memilih server, navigasi serial TV, keanggotaan VIP, bukti pembayaran digital, dan FAQ.
        </p>

        {/* Search Bar Input */}
        <div className="mt-6 max-w-xl mx-auto relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan, panduan, atau kata kunci (misal: server, VIP, invoice, buffering)..."
            className="w-full rounded-2xl border border-white/15 bg-black/60 pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E] transition shadow-inner backdrop-blur-md"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-md bg-white/10"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* 2. Kartu Panduan Cepat Berdasarkan Kategori */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <FilmReel size={22} className="text-[#D9A52E]" weight="duotone" />
              <span>Panduan Fitur Utama Website</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Pelajari seluruh kapabilitas sinematik yang disediakan di platform LayarRika.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Menonton & Server */}
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 sm:p-6 space-y-3.5 hover:border-[#D9A52E]/40 transition group shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#D9A52E] group-hover:scale-105 transition">
              <Play size={22} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#D9A52E] transition">
              Pemutar & Server Streaming
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ketahui perbedaan Server 1 (HD) dan Server 2 (MULTI), cara beralih server ketika buffering, memutar trailer resmi YouTube, dan mengaktifkan mode layar penuh (*fullscreen*).
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-[#D9A52E] font-medium">
              <CheckCircle size={14} weight="fill" />
              <span>Dukungan Multi-Server & Cuplikan Resmi</span>
            </div>
          </div>

          {/* Card 2: Serial TV & Episode */}
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 sm:p-6 space-y-3.5 hover:border-blue-500/40 transition group shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition">
              <Television size={22} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
              Navigasi Musim & Episode
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Navigasi antarmuka serial TV dengan mudah: pilih musim (*Season*), daftar nomor episode, tombol &quot;Eps Selanjutnya&quot; otomatis, serta penanda status episode yang selesai ditonton.
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-blue-400 font-medium">
              <CheckCircle size={14} weight="fill" />
              <span>Episode 1-5 Gratis untuk Semua Pengguna</span>
            </div>
          </div>

          {/* Card 3: VIP Member & Pembayaran */}
          <div className="rounded-2xl border border-[#D9A52E]/30 bg-gradient-to-b from-[#181610] to-[#121214] p-5 sm:p-6 space-y-3.5 hover:border-[#D9A52E] transition group shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D9A52E]/20 border border-[#D9A52E]/40 text-[#D9A52E] group-hover:scale-105 transition">
              <Crown size={22} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#D9A52E] transition">
              Akses VIP Member & Midtrans
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Buka seluruh episode serial tanpa batas kuota harian. Pembayaran mudah, instan, dan aman via Midtrans (QRIS, GoPay, ShopeePay, Virtual Account Bank BCA/Mandiri/BNI/BRI, Kartu Kredit).
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-[#D9A52E] font-medium">
              <CheckCircle size={14} weight="fill" />
              <span>Aktivasi Otomatis dalam Hitungan Detik</span>
            </div>
          </div>

          {/* Card 4: Bukti Bayar & Invoice */}
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 sm:p-6 space-y-3.5 hover:border-emerald-500/40 transition group shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition">
              <Receipt size={22} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
              Bukti Bayar & Faktur Digital
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Setelah pembayaran berhasil, tombol &quot;Bukti Bayar&quot; otomatis muncul di halaman Profil Anda. Dilengkapi faktur digital resmi dengan QR code verifikasi keaslian dan tombol cetak PDF.
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <CheckCircle size={14} weight="fill" />
              <span>Tersimpan Permanen di Profil Pengguna</span>
            </div>
          </div>

          {/* Card 5: Koleksi, Watchlist & Playlist */}
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 sm:p-6 space-y-3.5 hover:border-purple-500/40 transition group shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition">
              <Queue size={22} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition">
              Watchlist, Playlist & Riwayat
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Simpan judul favorit ke Watchlist, buat playlist kustom sesuai selera Anda, dan lanjutkan tontonan dari menit terakhir berkat fitur Watch History yang otomatis tersinkronisasi.
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-purple-400 font-medium">
              <CheckCircle size={14} weight="fill" />
              <span>Sinkronisasi Otomatis Progres Tontonan</span>
            </div>
          </div>

          {/* Card 6: Desain Responsif & Mobile */}
          <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 sm:p-6 space-y-3.5 hover:border-cyan-500/40 transition group shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition">
              <Compass size={22} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition">
              Tampilan Mobile Bersih & Ringkas
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Pengalaman pemutaran di smartphone dirancang edge-to-edge tanpa gangguan header berlebih, lengkap dengan tombol kembali melayang (&lt;) dan tombol Bantuan Cepat (?) tepat di pemutar.
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-cyan-400 font-medium">
              <CheckCircle size={14} weight="fill" />
              <span>Optimal di Ponsel, Tablet, & Komputer</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panduan Langkah Demi Langkah: Alur Menonton & Berlangganan */}
      <div className="rounded-3xl border border-white/10 bg-[#0E0E12] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkle size={20} className="text-[#D9A52E]" weight="fill" />
            <span>Alur Cepat Menikmati LayarRika</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Panduan 4 langkah mudah untuk mulai streaming film atau serial favorit Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9A52E]/15 text-[#D9A52E] text-xs font-black">
              1
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Temukan Judul</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Gunakan pencarian cepat atau jelajahi menu Movies, Series, dan Katalog dengan filter genre &amp; tahun rilis.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9A52E]/15 text-[#D9A52E] text-xs font-black">
              2
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Pilih Server</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Pilih Server 1 (HD) untuk kualitas terbaik. Jika terjadi buffering, klik Server 2 (MULTI) sebagai alternatif instan.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9A52E]/15 text-[#D9A52E] text-xs font-black">
              3
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Upgrade ke VIP</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Untuk membuka seluruh episode serial dan menghilangkan batas kuota tontonan harian, lakukan upgrade via Midtrans.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9A52E]/15 text-[#D9A52E] text-xs font-black">
              4
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Akses Bukti Bayar</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Setelah pembayaran selesai, unduh faktur digital resmi Anda di halaman Profil untuk bukti transaksi yang sah.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bagian FAQ Interaktif */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Question size={22} className="text-[#D9A52E]" weight="bold" />
              <span>Tanya Jawab Populer (FAQ)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Jawaban ringkas atas pertanyaan yang paling sering ditanyakan oleh pengguna.
            </p>
          </div>

          {/* Tab Filter Kategori FAQ */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            {[
              { id: "all", label: "Semua" },
              { id: "streaming", label: "Streaming" },
              { id: "vip", label: "VIP & Bayar" },
              { id: "account", label: "Akun" },
              { id: "catalog", label: "Katalog" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === tab.id
                    ? "bg-[#D9A52E] text-neutral-950 font-bold shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Accordion FAQ */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition duration-200 overflow-hidden ${
                    isExpanded
                      ? "border-[#D9A52E]/40 bg-[#161619]"
                      : "border-white/10 bg-[#111113] hover:border-white/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-white cursor-pointer gap-4"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9A52E]/15 text-[#D9A52E] text-xs font-bold">
                        ?
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <CaretDown
                      size={16}
                      weight="bold"
                      className={`text-[#D9A52E] transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-neutral-300 leading-relaxed border-t border-white/5">
                      <p className="mt-3 pl-8.5">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 rounded-2xl border border-white/10 bg-[#111113] p-6">
              <p className="text-xs text-neutral-400">
                Tidak ada pertanyaan yang sesuai dengan kata kunci &quot;{searchQuery}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs text-[#D9A52E] hover:underline font-semibold"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Kotak Bantuan Hubungi Kami */}
      <div className="rounded-3xl border border-[#D9A52E]/20 bg-gradient-to-r from-[#171510] via-[#121214] to-[#171510] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <EnvelopeSimple size={20} className="text-[#D9A52E]" weight="fill" />
            <span>Masih Memiliki Pertanyaan atau Kendala Transaksi?</span>
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            Tim LayarRika siap membantu Anda jika mengalami kendala pemutaran video, aktivasi pembayaran VIP, atau memiliki saran fitur.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D9A52E] hover:bg-[#c49226] text-neutral-950 text-xs font-bold transition shadow-md shadow-[#D9A52E]/20"
          >
            <Crown size={15} weight="fill" />
            <span>Lihat Paket VIP</span>
          </Link>

          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition"
          >
            <User size={15} />
            <span>Buka Profil Saya</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

