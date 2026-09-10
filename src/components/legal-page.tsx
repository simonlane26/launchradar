import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

/**
 * Shared shell for the three legal pages. Prose styling is inline (no
 * @tailwindcss/typography plugin in this project) — headings, paragraphs and
 * lists get spacing via the wrapper's `[&_...]` selectors.
 */
export function LegalPage({
  title,
  updated,
  current,
  children,
}: {
  title: string;
  updated: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-10">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: {updated}</p>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Legal documents">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.href === current ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                l.href === current
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-black dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <article
          className="mt-10 text-zinc-700 dark:text-zinc-300 [&_a]:font-medium [&_a]:text-black [&_a]:underline dark:[&_a]:text-zinc-100 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-black dark:[&_h2]:text-zinc-50 [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-black dark:[&_h3]:text-zinc-100 [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:leading-7 [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-zinc-200 [&_td]:p-2 dark:[&_td]:border-zinc-800 [&_th]:border [&_th]:border-zinc-200 [&_th]:p-2 [&_th]:text-left dark:[&_th]:border-zinc-800 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
        >
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
