import Link from "next/link";

/** Shared footer for the public marketing + legal pages. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const link = "text-faint transition-colors hover:text-ink";

  return (
    <footer className="border-t border-edge px-6 py-8 text-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-faint">
          © {year} IGNISTECH LTD
          <span className="hidden sm:inline">
            {" "}
            · Registered in England &amp; Wales no. 16892976
          </span>
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/compare" className={link}>
            Compare
          </Link>
          <Link href="/faq" className={link}>
            FAQ
          </Link>
          <Link href="/pricing" className={link}>
            Pricing
          </Link>
          <Link href="/privacy" className={link}>
            Privacy
          </Link>
          <Link href="/terms" className={link}>
            Terms
          </Link>
          <Link href="/cookies" className={link}>
            Cookies
          </Link>
          <a href="mailto:launchradar@outlook.com" className={link}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
