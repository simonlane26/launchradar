import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireOrganisation } from "@/lib/org";
import { stripeEnabled } from "@/lib/stripe";
import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free. Move up to Builder or Growth once Opportunity Radar is paying for itself. £0 / £12 / £24 a month, or save ~20% on annual.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const { userId } = await auth();
  let currentTier: "FREE" | "BUILDER" | "GROWTH" | null = null;
  let hasSubscription = false;
  if (userId) {
    const org = await requireOrganisation();
    currentTier = org.tier;
    hasSubscription = Boolean(org.stripeSubscriptionId);
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-24 pt-10">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
            Start free. Pay when Radar pays for itself.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            LaunchRadar could be worth £49–99 a month once it&apos;s bringing you customers. It
            isn&apos;t priced like that — you move up a tier when it&apos;s earning its keep.
          </p>
        </div>

        <PricingPlans
          currentTier={currentTier}
          stripeEnabled={stripeEnabled}
          hasSubscription={hasSubscription}
        />

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium">Running an agency, or a lot of products?</p>
          <p className="mt-1 text-sm text-zinc-500">
            A higher-volume plan is on the way. In the meantime, start on Growth and get in touch.
          </p>
          <Link
            href="/sign-up"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
          >
            Get your Growth Score
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
