"use client";

import { useActionState } from "react";
import { analyzeUrl } from "./actions";
import { RadarScan } from "@/components/radar-scan";

export function AnalyzeForm({ atCap = false }: { atCap?: boolean }) {
  const [state, formAction, isPending] = useActionState(analyzeUrl, {
    error: null as string | null,
  });

  if (isPending) {
    return <RadarScan title="Scanning your site" />;
  }

  if (atCap) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        You&apos;ve used all your project slots on this plan.{" "}
        <a href="/pricing" className="font-medium underline">
          Upgrade to add more →
        </a>
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          type="text"
          name="url"
          placeholder="https://yourapp.com"
          required
          className="h-12 w-full rounded-full border border-zinc-300 bg-white px-5 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.error && (
          <p className="mt-2 pl-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        className="flex h-12 items-center justify-center rounded-full bg-signal px-8 text-base font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
      >
        Get your Growth Score
      </button>
    </form>
  );
}
