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
      className="flex h-11 items-center justify-center gap-2 rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi disabled:opacity-50"
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
