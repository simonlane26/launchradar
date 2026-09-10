import Link from "next/link";
import { Show } from "@clerk/nextjs";

/** Top bar for the public marketing pages (landing, pricing, FAQ, compare). */
export function SiteHeader() {
  const linkClass = "text-dim transition-colors hover:text-ink";

  return (
    <header className="border-b border-edge">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-extrabold tracking-wide text-ink">
          LAUNCH<span className="text-signal">RADAR</span>
        </Link>
        <nav className="flex items-center gap-5 text-[13.5px] font-medium sm:gap-7">
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
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-signal px-4 text-[13px] font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
            >
              Get your Growth Score
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-signal px-4 text-[13px] font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
            >
              Dashboard
            </Link>
          </Show>
        </nav>
      </div>
    </header>
  );
}
