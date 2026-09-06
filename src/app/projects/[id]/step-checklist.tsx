"use client";

import { useState } from "react";

/**
 * Checkable steps for a "Show me how" walkthrough. Lives inside a
 * conditionally-rendered block in the parent (`{open && <StepChecklist .../>}`),
 * so it mounts fresh every time the card is opened — the stagger-in
 * (`.lr-step-in`, globals.css) naturally replays on every open rather than
 * only the first, which reads as a small reward each time rather than a bug.
 */
export function StepChecklist({ steps }: { steps: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ul className="mt-3 flex flex-col">
      {steps.map((step, i) => {
        const done = checked.has(i);
        return (
          <li
            key={i}
            className="lr-step-in flex items-start gap-2 py-1.5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <input
              type="checkbox"
              checked={done}
              onChange={() => toggle(i)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-black dark:accent-white"
            />
            <span
              className={`text-sm ${
                done ? "text-zinc-400 line-through" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
