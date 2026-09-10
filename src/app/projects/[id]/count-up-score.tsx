"use client";

import { useEffect, useState } from "react";

/** red → amber → emerald as the number climbs. */
function colorFor(score: number): string {
  if (score < 34) return "#e85b5b";
  if (score < 67) return "#e8834b";
  return "#39d982";
}

export function CountUpScore({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0 : durationMs;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <span style={{ color: colorFor(display), transition: "color 120ms linear" }}>{display}</span>
  );
}
