import type { Metadata } from "next";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlaybookSignup } from "@/components/playbook-signup";
import { BRAND } from "@/lib/seo";

const META_TITLE = "LaunchRadar: A Prioritized Plan to Find Your App's First Users";
// Same one-sentence definition as the hero subheadline and the JSON-LD
// `description`, so the page's visible and machine-readable definitions match.
const META_DESCRIPTION = BRAND.oneLiner;

// Primary CTA skin — signal green (the radar accent) so the main action reads
// as the main action against the outline + text links beside it. signal-ink
// text on signal keeps it high-contrast. Compose with sizing (`h-* px-* text-*`).
const CTA_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-signal font-semibold text-signal-ink transition-colors hover:bg-signal-hi";

export const metadata: Metadata = {
  title: { absolute: META_TITLE },
  description: META_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: META_TITLE, description: META_DESCRIPTION, url: "/" },
  twitter: { title: META_TITLE, description: META_DESCRIPTION },
};

const STEPS = [
  {
    h: "Step 1: Connect your product",
    p: "Paste your URL. LaunchRadar reads your live site, works out your category, ideal customer and positioning, and runs deterministic technical checks — no long onboarding form.",
  },
  {
    h: "Step 2: Get your prioritized growth plan",
    p: "You get a 0–100 Growth Score across six dimensions and a ranked backlog of the specific moves that matter for your product — highest impact, lowest effort first — each with a draft or a step-by-step guide.",
  },
  {
    h: "Step 3: Execute and track results",
    p: "Work the backlog, mark tasks done, and watch your projected score climb. Opportunity Radar surfaces people already asking for what you built; Launch Mode turns the plan into a 30-day campaign.",
  },
];

const AUDIENCE = [
  "Indie and solo founders who can build a product but have never run a marketing plan.",
  "AI-assisted and no-code builders who shipped fast and skipped the “figure out distribution” step.",
  "Anyone with a live app stuck near zero users who wants a clear next move, not more theory.",
];

const WHY = [
  {
    h: "It’s specific to your product.",
    p: "A consumer app, a B2B tool and a developer product get different plans — not the same 50-item checklist.",
  },
  {
    h: "It tells you what to skip.",
    p: "LaunchRadar calls out the channels that won’t work for you so you don’t waste weeks on them.",
  },
  {
    h: "It’s plain-language and fast.",
    p: "Every task says what to do, why, and how long it takes. Your first plan is ready in about a minute.",
  },
];

const FAQ = [
  {
    q: "Does this work for B2B products, or just consumer apps?",
    a: "Both. LaunchRadar builds the plan around your product’s category and who it’s for, so a B2B SaaS tool, a consumer app and a developer tool each get different channels and tactics — not one shared checklist.",
  },
  {
    q: "How is this different from asking ChatGPT for a marketing plan?",
    a: "ChatGPT answers from your prompt. LaunchRadar reads your live site first, scores it so you have a baseline you can track over time, turns the plan into a backlog of tasks with a draft or a walkthrough for each, and tells you which channels to skip.",
  },
  {
    q: "Can I use it before I’ve launched?",
    a: "Yes. It works for pre-launch, just-launched and stuck-at-zero-users products — the plan changes based on where you are.",
  },
  {
    q: "What do you need from me to get started?",
    a: "Just your URL. LaunchRadar reads the live site and runs its checks itself — there’s no long onboarding questionnaire — and your first plan is ready in about a minute.",
  },
  {
    q: "Is my data private?",
    a: "LaunchRadar only needs your public site URL and anything you choose to add to a product profile; card details go straight to Stripe, never to us. Your projects are scoped to your account and aren’t visible to other users. We don’t sell your data, use it for advertising, or use your content to train AI models. Delete your account and the data is removed or anonymised within 90 days. Full detail is in the privacy policy.",
  },
  {
    q: "How much does it cost?",
    a: "There’s a free plan to start on, no card required. Paid plans are Builder at £12/month and Growth at £24/month — each around 20% cheaper billed annually — and they raise the monthly limits (projects, Opportunity Radar scans, AI-drafted assets) and unlock the full Growth Backlog and the live AI visibility test. The pricing page has the full breakdown.",
  },
];

