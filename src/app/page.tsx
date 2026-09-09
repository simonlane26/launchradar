import type { Metadata } from "next";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import RadarBackground from "@/components/radar-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlaybookSignup } from "@/components/playbook-signup";
import { BRAND } from "@/lib/seo";

const META_TITLE = "LaunchRadar: A Prioritized Plan to Find Your App's First Users";
// Same one-sentence definition as the hero subheadline and the JSON-LD
// `description`, so the page's visible and machine-readable definitions match.
const META_DESCRIPTION = BRAND.oneLiner;

// Primary CTA skin — a vibrant accent (the app's radar/emerald) so the main
// action reads as the main action against the outline + text links beside it.
// emerald-700 on white clears WCAG AA; hover brightens to emerald-600.
// Compose with per-placement sizing (`h-* px-* text-*`).
const CTA_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-emerald-700 font-medium text-white shadow-sm transition-colors hover:bg-emerald-600";

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

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <section className="relative flex min-h-[66vh] items-center justify-center overflow-hidden px-6 py-16">
          <RadarBackground offsetX="10%" offsetY="-6%" />
          <div className="relative z-[1] flex w-full max-w-2xl flex-col items-center gap-6 text-center">
            <p className="text-sm font-medium tracking-wide text-zinc-500">
              You vibe coded the app. Now vibe market it.
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl md:text-[2.75rem] md:leading-[1.15] dark:text-zinc-50">
              LaunchRadar: A Prioritized Plan to Find Your App&apos;s First Users
            </h1>
            {/* Plain one-sentence definition, directly under the H1 and above the
                fold. Rendered from BRAND.oneLiner so it stays word-for-word
                identical to the JSON-LD `description`. */}
            <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {BRAND.oneLiner}
            </p>
            <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
              <Show when="signed-out">
                <Link href="/sign-up" className={`${CTA_PRIMARY} h-12 px-8 text-base`}>
                  Get your Growth Score
                </Link>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className={`${CTA_PRIMARY} h-12 px-8 text-base`}>
                  Go to dashboard
                </Link>
              </Show>
              <Link
                href="/pricing"
                className="text-base font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                See pricing
              </Link>
            </div>

            <PlaybookSignup />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            What LaunchRadar Does
          </h2>
          <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">
            If you just launched and don&apos;t know how to find your first users, LaunchRadar gives
            you a prioritized action plan in minutes. It reads your live product, works out who it&apos;s
            for and where those people are, and hands back a ranked list of growth tasks — highest
            impact, lowest effort first — with a draft or a walkthrough for each one.
          </p>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Who It&apos;s For
          </h2>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 leading-7 text-zinc-600 dark:text-zinc-400">
            <li>Indie and solo founders who can build a product but have never run a marketing plan.</li>
            <li>
              AI-assisted and no-code builders who shipped fast and skipped the &ldquo;figure out
              distribution&rdquo; step.
            </li>
            <li>Anyone with a live app stuck near zero users who wants a clear next move, not more theory.</li>
          </ul>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            How It Works
          </h2>
          <div className="mt-6 flex flex-col gap-6">
            {STEPS.map((step) => (
              <div key={step.h}>
                <h3 className="font-medium text-black dark:text-zinc-100">{step.h}</h3>
                <p className="mt-1 leading-7 text-zinc-600 dark:text-zinc-400">{step.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Why Founders Use It
          </h2>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 leading-7 text-zinc-600 dark:text-zinc-400">
            <li>
              <strong className="font-medium text-black dark:text-zinc-100">
                It&apos;s specific to your product.
              </strong>{" "}
              A consumer app, a B2B tool and a developer product get different plans — not the same
              50-item checklist.
            </li>
            <li>
              <strong className="font-medium text-black dark:text-zinc-100">
                It tells you what to skip.
              </strong>{" "}
              LaunchRadar calls out the channels that won&apos;t work for you so you don&apos;t waste
              weeks on them.
            </li>
            <li>
              <strong className="font-medium text-black dark:text-zinc-100">
                It&apos;s plain-language and fast.
              </strong>{" "}
              Every task says what to do, why, and how long it takes. Your first plan is ready in
              about a minute.
            </li>
          </ul>
          <div className="mt-6">
            <Show when="signed-out">
              <Link href="/sign-up" className={`${CTA_PRIMARY} h-11 px-6 text-sm`}>
                Get your plan
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={`${CTA_PRIMARY} h-11 px-6 text-sm`}>
                Go to dashboard
              </Link>
            </Show>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-24">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Frequently asked questions
          </h2>
          <div className="mt-6 flex flex-col gap-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-black dark:text-zinc-100">{item.q}</h3>
                <p className="mt-1 leading-7 text-zinc-600 dark:text-zinc-400">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-zinc-500">
            <Link href="/compare" className="font-medium underline hover:text-black dark:hover:text-zinc-100">
              See how it compares
            </Link>{" "}
            to AI content tools, generic checklists and hiring a growth marketer, or{" "}
            <Link href="/faq" className="font-medium underline hover:text-black dark:hover:text-zinc-100">
              read the full FAQ
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
