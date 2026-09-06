import Link from "next/link";
import { Show } from "@clerk/nextjs";
import RadarBackground from "@/components/radar-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlaybookSignup } from "@/components/playbook-signup";

const STEPS = [
  {
    h: "1. Point it at your URL",
    p: "LaunchRadar reads your live site, works out your category, ideal customer and positioning, and runs deterministic technical checks. No long onboarding form.",
  },
  {
    h: "2. Get a Growth Score and a ranked backlog",
    p: "A 0–100 readiness score across six dimensions, plus a prioritised list of the specific moves that matter for your product — highest impact, lowest effort first.",
  },
  {
    h: "3. Work the plan",
    p: "Every task comes with a draft or a step-by-step walkthrough. Opportunity Radar finds people already asking for what you built; Launch Mode turns it into a 30-day campaign.",
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
              LaunchRadar helps indie and AI-assisted founders find their first users with a
              prioritised, step-by-step growth plan.
            </h1>
            <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Give LaunchRadar your product&apos;s URL and get back a ranked backlog of growth tasks
              tailored to what you built — not a generic marketing checklist.
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

            <a
              href="https://www.producthunt.com/products/coded-apps/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-coded-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1"
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

            <PlaybookSignup />
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            How LaunchRadar works
          </h2>
          <ol className="mt-6 flex flex-col gap-6">
            {STEPS.map((step) => (
              <li key={step.h}>
                <h3 className="font-medium text-black dark:text-zinc-100">{step.h}</h3>
                <p className="mt-1 leading-7 text-zinc-600 dark:text-zinc-400">{step.p}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-24">
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            A growth plan built for vibe coders, not a 50-item checklist
          </h2>
          <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">
            Most tools hand every founder the same generic marketing checklist. LaunchRadar tailors
            the plan to your actual product — a consumer app, a B2B tool and a developer product need
            completely different channels — and it will tell you which channels to skip.
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            <Link href="/compare" className="font-medium underline hover:text-black dark:hover:text-zinc-100">
              See how it compares
            </Link>{" "}
            to AI content tools, generic checklists and hiring a growth marketer, or{" "}
            <Link href="/faq" className="font-medium underline hover:text-black dark:hover:text-zinc-100">
              read the FAQ
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
