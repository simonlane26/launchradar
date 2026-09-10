"use client";

import { useState, useTransition } from "react";
import { runVisibility, addVisibilityFindingsToBacklog, generateDimensionActions } from "./actions";
import type { DimensionKey } from "@/lib/visibility";

export function VisibilityButton({
  projectId,
  label = "Run visibility scan",
}: {
  projectId: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => runVisibility(projectId))}
      className="flex h-11 items-center justify-center rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi disabled:opacity-50"
    >
      {isPending ? "Scanning… (a few minutes)" : label}
    </button>
  );
}

export function AddFindingsButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => addVisibilityFindingsToBacklog(reportId))}
      className="flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium transition-colors hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-500"
    >
      {isPending ? "Adding…" : "Add all to Growth Backlog"}
    </button>
  );
}

export function GenerateDimensionButton({
  projectId,
  dimensionKey,
}: {
  projectId: string;
  dimensionKey: DimensionKey;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await generateDimensionActions(projectId, dimensionKey);
            setError(result.error ?? null);
          })
        }
        className="text-left text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
      >
        {isPending ? "Generating…" : "No actions yet — generate some →"}
      </button>
      {error && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {error}{" "}
          <a href="/pricing" className="font-medium underline">
            See plans
          </a>
        </span>
      )}
    </span>
  );
}
