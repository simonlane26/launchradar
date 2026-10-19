"use client";

import { useState, useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  runVisibility,
  addVisibilityFindingsToBacklog,
  generateDimensionActions,
  connectSearchConsole,
} from "./actions";
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
  const [result, setResult] = useState<{ error?: string; upgrade?: boolean } | null>(null);
  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(await generateDimensionActions(projectId, dimensionKey));
          })
        }
        className="text-left text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
      >
        {isPending ? "Generating…" : "No actions yet — generate some →"}
      </button>
      {result?.error && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {result.error}{" "}
          {result.upgrade && (
            <a href="/pricing" className="font-medium underline">
              See plans
            </a>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * Connects a project to the founder's Google Search Console. Google itself
 * is connected via Clerk's own account UI (`openUserProfile()` — Clerk
 * hosts the OAuth consent screen and holds the token, nothing Google-side
 * is stored here); this button then resolves which verified property
 * matches the project's domain. Tries the resolve step first — if Google's
 * already connected from a prior visit, it succeeds immediately with no
 * extra click.
 */
export function GscConnectButton({ projectId, gated }: { projectId: string; gated: boolean }) {
  const { openUserProfile } = useClerk();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; siteUrl?: string } | null>(null);

  const needsGoogleConnect = result?.error?.startsWith("Connect Google");

  if (result?.siteUrl) {
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400">
        Connected to {result.siteUrl} — real data will show up on the next scan.
      </p>
    );
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending || gated}
        onClick={() => startTransition(async () => setResult(await connectSearchConsole(projectId)))}
        className="text-left text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
      >
        {isPending ? "Connecting…" : "Connect Search Console for real ranking data →"}
      </button>
      {gated && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          <a href="/pricing" className="font-medium underline">
            Upgrade
          </a>{" "}
          to ground this score in real Google data.
        </span>
      )}
      {result?.error && !gated && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {result.error}{" "}
          {needsGoogleConnect && (
            <button
              type="button"
              onClick={() => openUserProfile()}
              className="font-medium underline"
            >
              Connect Google
            </button>
          )}
        </span>
      )}
    </span>
  );
}
