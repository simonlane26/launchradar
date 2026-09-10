"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { IconCheck, IconMinus } from "@tabler/icons-react";
import { startCheckout, openBillingPortal } from "@/app/billing/actions";

type Billing = "monthly" | "annual";
type PlanId = "FREE" | "BUILDER" | "GROWTH";

type PaidPricing = {
  /** headline number shown big — the effective £/month for the selected cadence */
  perMonth: string;
  /** the line under it explaining what's actually charged */
  note: string;
};

type Tier = {
  id: PlanId;
  name: string;
  blurb: string;
  cta: string;
  highlight: boolean;
  bullets: string[];
  /** null for Free */
  pricing: Record<Billing, PaidPricing> | null;
};

const TIERS: Tier[] = [
  {
    id: "FREE",
    name: "Free",
    blurb: "Kick the tyres on one project.",
    cta: "Start free",
    highlight: false,
    pricing: null,
    bullets: [
      "1 project",
      "Full website analysis + Growth Score",
      "Growth Backlog (limited) & basic visibility checks",
      "1 Radar scan a month, up to 5 opportunities",
    ],
  },
  {
    id: "BUILDER",
    name: "Builder",
    blurb: "For a founder actively working a launch or two.",
    cta: "Start with Builder",
    highlight: true,
    pricing: {
      monthly: { perMonth: "£12", note: "billed monthly" },
      annual: { perMonth: "£9.58", note: "£115 billed yearly — save 20%" },
    },
    bullets: [
      "3 projects",
      "Full Growth Backlog + full visibility checks",
      "4 Radar scans a month, up to 50 opportunities",
      "Competitor Radar, Analytics, 3 live experiments",
      "Priority opportunities surfaced first",
    ],
  },
  {
    id: "GROWTH",
    name: "Growth",
    blurb: "Running several products — or going hard on one.",
    cta: "Start with Growth",
    highlight: false,
    pricing: {
      monthly: { perMonth: "£24", note: "billed monthly" },
      annual: { perMonth: "£19", note: "£229 billed yearly — save 20%" },
    },
    bullets: [
      "10 projects",
      "20 Radar scans a month, up to 250 opportunities",
      "Scheduled Radar scans, so demand finds you",
      "Unlimited experiments",
      "150 AI content actions, 100 draft replies a month",
    ],
  },
];

type Cell = "yes" | "no" | string;

const FEATURES: { label: string; values: [Cell, Cell, Cell] }[] = [
  { label: "Projects", values: ["1", "3", "10"] },
  { label: "Full website analysis", values: ["yes", "yes", "yes"] },
  { label: "Growth Score", values: ["yes", "yes", "yes"] },
  { label: "Growth Backlog", values: ["Limited", "Full", "Full"] },
  { label: "Visibility checks", values: ["Basic", "Full", "Full"] },
  { label: "Opportunity Radar", values: ["5 results/mo", "50/mo", "250/mo"] },
  { label: "Radar scans", values: ["1/mo", "4/mo", "20/mo"] },
  { label: "AI content / actions", values: ["3/mo", "30/mo", "150/mo"] },
  { label: "Draft opportunity replies", values: ["2/mo", "25/mo", "100/mo"] },
  { label: "Analytics", values: ["Basic", "yes", "yes"] },
  { label: "Experiments", values: ["no", "3 active", "Unlimited"] },
  { label: "Competitor Radar", values: ["no", "yes", "yes"] },
  { label: "Scheduled Radar scans", values: ["no", "no", "yes"] },
  { label: "Priority opportunities", values: ["no", "yes", "yes"] },
];

function Value({ cell }: { cell: Cell }) {
  if (cell === "yes")
    return <IconCheck size={16} className="mx-auto text-emerald-600 dark:text-emerald-400" />;
  if (cell === "no") return <IconMinus size={16} className="mx-auto text-zinc-300 dark:text-zinc-700" />;
  return <span>{cell}</span>;
}

function priceCell(tier: Tier, billing: Billing): string {
  if (!tier.pricing) return "£0";
  return billing === "annual"
    ? tier.pricing.annual.note.replace(" — save 20%", "")
    : `${tier.pricing.monthly.perMonth}/mo`;
}

const btnBase =
  "mt-6 flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors";
const btnPrimary = "bg-signal text-signal-ink hover:bg-signal-hi";
const btnOutline =
  "border border-edge hover:border-edge-hi text-ink";

