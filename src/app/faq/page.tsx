import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { FAQ_FLAT, FAQ_SECTIONS } from "./faq-data";

const TITLE = "LaunchRadar FAQ — how the AI growth agent works";
const DESCRIPTION =
  "Answers to common questions about LaunchRadar: what the Growth Score is, how Opportunity Radar finds customers, how it compares to AI content tools and marketing checklists, pricing, and data privacy.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/faq"),
    type: "website",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

function paragraphs(answer: string) {
  return answer.split("\n\n");
}

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <JsonLd
        data={[
          faqPageJsonLd(FAQ_FLAT),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-10">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">FAQ</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          Questions about LaunchRadar
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          LaunchRadar is an AI growth agent for vibe-coded apps: give it your URL and it tells you
          who needs your product, where those people are, and what to do this week to reach them.
          Here is how it works in practice.
        </p>

        <nav className="mt-10 flex flex-wrap gap-2" aria-label="FAQ sections">
          {FAQ_SECTIONS.map((section) => (
            <a
              key={section.heading}
              href={`#${slug(section.heading)}`}
              className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:border-zinc-500 hover:text-black dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {section.heading}
            </a>
          ))}
        </nav>

        <div className="mt-12 flex flex-col gap-14">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.heading} id={slug(section.heading)} className="scroll-mt-24">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {section.heading}
              </h2>
              <dl className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
                {section.items.map((item) => (
                  <div key={item.q} className="py-5">
                    <dt className="text-lg font-medium text-black dark:text-zinc-50">{item.q}</dt>
                    <dd className="mt-2 flex flex-col gap-3 text-zinc-600 dark:text-zinc-400">
                      {paragraphs(item.a).map((p, i) => (
                        <p key={i} className="leading-7">
                          {p}
                        </p>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium">Still deciding?</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
            See how LaunchRadar stacks up against AI content tools, generic checklists and hiring a
            growth marketer — or just run your URL and read the Growth Score.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
            >
              Get your Growth Score
            </Link>
            <Link
              href="/compare"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              Compare the alternatives
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
