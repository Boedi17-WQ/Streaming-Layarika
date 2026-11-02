"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Play,
} from "@phosphor-icons/react";
import { InvoiceData } from "@/lib/subscription/invoice-utils";

interface InvoiceViewProps {
  invoice: InvoiceData;
  autoPrint?: boolean;
}

export function InvoiceView({ invoice, autoPrint = false }: InvoiceViewProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.transactionDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action Navigation Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-[#D9A52E] transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Profil</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-xl border border-[#D9A52E]/30 bg-[#D9A52E]/10 px-4 py-2 text-xs font-bold text-[#D9A52E] hover:bg-[#D9A52E]/20 transition"
          >
            <Play size={16} weight="fill" />
            <span>Mulai Menonton</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D9A52E] hover:bg-[#c49226] px-5 py-2 text-xs font-bold text-neutral-950 transition cursor-pointer shadow-lg shadow-[#D9A52E]/20"
          >
            <Printer size={16} weight="bold" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Paper Document Container */}
      <div
        id="invoice-document"
        className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-[#121212] p-8 sm:p-12 shadow-2xl text-[#F5F5F5] print:border-none print:shadow-none print:p-0 print:bg-white print:text-black"
      >
        {/* LUNAS Watermark Stamp */}
        <div className="absolute top-8 right-8 rotate-12 pointer-events-none select-none border-4 border-emerald-500/30 rounded-2xl px-4 py-2 text-emerald-400/30 font-black text-2xl sm:text-3xl tracking-widest uppercase print:text-emerald-700 print:border-emerald-700">
          LUNAS / SETTLED
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-neutral-800 print:border-neutral-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[#D9A52E] text-black flex items-center justify-center font-black text-lg">
                LR
              </div>
              <span className="text-2xl font-black tracking-wider text-white print:text-black">
                Layar<span className="text-[#D9A52E] print:text-amber-600">Rika</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 print:text-neutral-600">
              Platform Sinematik Streaming Film & Serial
            </p>
            <p className="text-[11px] text-neutral-400 print:text-neutral-600">
              Indonesia • layarrika.vercel.app
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D9A52E] print:text-amber-700">
              Faktur Pembayaran Resmi
            </span>
            <h2 className="text-xl font-bold font-mono text-white print:text-black">
              {invoice.invoiceNumber}
            </h2>
            <p className="text-xs text-neutral-400 print:text-neutral-600">
              Tanggal: {formattedDate} WIB
            </p>
          </div>
        </div>

        {/* Invoice Billing Information Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-neutral-800 print:border-neutral-300 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 print:text-neutral-600">
              Ditagihkan Kepada (Pelanggan):
            </span>
            <p className="text-sm font-bold text-white print:text-black">{invoice.customerName}</p>
            <p className="text-neutral-300 print:text-neutral-700">{invoice.customerEmail}</p>
            <p className="font-mono text-[11px] text-neutral-400 print:text-neutral-500">
              User ID: {invoice.userId}
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 print:text-neutral-600">
              Rincian Transaksi Gateway:
            </span>
            <div className="flex sm:justify-end items-center gap-1.5 text-neutral-300 print:text-neutral-700">
              <span>Metode:</span>
              <span className="font-semibold text-white print:text-black">{invoice.paymentMethod}</span>
            </div>
            <div className="flex sm:justify-end items-center gap-1.5 font-mono text-[11px] text-neutral-400 print:text-neutral-600">
              <span>Order ID:</span>
              <span>{invoice.orderId}</span>
            </div>
            <div className="flex sm:justify-end items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider print:bg-emerald-100 print:text-emerald-800">
                <CheckCircle size={12} weight="fill" />
                <span>Pembayaran Sukses</span>
              </span>
            </div>
          </div>
        </div>

        {/* Item Table */}
        <div className="py-8 border-b border-neutral-800 print:border-neutral-300">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 print:border-neutral-300 text-neutral-400 print:text-neutral-600">
                <th className="pb-3 font-bold uppercase tracking-wider">Deskripsi Item</th>
                <th className="pb-3 text-center font-bold uppercase tracking-wider">Durasi</th>
                <th className="pb-3 text-center font-bold uppercase tracking-wider">Qty</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Harga</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 print:divide-neutral-200">
              <tr>
                <td className="py-4">
                  <div className="font-bold text-sm text-white print:text-black">
                    {invoice.planName}
                  </div>
                  <div className="text-[11px] text-neutral-400 print:text-neutral-600 mt-0.5">
                    Akses streaming VIP tanpa batas kuota 5 episode harian & batas film 60 menit.
                  </div>
                </td>
                <td className="py-4 text-center font-medium text-neutral-300 print:text-neutral-700">
                  {invoice.durationDays} Hari
                </td>
                <td className="py-4 text-center font-medium text-neutral-300 print:text-neutral-700">
                  1
                </td>
                <td className="py-4 text-right font-mono text-neutral-300 print:text-neutral-700">
                  Rp {invoice.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-4 text-right font-mono font-bold text-white print:text-black">
                  Rp {invoice.amount.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 print:border-neutral-300 text-xs">
          <div className="space-y-1 text-neutral-400 print:text-neutral-600 text-[11px] max-w-sm">
            <p>
              Faktur ini merupakan dokumen elektronik sah atas transaksi pembayaran layanan streaming digital pada portal LayarRika.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-neutral-400 print:text-neutral-600">
              <span>Subtotal:</span>
              <span className="font-mono">Rp {invoice.amount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-neutral-400 print:text-neutral-600">
              <span>PPN (0%):</span>
              <span className="font-mono">Rp 0</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-800 print:border-neutral-300 text-sm font-bold text-white print:text-black">
              <span>Total Pembayaran:</span>
              <span className="text-[#D9A52E] print:text-amber-700 text-base font-mono">
                Rp {invoice.amount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Footer & Digital Signature */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 print:text-neutral-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#D9A52E] print:text-amber-600 shrink-0" />
            <span className="text-[11px]">
              Diterbitkan secara otomatis oleh Sistem Pembayaran Terpadu LayarRika & Midtrans Payment Gateway.
            </span>
          </div>

          <div className="text-[10px] font-mono text-neutral-400 print:text-neutral-600">
            Hash: {invoice.orderId.slice(-12).toLowerCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