export function PricingPlans({
  currentTier,
  stripeEnabled,
  hasSubscription,
}: {
  currentTier: PlanId | null;
  stripeEnabled: boolean;
  hasSubscription: boolean;
}) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pending, start] = useTransition();

  return (
    <>
      <div className="mt-10 flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex rounded-full border border-zinc-300 bg-white p-1 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950"
        >
          <button
            type="button"
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              billing === "monthly"
                ? "bg-signal text-signal-ink"
                : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors ${
              billing === "annual"
                ? "bg-signal text-signal-ink"
                : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Annual
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                billing === "annual"
                  ? "bg-signal-ink/20 text-signal-ink"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              }`}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const p = tier.pricing?.[billing];
          return (
            <div
              key={tier.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 dark:bg-zinc-950 ${
                tier.highlight
                  ? "border-signal"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{tier.name}</h2>
                {tier.highlight && (
                  <span className="rounded-full bg-signal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal-ink">
                    Most popular
                  </span>
                )}
              </div>

              <p className="mt-3">
                <span className="text-3xl font-semibold tracking-tight">
                  {p ? p.perMonth : "£0"}
                </span>
                {p && <span className="text-sm text-zinc-500">/mo</span>}
              </p>
              <p className="mt-1 min-h-[1.25rem] text-xs text-zinc-500">
                {p ? p.note : "free forever"}
              </p>
              <p className="mt-2 text-sm text-zinc-500">{tier.blurb}</p>

              <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <IconCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    {b}
                  </li>
                ))}
              </ul>

              <Show when="signed-out">
                <Link
                  href="/sign-up"
                  className={`${btnBase} ${tier.highlight ? btnPrimary : btnOutline}`}
                >
                  {tier.cta}
                </Link>
              </Show>
              <Show when="signed-in">
                <CardCta
                  tier={tier}
                  billing={billing}
                  currentTier={currentTier}
                  stripeEnabled={stripeEnabled}
                  pending={pending}
                  run={start}
                />
              </Show>
            </div>
          );
        })}
      </section>

      <p className="mt-4 text-center text-xs text-zinc-500">
        No card required for Free. Plans upgrade, downgrade or cancel any time.
        {hasSubscription && (
          <>
            {" "}
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => openBillingPortal())}
              className="font-medium underline underline-offset-2 hover:text-black disabled:opacity-50 dark:hover:text-zinc-100"
            >
              Manage your subscription
            </button>
          </>
        )}
      </p>

      <section className="mt-16">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Everything in each plan
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Feature</th>
                {TIERS.map((t) => (
                  <th
                    key={t.id}
                    className={`px-4 py-3 text-center font-semibold ${
                      t.highlight ? "bg-zinc-50 dark:bg-zinc-900" : ""
                    }`}
                  >
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Price</td>
                {TIERS.map((t) => (
                  <td
                    key={t.id}
                    className={`px-4 py-3 text-center font-medium ${
                      t.highlight ? "bg-zinc-50 dark:bg-zinc-900" : ""
                    }`}
                  >
                    {priceCell(t, billing)}
                  </td>
                ))}
              </tr>
              {FEATURES.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.label}</td>
                  {row.values.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3 text-center ${
                        TIERS[i].highlight ? "bg-zinc-50 dark:bg-zinc-900" : ""
                      }`}
                    >
                      <Value cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function CardCta({
  tier,
  billing,
  currentTier,
  stripeEnabled,
  pending,
  run,
}: {
  tier: Tier;
  billing: Billing;
  currentTier: PlanId | null;
  stripeEnabled: boolean;
  pending: boolean;
  run: (fn: () => void) => void;
}) {
  const isCurrent = currentTier === tier.id;

  if (isCurrent) {
    return (
      <button type="button" disabled className={`${btnBase} ${btnOutline} opacity-60`}>
        Current plan
      </button>
    );
  }

  // Free card for a paying customer: route them to the portal to downgrade.
  if (tier.id === "FREE") {
    if (currentTier && currentTier !== "FREE" && stripeEnabled) {
      return (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => openBillingPortal())}
          className={`${btnBase} ${btnOutline} disabled:opacity-50`}
        >
          Change plan
        </button>
      );
    }
    return (
      <Link href="/dashboard" className={`${btnBase} ${btnOutline}`}>
        Go to dashboard
      </Link>
    );
  }

  // Paid card. No Stripe configured → just send them into the app.
  if (!stripeEnabled) {
    return (
      <Link
        href="/dashboard"
        className={`${btnBase} ${tier.highlight ? btnPrimary : btnOutline}`}
      >
        Go to dashboard
      </Link>
    );
  }

  const label = currentTier && currentTier !== "FREE" ? `Switch to ${tier.name}` : `Choose ${tier.name}`;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => run(() => startCheckout(tier.id as "BUILDER" | "GROWTH", billing))}
      className={`${btnBase} ${tier.highlight ? btnPrimary : btnOutline} disabled:opacity-50`}
    >
      {pending ? "Opening checkout…" : label}
    </button>
  );
}
