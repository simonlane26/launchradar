import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { COMPARISONS, getComparison } from "../compare-data";

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  return {
    title: { absolute: c.metaTitle ?? c.title },
    description: c.summary,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: {
      title: c.metaTitle ?? c.title,
      description: c.summary,
      url: absoluteUrl(`/compare/${c.slug}`),
      type: "article",
    },
    twitter: { card: "summary", title: c.metaTitle ?? c.title, description: c.summary },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            { name: c.alternative, path: `/compare/${c.slug}` },
          ]),
          faqPageJsonLd([
            {
              q: `When should I choose ${c.alternative} over LaunchRadar?`,
              a: c.chooseAlternativeWhen.join(" "),
            },
            {
              q: `When is LaunchRadar the better choice?`,
              a: c.chooseLaunchRadarWhen.join(" "),
            },
          ]),
        ]}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-10">
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-black dark:hover:text-zinc-100"
        >
          <IconArrowLeft size={14} /> All comparisons
        </Link>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          {c.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">{c.summary}</p>

        <div className="mt-10 flex flex-col gap-4 text-zinc-700 dark:text-zinc-300">
          {c.body.map((p, i) => (
            <p key={i} className="leading-7">
              {p}
            </p>
          ))}
        </div>

        {c.featureTable && (
          <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Feature</th>
                  <th className="bg-zinc-50 px-4 py-3 text-left font-semibold dark:bg-zinc-900">
                    LaunchRadar
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">{c.alternative}</th>
                </tr>
              </thead>
              <tbody>
                {c.featureTable.map((row) => (
                  <tr key={row.feature} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      {row.feature}
                    </td>
                    <td className="bg-zinc-50 px-4 py-3 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      {row.launchradar}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.rival}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {c.verdict && (
          <p className="mt-6 leading-7 text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold">Verdict: </span>
            {c.verdict}
          </p>
        )}

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Choose {c.alternative} when
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {c.chooseAlternativeWhen.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-zinc-900 bg-white p-5 dark:border-zinc-100 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Choose LaunchRadar when
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {c.chooseLaunchRadarWhen.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <IconCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium">See what LaunchRadar says about your product.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
            Run your URL for a Growth Score and a tailored backlog — Free plan, no card, one
            project.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
            >
              {c.ctaLabel ?? "Get your Growth Score"}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              See pricing
            </Link>
          </div>
        </div>

        <nav className="mt-12" aria-label="Other comparisons">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Other comparisons
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {COMPARISONS.filter((o) => o.slug !== c.slug).map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/compare/${o.slug}`}
                  className="text-sm font-medium text-zinc-600 underline transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
