"use client";

import { useState, useTransition } from "react";
import { IconTarget, IconCheck, IconExternalLink } from "@tabler/icons-react";
import { completeAction, generateActionGuide } from "./action-actions";
import {
  formatEffort,
  ctaLabel,
  IMPACT_DOT,
  IMPACT_HEADING,
  IMPACT_TEXT,
} from "./action-format";
import { StepChecklist } from "./step-checklist";
import { useCompleteAnimation } from "./use-complete-animation";
import type { ActionImpact, ActionDeliverable } from "@/generated/prisma/client";

export type CardAction = {
  id: string;
  title: string;
  category: string;
  rationale: string;
  detail: string;
  impact: ActionImpact;
  deliverable: ActionDeliverable;
  effortMinutes: number;
  guide: string | null;
  steps: string[] | null;
  visibilityDimension: string | null;
  externalUrl: string | null;
};

export function NextBestActionCard({
  action,
  aiActionsAtLimit = false,
}: {
  action: CardAction;
  aiActionsAtLimit?: boolean;
}) {
  const [guide, setGuide] = useState<string | null>(action.guide);
  const [steps, setSteps] = useState<string[] | null>(action.steps);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [guidePending, startGuide] = useTransition();
  const [completePending, startComplete] = useTransition();

  const locked = aiActionsAtLimit && !guide;
  const external = action.externalUrl;

  const { completing, collapsed, trigger } = useCompleteAnimation(() =>
    startComplete(() => completeAction(action.id)),
  );

  return (
    <section
      className="rounded-2xl border border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950"
      style={{
        padding: collapsed ? "0 1.5rem" : "1.5rem",
        maxHeight: collapsed ? 0 : 900,
        opacity: collapsed ? 0 : 1,
        overflow: "hidden",
        transition: "max-height 400ms ease, opacity 400ms ease, padding 400ms ease",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
          <IconTarget size={16} stroke={1.75} />
          Your next best action
        </p>
        <span
          className="text-emerald-600 transition-opacity dark:text-emerald-400"
          style={{ opacity: completing ? 1 : 0 }}
        >
          <IconCheck size={20} stroke={2} />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${IMPACT_DOT[action.impact]}`} />
        <span className={`text-xs font-semibold tracking-wide ${IMPACT_TEXT[action.impact]}`}>
          {IMPACT_HEADING[action.impact]}
        </span>
      </div>

      <h2
        className="mt-1 text-xl font-semibold tracking-tight transition-colors"
        style={{
          textDecoration: completing ? "line-through" : "none",
          color: completing ? "var(--foreground)" : undefined,
          opacity: completing ? 0.5 : 1,
        }}
      >
        {action.title}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {action.category} · {formatEffort(action.effortMinutes)}
      </p>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-500">Why: </span>
        {action.rationale}
      </p>

      {!external && guide && (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-sans text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {guide}
        </pre>
      )}
      {external
        ? action.steps && action.steps.length > 0 && <StepChecklist steps={action.steps} />
        : guide && steps && steps.length > 0 && <StepChecklist steps={steps} />}

      {guideError && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {guideError}{" "}
          <a href="/pricing" className="font-medium underline">
            See plans
          </a>
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {external ? (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Run the security check <IconExternalLink size={14} />
          </a>
        ) : locked ? (
          <a
            href="/pricing"
            className="flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            Upgrade for more AI actions →
          </a>
        ) : (
          <button
            type="button"
            disabled={guidePending || completing}
            onClick={() =>
              startGuide(async () => {
                const result = await generateActionGuide(action.id);
                if ("error" in result) {
                  setGuideError(result.error);
                  return;
                }
                setGuide(result.text);
                setSteps(result.steps);
              })
            }
            className="flex h-10 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {guidePending
              ? action.deliverable === "ASSET"
                ? "Drafting…"
                : "Thinking…"
              : guide
                ? "Regenerate"
                : ctaLabel(action.deliverable)}
          </button>
        )}
        <button
          type="button"
          disabled={completePending || completing}
          onClick={trigger}
          className="flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium transition-colors hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-500"
        >
          {completePending ? "Saving…" : "Mark complete"}
        </button>
      </div>
    </section>
  );
}
