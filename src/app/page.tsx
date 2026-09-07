import type { Metadata } from "next";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import RadarBackground from "@/components/radar-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlaybookSignup } from "@/components/playbook-signup";

const META_TITLE = "LaunchRadar: A Prioritized Plan to Find Your App's First Users";
const META_DESCRIPTION =
  "LaunchRadar turns your new app into a step-by-step user-acquisition plan — built for indie and AI-assisted founders who need traction, not more marketing theory.";

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
    q: "What does LaunchRadar actually do?",
    a: "LaunchRadar generates a prioritised action plan for finding your first users, based on your product, your stage, and how much time you have. It’s built specifically for solo founders and small teams who shipped fast with AI or no-code tools and skipped the “figure out marketing” step.",
  },
  {
    q: "Who is LaunchRadar for?",
    a: "Solo and small-team founders — especially “vibe coders” who used AI tools to build their product quickly. If you have a live product but no clear plan for getting users, that’s who this is for.",
  },
  {
    q: "How is this different from generic marketing advice?",
    a: "Generic advice tells you to “post on Twitter” or “do SEO” with no context. LaunchRadar looks at where you actually are — pre-launch, just launched, stuck at zero users — and tells you the three to five things worth doing right now, in order, based on your specific situation.",
  },
  {
    q: "Do I need a marketing background to use it?",
    a: "No. LaunchRadar is built for people who can build a product but have never run a marketing plan in their life. Everything is plain-language: what to do, why, and how long it should take.",
  },
  {
    q: "Is this a course or a tool?",
    a: "It’s a tool. You get a plan, not a curriculum. No videos to sit through — just a prioritised list you can act on the same day.",
  },
  {
    q: "How much does it cost?",
    a: "There’s a free plan to start on, no card required. Paid plans are Builder at £12/month and Growth at £24/month — each around 20% cheaper billed annually — and they raise the monthly limits (projects, Opportunity Radar scans, AI-drafted assets) and unlock the full Growth Backlog and the live AI visibility test. The pricing page has the full breakdown.",
  },
  {
    q: "How long does it take to get my plan?",
    a: "Usually under a minute. You give LaunchRadar your URL, it reads your live site and runs its checks, and your Growth Score and ranked plan are ready in about 30–60 seconds — there’s no long onboarding form.",
  },
  {
    q: "Can I use this if I haven’t launched yet?",
    a: "Yes. LaunchRadar works for pre-launch, just-launched, and stuck-at-zero-users founders — the plan adjusts based on where you are.",
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
            <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              LaunchRadar turns your new app into a step-by-step user-acquisition plan — built for
              indie and AI-assisted founders who need traction, not more marketing theory.
            </p>
            <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
              <Show when="signed-out">
                <Link
                  href="/sign-up"
                  className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                >
                  Get your Growth Score
                </Link>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                >
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
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Get your plan
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
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
