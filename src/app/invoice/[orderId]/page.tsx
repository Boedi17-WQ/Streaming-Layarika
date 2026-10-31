import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { Container } from "@/components/ui/Container";
import { getInvoiceByOrderId } from "@/services/invoice.service";
import { InvoiceView } from "@/components/subscription/InvoiceView";

export const instant = false;

interface InvoicePageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ print?: string }>;
}

export async function generateMetadata({
  params,
}: InvoicePageProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Faktur Pembayaran #${orderId} — LayarRika`,
    description: `Faktur resmi bukti transaksi langganan VIP di LayarRika (${orderId}).`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
  await connection();
  const session = await auth();

  const { orderId } = await params;
  const sp = await searchParams;

  if (!session || !session.user || !session.user.id) {
    redirect(`/login?callbackUrl=/invoice/${encodeURIComponent(orderId)}`);
  }

  const { invoice, unauthorized, notFound: isNotFound } = await getInvoiceByOrderId(
    orderId,
    session.user.id,
    session.user.role
  );

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-20 px-4 text-[#F5F5F5] flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-neutral-900 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-white">Akses Ditolak</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Anda tidak memiliki izin untuk melihat faktur transaksi ini. Faktur hanya dapat diakses oleh pemilik akun yang bersangkutan atau administrator.
          </p>
        </div>
      </div>
    );
  }

  if (isNotFound || !invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8 text-[#F5F5F5] print:bg-white print:py-0 print:px-0">
      <Container className="max-w-4xl">
        <InvoiceView invoice={invoice} autoPrint={sp.print === "true"} />
      </Container>
    </main>
  );
}

