import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck, IconMinus, IconCircleDashed } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import { COMPARISONS, MATRIX_COLUMNS, MATRIX_ROWS } from "./compare-data";

const TITLE = "LaunchRadar vs the alternatives — honest comparison";
const DESCRIPTION =
  "How LaunchRadar compares to AI social media managers, generic marketing checklists, hiring a growth marketer, and asking ChatGPT or Claude for a plan — with a feature matrix and when to pick each.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/compare" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/compare"), type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

function Mark({ cell }: { cell: "yes" | "no" | "partial" }) {
  if (cell === "yes")
    return <IconCheck size={16} className="mx-auto text-emerald-600 dark:text-emerald-400" aria-label="Yes" />;
  if (cell === "partial")
    return (
      <IconCircleDashed size={16} className="mx-auto text-amber-500" aria-label="Partial" />
    );
  return <IconMinus size={16} className="mx-auto text-zinc-300 dark:text-zinc-700" aria-label="No" />;
}

export default function ComparePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <JsonLd
        data={[
          softwareApplicationJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
          faqPageJsonLd(
            COMPARISONS.map((c) => ({
              q: `${c.title}: which should I use?`,
              a: `${c.summary} Choose ${c.alternative} when: ${c.chooseAlternativeWhen.join("; ")}. Choose LaunchRadar when: ${c.chooseLaunchRadarWhen.join("; ")}.`,
            })),
          ),
        ]}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-24 pt-10">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Compare</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          LaunchRadar vs the alternatives
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          If you vibe coded a product and now need users, you have a few options: an AI content
          tool, a generic checklist, hiring a growth marketer, or asking a chatbot for a plan.
          Here is how LaunchRadar differs from each — including where another option is the better
          call.
        </p>

        <section className="mt-14">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            At a glance
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Capability</th>
                  {MATRIX_COLUMNS.map((col, i) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-center font-semibold ${
                        i === 0 ? "bg-zinc-50 dark:bg-zinc-900" : ""
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.label}</td>
                    {row.values.map((cell, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 text-center ${
                          i === 0 ? "bg-zinc-50 dark:bg-zinc-900" : ""
                        }`}
                      >
                        <Mark cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            <IconCheck size={12} className="inline" /> yes &nbsp;
            <IconCircleDashed size={12} className="inline text-amber-500" /> partial / depends &nbsp;
            <IconMinus size={12} className="inline" /> no
          </p>
        </section>

        <section className="mt-16 flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Head to head
          </h2>
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <p className="text-lg font-medium text-black group-hover:underline dark:text-zinc-50">
                {c.title}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.summary}</p>
              <span className="mt-3 inline-block text-sm font-medium text-zinc-500">
                Read the comparison →
              </span>
            </Link>
          ))}
        </section>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium">The fastest way to decide is to run your URL.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
            You get a Growth Score and a tailored backlog on the Free plan — no card, one project.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
            >
              Get your Growth Score
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
