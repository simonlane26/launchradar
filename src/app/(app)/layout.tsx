import type { ReactNode } from "react";
import { TopNav } from "./top-nav";

/** Shared chrome for the signed-in app surface above the per-project level
 *  (/dashboard, /queue). Per-project routes keep their own ProjectNav
 *  sidebar (src/app/projects/[id]/layout.tsx) — this is intentionally a
 *  separate, lighter nav, not an attempt to unify the two. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
