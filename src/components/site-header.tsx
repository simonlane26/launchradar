import Link from "next/link";
import { Show } from "@clerk/nextjs";

/** Minimal top bar for the public marketing pages (landing, pricing). */
export function SiteHeader() {
  const linkClass =
    "text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100";

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link
        href="/"
        className="text-sm font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        LaunchRadar
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
        <Link href="/compare" className={`hidden sm:inline ${linkClass}`}>
          Compare
        </Link>
        <Link href="/faq" className={`hidden sm:inline ${linkClass}`}>
          FAQ
        </Link>
        <Link href="/pricing" className={linkClass}>
          Pricing
        </Link>
        <Show when="signed-out">
          <Link href="/sign-in" className={linkClass}>
            Sign in
          </Link>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard" className={linkClass}>
            Dashboard
          </Link>
        </Show>
      </nav>
    </header>
  );
}
