import Stripe from "stripe";
import { Tier } from "@/lib/plan";

/**
 * Stripe billing. Optional — if `STRIPE_SECRET_KEY` is unset the app runs
 * fine with `tier` managed by hand (`scripts/tier.ts`); checkout actions and
 * the webhook just report "not configured".
 *
 * Flow: hosted Checkout (redirect) to subscribe → `checkout.session.completed`
 * + `customer.subscription.*` webhooks write `Organisation.tier` → hosted
 * Customer Portal (redirect) for upgrades / downgrades / cancellation.
 */

export const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

export const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string)
  : null;

export type PaidTier = "BUILDER" | "GROWTH";
export type Cadence = "monthly" | "annual";

const PRICE_ENV: Record<PaidTier, Record<Cadence, string | undefined>> = {
  BUILDER: {
    monthly: process.env.STRIPE_PRICE_BUILDER_MONTHLY,
    annual: process.env.STRIPE_PRICE_BUILDER_ANNUAL,
  },
  GROWTH: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
  },
};

/** The configured Stripe Price id for a plan + cadence, or null if unset. */
export function priceIdFor(tier: PaidTier, cadence: Cadence): string | null {
  return PRICE_ENV[tier][cadence] ?? null;
}

/** Reverse lookup: which tier does a Stripe Price id map to? */
export function tierForPriceId(priceId: string | null | undefined): PaidTier | null {
  if (!priceId) return null;
  for (const tier of ["BUILDER", "GROWTH"] as const) {
    for (const cadence of ["monthly", "annual"] as const) {
      if (PRICE_ENV[tier][cadence] === priceId) return tier;
    }
  }
  return null;
}

/**
 * The `Organisation.tier` a subscription implies. Re-derive this from the
 * current subscription object on every webhook — never apply deltas, since
 * Stripe retries and can deliver events out of order.
 */
export function tierFromSubscription(sub: Stripe.Subscription): Tier {
  const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
  if (!active) return Tier.FREE;
  const priceId = sub.items.data[0]?.price.id;
  return (tierForPriceId(priceId) as Tier | null) ?? Tier.FREE;
}
