"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconTarget,
  IconSearch,
  IconAntenna,
  IconSparkles,
  IconRocket,
  IconChartLine,
  IconFlask,
} from "@tabler/icons-react";

type IconComponent = (props: { size?: number; stroke?: number; className?: string }) => ReactNode;
type Item = { label: string; href: string; icon?: IconComponent };

function isItemActive(href: string, base: string, pathname: string): boolean {
  return href === base ? pathname === base : pathname.startsWith(href);
}

/**
 * One nav section with a sliding "pill" behind the active item. Desktop
 * (vertical) only — on the mobile horizontal strip the active item just gets
 * a solid background, since a vertical slide doesn't mean anything in a row.
 * Measures the real DOM (offsetTop/offsetHeight via a ResizeObserver) rather
 * than assuming a fixed row height, so it stays correct if an item ever
 * wraps or spacing changes, and re-settles on viewport-width changes too.
 */
function NavGroup({
  items,
  base,
  pathname,
}: {
  items: Item[];
  base: string;
  pathname: string;
}) {
  const activeIndex = items.findIndex((item) => isItemActive(item.href, base, pathname));
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;
    if (!el) {
      setIndicator(null);
      return;
    }

    const measure = () => setIndicator({ top: el.offsetTop, height: el.offsetHeight });
    measure();

    if (typeof ResizeObserver === "undefined" || !el.parentElement) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [activeIndex]);

  return (
    <div className="relative flex gap-1 md:flex-col">
      {indicator && (
        <div
          className="absolute left-0 hidden w-full rounded-lg bg-surface-2 md:block"
          style={{
            height: indicator.height,
            transform: `translateY(${indicator.top}px)`,
            transition: "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), height 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      )}
      {items.map((item, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={item.href}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            href={item.href}
            className={`relative z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-surface-2 text-ink md:bg-transparent [&_svg]:text-signal"
                : "text-dim hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {item.icon && <item.icon size={16} stroke={1.75} />}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function ProjectNav({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const primary: Item[] = [
    { label: "Overview", href: base, icon: IconLayoutDashboard },
    { label: "Actions", href: `${base}/actions`, icon: IconTarget },
    { label: "Visibility", href: `${base}/visibility`, icon: IconSearch },
    { label: "Radar", href: `${base}/radar`, icon: IconAntenna },
    { label: "Create", href: `${base}/create`, icon: IconSparkles },
    { label: "Launch", href: `${base}/launch`, icon: IconRocket },
  ];
  const measure: Item[] = [
    { label: "Analytics", href: `${base}/analytics`, icon: IconChartLine },
    { label: "Experiments", href: `${base}/experiments`, icon: IconFlask },
  ];

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-edge bg-surface px-4 py-3 md:h-screen md:w-56 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:px-3 md:py-6">
      <div className="hidden md:block">
        <Link
          href="/dashboard"
          className="px-3 text-sm font-extrabold tracking-wide text-ink transition-colors hover:text-dim"
        >
          LAUNCH<span className="text-signal">RADAR</span>
        </Link>
        <p className="mt-1 truncate px-3 text-sm font-semibold text-dim">
          {projectName}
        </p>
      </div>

      <div className="md:mt-6">
        <NavGroup items={primary} base={base} pathname={pathname} />
      </div>

      <div className="md:mt-6">
        <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 md:block">
          Measure
        </p>
        <NavGroup items={measure} base={base} pathname={pathname} />
      </div>
    </nav>
  );
}
