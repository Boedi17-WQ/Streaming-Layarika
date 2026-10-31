import { Suspense } from "react";
import { Metadata } from "next";
import { connection } from "next/server";
import { auth } from "@/auth";
import {
  getSubscriptionPlans,
  getUserSubscriptionStatus,
  SIMULATED_BILLING_ENABLED,
} from "@/services/subscription.service";
import { getUserInvoices } from "@/services/invoice.service";
import { PricingView, PlanData } from "@/components/subscription/PricingView";
import { Crown } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Paket Langganan & VIP — LayarRika",
  description:
    "Pilih paket tontonan terbaik Anda di LayarRika. Nikmati akses VIP tanpa batas kuota episode dan film.",
};

// Mengizinkan evaluasi rute dinamis sesuai konvensi Next.js 16
export const instant = false;

function PricingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/30 p-8 sm:p-10 h-96 animate-pulse flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-neutral-800 rounded-lg" />
            <div className="h-4 w-48 bg-neutral-800/60 rounded" />
            <div className="h-10 w-28 bg-neutral-800 rounded-lg mt-4" />
          </div>
          <div className="h-12 w-full bg-neutral-800 rounded-xl" />
        </div>

        <div className="rounded-3xl border border-[#D9A52E]/30 bg-[#171717]/40 p-8 sm:p-10 h-96 animate-pulse flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-6 w-40 bg-[#D9A52E]/20 rounded-lg" />
            <div className="h-4 w-52 bg-neutral-800/60 rounded" />
            <div className="h-10 w-36 bg-[#D9A52E]/20 rounded-lg mt-4" />
          </div>
          <div className="h-12 w-full bg-[#D9A52E]/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function PricingDataLoader() {
  await connection();
  const session = await auth();
  const userId = session?.user?.id || null;

  const [rawPlans, userStatus, userInvoices] = await Promise.all([
    getSubscriptionPlans(),
    getUserSubscriptionStatus(userId),
    userId ? getUserInvoices(userId) : Promise.resolve([]),
  ]);

  const plans: PlanData[] = rawPlans.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    durationDays: p.durationDays,
    features: p.features,
    episodeLimit: p.episodeLimit,
    movieWatchSecondsLimit: p.movieWatchSecondsLimit,
  }));

  return (
    <PricingView
      plans={plans}
      currentUserPlanSlug={userStatus.planSlug}
      isVip={userStatus.isVip}
      vipEndDate={userStatus.endDate}
      isAuthenticated={!userStatus.isGuest}
      simulatedBillingEnabled={SIMULATED_BILLING_ENABLED}
      clientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
      userName={session?.user?.name || null}
      userEmail={session?.user?.email || null}
      latestOrderId={userInvoices.length > 0 ? userInvoices[0].orderId : null}
    />
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header Prerendered Shell */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D9A52E]/10 border border-[#D9A52E]/30 text-[#D9A52E] text-xs font-bold uppercase tracking-widest">
          <Crown size={16} weight="fill" />
          <span>Tiered Content Access</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Pilih Paket Sinematik Anda
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Nikmati fleksibilitas paket Free untuk eksplorasi harian, atau tingkatkan ke Premium VIP untuk kebebasan menonton tanpa batas durasi film dan kuota episode.
        </p>
      </div>

      {/* Dynamic Data Streaming with Suspense Boundary */}
      <Suspense fallback={<PricingSkeleton />}>
        <PricingDataLoader />
      </Suspense>
    </main>
  );
}
