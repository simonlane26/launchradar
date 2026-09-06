"use client";

import { useTransition } from "react";
import { rerunAnalysis } from "./actions";
import { RadarScan } from "@/components/radar-scan";

export function RerunButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {isPending && <RadarScan title="Re-scanning your site" overlay />}
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => rerunAnalysis(projectId))}
        className="flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium transition-colors hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-500"
      >
        {isPending ? "Re-analyzing…" : "Re-analyze"}
      </button>
    </>
  );
}
