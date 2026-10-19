import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { GUIDES } from "./guides-data";

const TITLE = "Guides for indie and no-code founders";
const DESCRIPTION =
  "Practical, no-budget playbooks for finding your first users, launching on the right platforms, and growing a vibe-coded app without a marketing background.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/guides"), type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function GuidesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-10">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Guides</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          Guides for indie and no-code founders
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          No ad budget, no growth team, no problem — practical playbooks for the part after you ship.
        </p>

        <ul className="mt-12 flex flex-col gap-4">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="group block rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <p className="text-lg font-medium text-black group-hover:underline dark:text-zinc-50">
                  {g.title}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{g.description}</p>
                <span className="mt-3 inline-block text-sm font-medium text-zinc-500">
                  Read the guide →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
