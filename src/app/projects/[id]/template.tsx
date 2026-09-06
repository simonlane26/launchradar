import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation between project sub-pages (Overview, Score,
 * Radar, …), so its mount animation replays — a 150ms fade/slide that makes
 * switching pages feel like one surface rather than a hard swap. The sidebar
 * lives in layout.tsx and stays put.
 */
export default function ProjectTemplate({ children }: { children: ReactNode }) {
  return <div className="lr-page-in">{children}</div>;
}