/** Static, decorative "scan result" preview for the hero — not real data. */
function ScanPreview() {
  const dims = [
    { name: "Positioning clarity", score: 78, color: "var(--signal)" },
    { name: "Conversion paths", score: 41, color: "var(--danger)" },
    { name: "Trust & proof", score: 64, color: "var(--amber)" },
    { name: "Search & AI visibility", score: 53, color: "var(--amber)" },
  ];
  // circumference of r=32 circle ≈ 201; offset for 60% fill
  const dash = 201;
  const offset = dash * (1 - 0.6);

  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-edge bg-surface p-6"
    >
      <p className="font-mono text-xs text-faint">dyslexiawrite.com</p>
      <div className="mt-4 flex items-center gap-4 border-b border-edge pb-5">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
            <circle cx="38" cy="38" r="32" fill="none" stroke="var(--surface-2)" strokeWidth="7" />
            <circle
              cx="38"
              cy="38"
              r="32"
              fill="none"
              stroke="var(--signal)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold">
            60
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-signal">Building momentum</p>
          <p className="mt-0.5 text-xs leading-relaxed text-faint">
            2 high-impact fixes found, ~4.5 hrs total
          </p>
        </div>
      </div>
      <ul className="mt-1">
        {dims.map((d) => (
          <li key={d.name} className="flex items-center justify-between py-2 text-[13px]">
            <span className="text-dim">{d.name}</span>
            <span className="flex items-center gap-2.5">
              <span className="h-[5px] w-[110px] overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${d.score}%`, background: d.color }}
                />
              </span>
              <span className="w-6 text-right font-bold">{d.score}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24">
          <div>
            <p className="text-sm text-dim">You vibe coded the app. Now vibe market it.</p>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.14] tracking-tight text-ink sm:text-4xl md:text-[2.9rem]">
              LaunchRadar: A Prioritized Plan to Find Your App&apos;s First Users
            </h1>
            {/* Plain one-sentence definition, above the fold. Rendered from
                BRAND.oneLiner so it stays word-for-word identical to the
                JSON-LD `description`. */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-dim">{BRAND.oneLiner}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Show when="signed-out">
                <Link href="/sign-up" className={`${CTA_PRIMARY} h-12 px-6 text-sm`}>
                  Get your Growth Score
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className={`${CTA_PRIMARY} h-12 px-6 text-sm`}>
                  Go to dashboard
                </Link>
              </Show>
              <Link
                href="/pricing"
                className="text-sm text-dim underline decoration-edge-hi underline-offset-4 transition-colors hover:text-ink"
              >
                See pricing
              </Link>
            </div>
            <div className="mt-8 max-w-md">
              <PlaybookSignup />
            </div>
          </div>

          <ScanPreview />
        </section>

        {/* Social proof badges */}
        <section className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 pb-16">
          <a
            href="https://www.producthunt.com/products/coded-apps/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-coded-apps"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1268546&theme=dark"
              alt="coded apps - Launchradar - Turn your vibe-coded app into a growth machine | Product Hunt"
              width={250}
              height={54}
              loading="lazy"
            />
          </a>
          <a
            href="https://www.producthunt.com/products/coded-apps/launches/coded-apps?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-coded-apps"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1195194&theme=dark&t=1788714618372"
              alt="coded apps - Vibecheck — Security scans built for AI-coded apps | Product Hunt"
              width={250}
              height={54}
              loading="lazy"
            />
          </a>
        </section>

        {/* What LaunchRadar Does */}
        <section className="mx-auto w-full max-w-6xl border-t border-edge px-6 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            What it does
          </p>
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-ink">
            A prioritized action plan, not a marketing lecture
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-dim">
            If you just launched and don&apos;t know how to find your first users, LaunchRadar gives
            you a prioritized action plan in minutes. It reads your live product, works out who it&apos;s
            for and where those people are, and hands back a ranked list of growth tasks — highest
            impact, lowest effort first — with a draft or a walkthrough for each one.
          </p>
        </section>

        {/* Who It's For */}
        <section className="mx-auto w-full max-w-6xl border-t border-edge px-6 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Who it&apos;s for</p>
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-ink">
            Built for people who can ship but haven&apos;t sold anything yet
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {AUDIENCE.map((item, i) => (
              <li key={i} className="rounded-[10px] border border-edge bg-surface p-5">
                <span className="text-xs font-bold text-signal">0{i + 1}</span>
                <p className="mt-2.5 text-sm leading-relaxed text-dim">{item}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How It Works */}
        <section className="mx-auto w-full max-w-6xl border-t border-edge px-6 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">How it works</p>
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-ink">
            From URL to ranked backlog in about a minute
          </h2>
          <div className="mt-6 flex flex-col">
            {STEPS.map((step, i) => (
              <div
                key={step.h}
                className="grid grid-cols-[36px_1fr] gap-5 border-b border-edge py-6 last:border-b-0"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-signal-dim text-sm font-bold text-signal">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink">{step.h}</h3>
                  <p className="mt-1.5 max-w-2xl leading-relaxed text-dim">{step.p}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Founders Use It */}
        <section className="mx-auto w-full max-w-6xl border-t border-edge px-6 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            Why founders use it
          </p>
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-ink">
            Not another 50-item generic checklist
          </h2>
          <div className="mt-8 flex max-w-2xl flex-col gap-6">
            {WHY.map((item) => (
              <div key={item.h} className="flex gap-3.5">
                <span className="mt-0.5 shrink-0 font-extrabold text-signal">→</span>
                <div>
                  <h3 className="font-bold text-ink">{item.h}</h3>
                  <p className="mt-1 leading-relaxed text-dim">{item.p}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-6xl border-t border-edge px-6 py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">FAQ</p>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Frequently asked questions</h2>
          <div className="mt-6 flex max-w-3xl flex-col gap-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-bold text-ink">{item.q}</h3>
                <p className="mt-1 leading-relaxed text-dim">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-faint">
            <Link href="/compare" className="font-medium text-dim underline underline-offset-2 hover:text-ink">
              See how it compares
            </Link>{" "}
            to AI content tools, generic checklists and hiring a growth marketer, or{" "}
            <Link href="/faq" className="font-medium text-dim underline underline-offset-2 hover:text-ink">
              read the full FAQ
            </Link>
            .
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="rounded-xl border border-signal-dim bg-surface px-8 py-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Get your Growth Score</h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm text-dim">
              Free scan. See your first plan in about a minute.
            </p>
            <div className="mt-6 flex justify-center">
              <Show when="signed-out">
                <Link href="/sign-up" className={`${CTA_PRIMARY} h-12 px-7 text-sm`}>
                  Get your Growth Score
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className={`${CTA_PRIMARY} h-12 px-7 text-sm`}>
                  Go to dashboard
                </Link>
              </Show>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
