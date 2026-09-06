"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Fetching your site…",
  "Reading your positioning…",
  "Checking marketing infrastructure…",
  "Sizing up the competition…",
  "Scoring growth readiness…",
  "Building your backlog…",
];

// Fixed blip positions (%), revealed one by one as the sweep "finds" them.
const BLIPS = [
  { top: "28%", left: "62%" },
  { top: "58%", left: "33%" },
  { top: "40%", left: "72%" },
  { top: "70%", left: "56%" },
  { top: "22%", left: "40%" },
];

export function RadarScan({
  title = "Scanning",
  overlay = false,
}: {
  title?: string;
  overlay?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [blips, setBlips] = useState(0);

  useEffect(() => {
    const s = setInterval(() => setStep((i) => (i + 1) % STEPS.length), 2200);
    const b = setInterval(() => setBlips((n) => Math.min(n + 1, BLIPS.length)), 1600);
    return () => {
      clearInterval(s);
      clearInterval(b);
    };
  }, []);

  const scope = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-56 w-56">
        {/* rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-emerald-500/25"
            style={{ transform: `scale(${1 - i * 0.28})` }}
          />
        ))}
        {/* pulsing rings */}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="lr-ping absolute inset-0 rounded-full border border-emerald-500/40"
            style={{ animationDelay: `${i * 1.2}s` }}
          />
        ))}
        {/* crosshair */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-emerald-500/15" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-emerald-500/15" />
        {/* sweep */}
        <div
          className="lr-sweep absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0) 300deg, rgba(16,185,129,0.35) 350deg, rgba(16,185,129,0.7) 360deg)",
            maskImage: "radial-gradient(circle, #000 62%, transparent 63%)",
            WebkitMaskImage: "radial-gradient(circle, #000 62%, transparent 63%)",
          }}
        />
        {/* centre dot */}
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500" />
        {/* blips */}
        {BLIPS.slice(0, blips).map((pos, i) => (
          <div
            key={i}
            className="lr-blip absolute h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.6)]"
            style={{ top: pos.top, left: pos.left }}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="font-medium text-black dark:text-zinc-50">{title}</p>
        <p className="mt-1 h-5 text-sm text-zinc-500 transition-opacity">{STEPS[step]}</p>
        {blips > 0 && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {blips} opportunit{blips === 1 ? "y" : "ies"} spotted
          </p>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-sm dark:bg-black/85">
        {scope}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
      {scope}
    </div>
  );
}
