"use client";

import { useTransition } from "react";
import { IconRocket } from "@tabler/icons-react";
import { generateLaunchPlan } from "./actions";

export function LaunchButton({
  projectId,
  label = "Build my 30-day launch plan",
}: {
  projectId: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => generateLaunchPlan(projectId))}
      className="flex h-11 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {isPending ? (
        "Building your plan…"
      ) : (
        <>
          <IconRocket size={16} />
          {label}
        </>
      )}
    </button>
  );
}
