import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Tier } from "@/lib/plan";
import { stripe, tierFromSubscription } from "@/lib/stripe";
import { logError } from "@/lib/errors";

// Node runtime (Stripe SDK needs Node crypto) + never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * The single writer of `Organisation.tier` once billing is live. Every
 * handler re-derives state from the current Stripe object (idempotent,
 * order-independent — Stripe retries and can deliver out of order).
 */
export async function POST(req: Request) {
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    // Bad signature / malformed payload — do NOT retry.
    logError("stripe-webhook:verify", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const organisationId = session.client_reference_id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (!organisationId || !subscriptionId || !customerId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await prisma.organisation.update({
          where: { id: organisationId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            tier: tierFromSubscription(subscription),
            subscriptionStatus: subscription.status,
            currentPeriodEnd: periodEnd(subscription),
          },
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await syncSubscription(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const org = await findOrg(subscription);
        if (org) {
          await prisma.organisation.update({
            where: { id: org.id },
            data: {
              tier: Tier.FREE,
              stripeSubscriptionId: null,
              subscriptionStatus: subscription.status,
              currentPeriodEnd: null,
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge so Stripe stops retrying.
        break;
    }
  } catch (err) {
    logError(`stripe-webhook:${event.type}`, err);
    // 500 → Stripe retries with backoff.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  const item = sub.items.data[0];
  const ts = item?.current_period_end ?? null;
  return ts ? new Date(ts * 1000) : null;
}

async function findOrg(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  return (
    (await prisma.organisation.findUnique({ where: { stripeSubscriptionId: sub.id } })) ??
    (await prisma.organisation.findUnique({ where: { stripeCustomerId: customerId } })) ??
    (await orgFromMetadata(sub))
  );
}

async function orgFromMetadata(sub: Stripe.Subscription) {
  const id = sub.metadata?.organisationId;
  return id ? prisma.organisation.findUnique({ where: { id } }) : null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const org = await findOrg(sub);
  if (!org) {
    logError("stripe-webhook:sync", new Error(`No org for subscription ${sub.id}`));
    return;
  }
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  await prisma.organisation.update({
    where: { id: org.id },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      tier: tierFromSubscription(sub),
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd(sub),
    },
  });
}
