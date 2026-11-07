"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

function NavLink({ href, children }: { href: string; children: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={active ? "text-ink" : "text-dim transition-colors hover:text-ink"}
    >
      {children}
    </Link>
  );
}

export function TopNav() {
  return (
    <header className="border-b border-edge">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-extrabold tracking-wide text-ink transition-colors hover:text-dim"
          >
            LAUNCH<span className="text-signal">RADAR</span>
          </Link>
          <nav className="flex items-center gap-5 text-[13.5px] font-medium">
            <NavLink href="/dashboard">Projects</NavLink>
            <NavLink href="/queue">This Week</NavLink>
          </nav>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
