import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, breadcrumbJsonLd, howToJsonLd } from "@/lib/seo";
import { GUIDES, getGuide } from "../guides-data";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
      title: g.title,
      description: g.description,
      url: absoluteUrl(`/guides/${g.slug}`),
      type: "article",
    },
    twitter: { card: "summary", title: g.title, description: g.description },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: g.title, path: `/guides/${g.slug}` },
          ]),
          howToJsonLd({ name: g.title, description: g.description, steps: g.steps }),
        ]}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-24 pt-10">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-black dark:hover:text-zinc-100"
        >
          <IconArrowLeft size={14} /> All guides
        </Link>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          {g.title}
        </h1>

        <div className="mt-8 flex flex-col gap-4 text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          {g.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {g.steps.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
                {s.title}
              </h2>
              <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium">{g.ctaHeading}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{g.ctaBody}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/sign-up?utm_source=guide&utm_medium=cta&utm_campaign=${g.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
            >
              {g.ctaLabel}
            </Link>
          </div>
        </div>

        {(() => {
          const others = GUIDES.filter((o) => o.slug !== g.slug);
          if (others.length === 0) return null;
          return (
            <nav className="mt-12" aria-label="Other guides">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                More guides
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/guides/${o.slug}`}
                      className="text-sm font-medium text-zinc-600 underline transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      {o.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          );
        })()}
      </main>
      <SiteFooter />
    </div>
  );
}
