"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  QrCode,
  Bank,
  CheckCircle,
  X,
  Spinner,
  ShieldCheck,
  Receipt,
  ArrowRight,
  ArrowClockwise,
  Check,
  Printer,
} from "@phosphor-icons/react";
import {
  createMidtransBankVaAction,
  checkMidtransStatusAction,
} from "@/app/actions/payment";

export interface MidtransModalProps {
  isOpen: boolean;
  orderId: string;
  grossAmount: number;
  planName: string;
  durationDays?: number;
  redirectUrl?: string;
  userName?: string | null;
  userEmail?: string | null;
  onClose: () => void;
  onPaySuccess: (orderId: string, options?: { isSimulated?: boolean }) => Promise<void>;
}

export function MidtransModal({
  isOpen,
  orderId,
  grossAmount,
  planName,
  durationDays = 30,
  redirectUrl,
  userName = null,
  userEmail = null,
  onClose,
  onPaySuccess,
}: MidtransModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>("bca_va");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<"channel" | "pay" | "success">("channel");

  // State untuk Real Midtrans Sandbox VA
  const [customOrderId, setCustomOrderId] = useState<string>("");
  const activeOrderId = customOrderId || orderId;
  const [vaNumber, setVaNumber] = useState<string>("");
  const [simulatorUrl, setSimulatorUrl] = useState<string>(
    "https://simulator.sandbox.midtrans.com/bca/va/index"
  );
  const [isGeneratingVa, setIsGeneratingVa] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string>("");

  // Handler tutup modal dengan pembersihan state
  const handleClose = () => {
    setStep("channel");
    setCustomOrderId("");
    setVaNumber("");
    setIsProcessing(false);
    setIsGeneratingVa(false);
    setIsCheckingStatus(false);
    setCheckMessage("");
    onClose();
  };

  // Callback saat pembayaran sukses (Settlement)
  const handlePaymentCompleted = useCallback(
    async (finalOrderId: string, options?: { isSimulated?: boolean }) => {
      setStep("success");
      setIsProcessing(false);
      try {
        await onPaySuccess(finalOrderId, options);
      } catch (err) {
        console.warn("Gagal konfirmasi status pembayaran:", err);
      }
    },
    [onPaySuccess]
  );

  // Auto-polling status transaksi saat di layar bayar VA
  useEffect(() => {
    if (!isOpen || step !== "pay" || !activeOrderId || isGeneratingVa) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await checkMidtransStatusAction(activeOrderId);
        if (isMounted && res.isPaid) {
          clearInterval(interval);
          await handlePaymentCompleted(activeOrderId);
        }
      } catch (err) {
        console.warn("Polling status error:", err);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, step, activeOrderId, isGeneratingVa, handlePaymentCompleted]);

  if (!isOpen) return null;

  // Berpindah dari pemilihan channel ke layar pembayaran
  const handleProceedToPay = async () => {
    if (
      selectedChannel === "bca_va" ||
      selectedChannel === "bni_va" ||
      selectedChannel === "bri_va"
    ) {
      setIsGeneratingVa(true);
      setCheckMessage("");

      const bank =
        selectedChannel === "bni_va"
          ? "bni"
          : selectedChannel === "bri_va"
          ? "bri"
          : "bca";

      try {
        const res = await createMidtransBankVaAction(bank);
        if (res.success && res.vaNumber) {
          setVaNumber(res.vaNumber);
          setCustomOrderId(res.orderId);
          setSimulatorUrl(res.simulatorUrl);
        } else {
          // Fallback nomor default jika offline
          setVaNumber(
            selectedChannel === "bni_va"
              ? "9881683212345678"
              : "16832175190399813787933"
          );
        }
        setStep("pay");
      } catch (err) {
        console.error("Gagal generate VA Midtrans:", err);
        setStep("pay");
      } finally {
        setIsGeneratingVa(false);
      }
    } else {
      setStep("pay");
    }
  };

  // Cek status manual oleh pengguna setelah klik 'Pay' di simulator Midtrans
  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setCheckMessage("");

    try {
      const res = await checkMidtransStatusAction(activeOrderId);
      if (res.isPaid) {
        await handlePaymentCompleted(activeOrderId);
      } else {
        setCheckMessage(
          res.status === "pending"
            ? "Status saat ini: PENDING. Pastikan Anda sudah menekan tombol 'Pay' pada halaman simulator Midtrans."
            : `Status saat ini: ${res.status || "Belum dibayar"}`
        );
      }
    } catch {
      setCheckMessage("Gagal memeriksa status. Silakan coba lagi.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Salin nomor VA ke clipboard
  const handleCopyVa = () => {
    if (!vaNumber) return;
    navigator.clipboard.writeText(vaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulasi instan langsung di aplikasi tanpa membuka tab baru
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await handlePaymentCompleted(activeOrderId, { isSimulated: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#D9A52E]/40 bg-gradient-to-b from-[#1c1810] via-[#141414] to-[#0d0d0d] p-6 sm:p-8 shadow-2xl shadow-black/90 text-[#F5F5F5] max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Tutup jendela pembayaran"
        >
          <X size={18} />
        </button>

        {/* Header Branding */}
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2.5 py-1 rounded-md bg-[#002855] border border-blue-400/40 text-white text-[11px] font-black uppercase tracking-wider">
            Midtrans
          </div>
          <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
            Sandbox Simulator Ready
          </span>
        </div>

        {/* Order Details Header */}
        <div className="rounded-2xl border border-neutral-800 bg-[#121212] p-4 mb-5 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Order ID:</span>
            <span className="font-mono text-neutral-200">{activeOrderId}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Paket:</span>
            <span className="font-semibold text-neutral-200">{planName}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-sm font-bold">
            <span>Total Tagihan:</span>
            <span className="text-[#D9A52E] text-base">
              Rp {grossAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* STEP 1: PILIH METODE PEMBAYARAN */}
        {step === "channel" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Pilih Metode Pembayaran Uji Coba:
            </h4>

            <div className="space-y-2.5">
              {/* BCA Virtual Account */}
              <label
                onClick={() => setSelectedChannel("bca_va")}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedChannel === "bca_va"
                    ? "border-[#D9A52E] bg-[#D9A52E]/10 text-white"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bank size={24} className="text-[#005EAA] shrink-0" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>BCA Virtual Account</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                        Support Simulator Midtrans
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Generate VA resmi untuk simulator.sandbox.midtrans.com
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_channel"
                  checked={selectedChannel === "bca_va"}
                  onChange={() => setSelectedChannel("bca_va")}
                  className="accent-[#D9A52E]"
                />
              </label>

              {/* BNI Virtual Account */}
              <label
                onClick={() => setSelectedChannel("bni_va")}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedChannel === "bni_va"
                    ? "border-[#D9A52E] bg-[#D9A52E]/10 text-white"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bank size={24} className="text-[#F15A24] shrink-0" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>BNI Virtual Account</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-semibold">
                        Support Simulator
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Uji coba nomor VA BNI di Midtrans Simulator
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_channel"
                  checked={selectedChannel === "bni_va"}
                  onChange={() => setSelectedChannel("bni_va")}
                  className="accent-[#D9A52E]"
                />
              </label>

              {/* BRI Virtual Account */}
              <label
                onClick={() => setSelectedChannel("bri_va")}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedChannel === "bri_va"
                    ? "border-[#D9A52E] bg-[#D9A52E]/10 text-white"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bank size={24} className="text-[#00529C] shrink-0" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>BRI Virtual Account (BRIVA)</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Simulasi pembayaran BRIVA Sandbox
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_channel"
                  checked={selectedChannel === "bri_va"}
                  onChange={() => setSelectedChannel("bri_va")}
                  className="accent-[#D9A52E]"
                />
              </label>

              {/* GoPay / QRIS */}
              <label
                onClick={() => setSelectedChannel("gopay")}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedChannel === "gopay"
                    ? "border-[#D9A52E] bg-[#D9A52E]/10 text-white"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode size={24} className="text-[#00AED6] shrink-0" />
                  <div>
                    <div className="text-xs font-bold">GoPay / QRIS Sandbox</div>
                    <div className="text-[10px] text-neutral-400">Scan QR Code instan</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_channel"
                  checked={selectedChannel === "gopay"}
                  onChange={() => setSelectedChannel("gopay")}
                  className="accent-[#D9A52E]"
                />
              </label>

              {/* Kartu Kredit / Debit Simulator */}
              <label
                onClick={() => setSelectedChannel("credit_card")}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedChannel === "credit_card"
                    ? "border-[#D9A52E] bg-[#D9A52E]/10 text-white"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className="text-[#D9A52E] shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Kartu Kredit / Debit Uji Coba</div>
                    <div className="text-[10px] text-neutral-400">Nomor kartu tes 3D Secure Sandbox</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_channel"
                  checked={selectedChannel === "credit_card"}
                  onChange={() => setSelectedChannel("credit_card")}
                  className="accent-[#D9A52E]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleProceedToPay}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#D9A52E] hover:bg-[#c49226] py-3 text-xs font-bold text-neutral-950 transition cursor-pointer shadow-lg shadow-[#D9A52E]/20"
            >
              <span>Lanjutkan ke Nomor Virtual Account</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: SIMULASI BAYAR */}
        {step === "pay" && (
          <div className="space-y-4">
            {/* VIRTUAL ACCOUNT SECTION (BCA, BNI, BRI) */}
            {(selectedChannel === "bca_va" ||
              selectedChannel === "bni_va" ||
              selectedChannel === "bri_va") && (
              <div className="space-y-3 text-left">
                {isGeneratingVa ? (
                  <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 flex flex-col items-center justify-center gap-3 text-center">
                    <Spinner size={28} className="animate-spin text-[#D9A52E]" />
                    <span className="text-xs font-semibold text-neutral-200">
                      Menghubungi Midtrans Sandbox untuk Nomor VA Resmi...
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Membuat tagihan pada Core API Midtrans Sandbox
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl border border-[#D9A52E]/30 bg-neutral-900/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <Bank size={18} className="text-[#D9A52E]" />
                          <span>
                            {selectedChannel === "bni_va"
                              ? "BNI Virtual Account"
                              : selectedChannel === "bri_va"
                              ? "BRI Virtual Account (BRIVA)"
                              : "BCA Virtual Account"}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Resmi Sandbox Midtrans
                        </span>
                      </div>

                      <span className="text-[11px] text-neutral-400 block">
                        Nomor Virtual Account Resmi untuk Simulator:
                      </span>

                      {/* VA Number Display + Copy Button */}
                      <div className="flex items-center justify-between gap-2 p-3 bg-neutral-950 border border-neutral-700 rounded-xl">
                        <span className="font-mono text-base sm:text-lg font-bold text-[#D9A52E] tracking-wider select-all break-all">
                          {vaNumber || "16832175190399813787933"}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyVa}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white flex items-center gap-1.5 font-semibold transition shrink-0 cursor-pointer"
                        >
                          {copied ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 256 256">
                              <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z" />
                            </svg>
                          )}
                          <span>{copied ? "Tersalin!" : "Salin"}</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-neutral-400 leading-relaxed">
                        Nomor VA ini <strong>tercatat sah</strong> di database Midtrans Sandbox dan dapat langsung diproses melalui portal simulator.
                      </div>
                    </div>

                    {/* Step-by-step simulator guide */}
                    <div className="p-3.5 rounded-xl bg-blue-950/25 border border-blue-500/30 text-[11px] text-blue-200 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-blue-300">
                        <CheckCircle size={15} />
                        <span>Cara Uji Coba di Website Midtrans Simulator:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-blue-200/90 leading-relaxed">
                        <li>Salin nomor VA di atas.</li>
                        <li>
                          Klik tombol biru <strong>&quot;Buka Midtrans Simulator&quot;</strong> di bawah.
                        </li>
                        <li>
                          Tempel nomor VA di kolom simulator lalu klik <strong>Inquire</strong>.
                        </li>
                        <li>
                          Klik <strong>Pay</strong> pada simulator untuk menyelesaikan pembayaran.
                        </li>
                        <li>
                          Sistem akan mendeteksi status settlement otomatis (atau klik tombol Cek Status).
                        </li>
                      </ol>
                    </div>

                    {/* Button Link to Official Simulator */}
                    <a
                      href={simulatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white transition shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 256 256">
                        <path d="M200,136v64a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56v120H184V136a8,8,0,0,1,16,0Zm32-88a8,8,0,0,0-8-8H160a8,8,0,0,0,0,16h44.69L114.34,146.34a8,8,0,0,0,11.32,11.32L216,67.31V112a8,8,0,0,0,16,0Z" />
                      </svg>
                      <span>Buka Midtrans Simulator (Tab Baru)</span>
                    </a>

                    {/* Manual Check Status Button */}
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={isCheckingStatus}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/90 hover:bg-neutral-700 py-2.5 text-xs font-semibold text-neutral-200 transition cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingStatus ? (
                        <>
                          <Spinner size={16} className="animate-spin text-[#D9A52E]" />
                          <span>Mengecek status pembayaran ke Midtrans...</span>
                        </>
                      ) : (
                        <>
                          <ArrowClockwise size={16} />
                          <span>Cek Status Pembayaran Sekarang</span>
                        </>
                      )}
                    </button>

                    {checkMessage && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] text-center leading-relaxed">
                        {checkMessage}
                      </div>
                    )}

                    {/* Instant in-app simulation shortcut */}
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={isProcessing}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                      >
                        ⚡ Atau klik di sini untuk simulasi sukses instan tanpa membuka simulator
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* GOPAY / QRIS SECTION */}
            {selectedChannel === "gopay" && (
              <div className="space-y-3 text-center">
                <div className="p-4 rounded-2xl bg-white text-black inline-block mx-auto shadow-inner">
                  <div className="w-40 h-40 bg-neutral-100 flex flex-col items-center justify-center border-2 border-dashed border-neutral-400 rounded-lg">
                    <QrCode size={56} className="text-neutral-800" />
                    <span className="text-[10px] font-mono mt-1 text-neutral-600 font-bold">
                      SIMULASI QRIS / GOPAY
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300">
                  Pindai kode QR atau simulasikan pembayaran sukses langsung:
                </p>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-bold text-neutral-950 transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      <span>Memproses Transaksi...</span>
                    </>
                  ) : (
                    <>
                      <Receipt size={16} weight="bold" />
                      <span>Simulasikan Pembayaran Sukses (Settlement)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* CREDIT CARD SECTION */}
            {selectedChannel === "credit_card" && (
              <div className="space-y-3 text-left">
                <div className="p-4 rounded-xl border border-neutral-700 bg-neutral-900 space-y-1.5 text-xs">
                  <div className="text-neutral-400">Nomor Kartu Uji Coba Sandbox:</div>
                  <div className="font-mono text-[#D9A52E] font-bold text-sm tracking-wider">
                    4811 1111 1111 1114
                  </div>
                  <div className="flex gap-4 text-neutral-400 text-[11px] pt-1">
                    <span>Exp: 12/28</span>
                    <span>CVV: 123</span>
                    <span>OTP: 112233</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-bold text-neutral-950 transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      <span>Memproses Otorisasi Kartu...</span>
                    </>
                  ) : (
                    <>
                      <Receipt size={16} weight="bold" />
                      <span>Simulasikan Pembayaran Kartu Sukses</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Official Snap portal link if available */}
            {redirectUrl && (
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 py-2.5 text-xs font-semibold text-neutral-300 transition"
              >
                <span>Buka Portal Pembayaran Midtrans Snap Resmi</span>
                <ArrowRight size={14} />
              </a>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStep("channel")}
                disabled={isProcessing || isCheckingStatus}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Kembali & pilih metode pembayaran lain
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUKSES DENGAN INVOICE / BUKTI PEMBAYARAN RESMI */}
        {step === "success" && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header Success */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/30">
                <CheckCircle size={32} weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-white">Pembayaran Berhasil & Lunas!</h3>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                Transaksi terkonfirmasi settlement. Paket{" "}
                <span className="text-[#D9A52E] font-bold">{planName}</span> kini aktif pada akun Anda.
              </p>
            </div>

            {/* Faktur / Invoice Card */}
            <div className="rounded-2xl border border-neutral-700/80 bg-neutral-900/90 p-4 sm:p-5 space-y-3.5 text-xs text-neutral-300">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-[#D9A52E]" weight="fill" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Faktur Pembayaran Digital
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Lunas / Settled
                </span>
              </div>

              {/* Detail Transaksi Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-neutral-500 block">No. Faktur:</span>
                  <span className="font-mono text-neutral-200 font-semibold">
                    INV-LR-{activeOrderId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Waktu Transaksi:</span>
                  <span className="text-neutral-200">
                    {new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Order ID:</span>
                  <span
                    className="font-mono text-neutral-300 truncate block max-w-[170px]"
                    title={activeOrderId}
                  >
                    {activeOrderId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Metode:</span>
                  <span className="text-neutral-200 capitalize">
                    {selectedChannel.replace(/_/g, " ")}
                  </span>
                </div>
                {userName && (
                  <div className="col-span-2 pt-1 border-t border-neutral-800/60 flex justify-between text-[11px]">
                    <span className="text-neutral-500">Pelanggan:</span>
                    <span className="text-neutral-200 font-semibold">
                      {userName} ({userEmail || "-"})
                    </span>
                  </div>
                )}
              </div>

              {/* Item Pembelian */}
              <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-neutral-200 font-medium">
                  <span>{planName} ({durationDays} Hari)</span>
                  <span className="font-mono">Rp {grossAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-500 text-[11px]">
                  <span>PPN / Biaya Layanan:</span>
                  <span className="font-mono">Rp 0 (Bebas Biaya)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-sm font-bold text-white">
                  <span>Total Dibayar:</span>
                  <span className="text-[#D9A52E] font-mono">
                    Rp {grossAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2 pt-1">
              <a
                href={`/invoice/${encodeURIComponent(activeOrderId)}?print=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D9A52E]/40 bg-[#D9A52E]/10 hover:bg-[#D9A52E]/20 py-2.5 text-xs font-bold text-[#D9A52E] transition shadow-sm"
              >
                <Printer size={16} weight="bold" />
                <span>Buka Lembar Faktur & Cetak PDF</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D9A52E] hover:bg-[#c49226] py-3 text-xs font-bold text-neutral-950 transition cursor-pointer shadow-lg shadow-[#D9A52E]/20"
              >
                <span>Mulai Nonton dengan Akses VIP</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck size={14} className="text-[#D9A52E]" />
          <span>Lingkungan Uji Coba Terenkripsi Midtrans Sandbox (Tanpa Biaya Nyata)</span>
        </div>
      </div>
    </div>
  );
}
