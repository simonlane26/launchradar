"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { requireOrganisation } from "@/lib/org";
import { SITE_URL } from "@/lib/seo";
import { SafeError } from "@/lib/errors";
import { stripe, priceIdFor, type PaidTier, type Cadence } from "@/lib/stripe";

const PAID_TIERS: readonly PaidTier[] = ["BUILDER", "GROWTH"];
const CADENCES: readonly Cadence[] = ["monthly", "annual"];

/** Redirect the caller's org to Stripe Checkout for a plan + cadence. */
export async function startCheckout(tier: PaidTier, cadence: Cadence) {
  if (!PAID_TIERS.includes(tier) || !CADENCES.includes(cadence)) {
    throw new SafeError("Unknown plan.");
  }
  if (!stripe) throw new SafeError("Billing isn't set up yet.");

  const price = priceIdFor(tier, cadence);
  if (!price) throw new SafeError("That plan isn't available right now.");

  const organisation = await requireOrganisation();

  // Existing subscribers manage changes in the portal, not a fresh checkout.
  if (organisation.stripeSubscriptionId) {
    return openBillingPortal();
  }

  const email = organisation.stripeCustomerId
    ? undefined
    : (await currentUser())?.primaryEmailAddress?.emailAddress;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: organisation.id,
    customer: organisation.stripeCustomerId ?? undefined,
    customer_email: email,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    subscription_data: { metadata: { organisationId: organisation.id } },
    success_url: `${SITE_URL}/dashboard?checkout=success`,
    cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
  });

  if (!session.url) throw new SafeError("Couldn't start checkout. Try again.");
  redirect(session.url);
}

/** Redirect to the Stripe Customer Portal (upgrade / downgrade / cancel / card). */
export async function openBillingPortal() {
  if (!stripe) throw new SafeError("Billing isn't set up yet.");

  const organisation = await requireOrganisation();
  if (!organisation.stripeCustomerId) {
    redirect("/pricing");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: organisation.stripeCustomerId,
    return_url: `${SITE_URL}/dashboard`,
  });
  redirect(session.url);
}
