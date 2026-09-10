"use client";

import { useRef, useState, useTransition } from "react";
import {
  IconCheck,
  IconCircleCheck,
  IconExternalLink,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import {
  completeAction,
  reopenAction,
  skipAction,
  generateActionGuide,
} from "./action-actions";
import {
  formatEffort,
  ctaLabel,
  IMPACT_DOT,
  IMPACT_HEADING,
  IMPACT_TEXT,
} from "./action-format";
import { StepChecklist } from "./step-checklist";
import { useCompleteAnimation } from "./use-complete-animation";
import type { CardAction } from "./next-action-card";

type DoneAction = { id: string; title: string; status: "DONE" | "SKIPPED" };

function BacklogCard({
  action,
  aiActionsAtLimit = false,
}: {
  action: CardAction;
  aiActionsAtLimit?: boolean;
}) {
  const [guide, setGuide] = useState<string | null>(action.guide);
  const [steps, setSteps] = useState<string[] | null>(action.steps);
  const [open, setOpen] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [guidePending, startGuide] = useTransition();
  const [mutPending, startMut] = useTransition();

  const locked = aiActionsAtLimit && !guide;
  const external = action.externalUrl;
  const cardRef = useRef<HTMLLIElement>(null);

  const { completing, collapsed, height, trigger } = useCompleteAnimation(
    () => startMut(() => completeAction(action.id)),
    cardRef,
  );

  const primaryLabel = guidePending
    ? action.deliverable === "ASSET"
      ? "Drafting…"
      : "Thinking…"
    : guide
      ? open
        ? "Hide"
        : action.deliverable === "ASSET"
          ? "View draft"
          : "View steps"
      : ctaLabel(action.deliverable);

  return (
    <li
      ref={cardRef}
      className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      style={{
        padding: collapsed ? "0 1rem" : "1rem",
        // Unbounded normally (long "Create with AI" drafts scroll inside the
        // <pre> below); only clamp to the card's current height once the
        // "mark done" animation starts, so it can transition down to 0.
        maxHeight: collapsed ? 0 : completing ? (height ?? 800) : "none",
        opacity: collapsed ? 0 : 1,
        overflow: "hidden",
        transition: "max-height 400ms ease, opacity 400ms ease, padding 400ms ease",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${IMPACT_DOT[action.impact]}`} />
          <span className={`text-[11px] font-semibold tracking-wide ${IMPACT_TEXT[action.impact]}`}>
            {IMPACT_HEADING[action.impact]}
          </span>
        </div>
        <span
          className="text-emerald-600 transition-opacity dark:text-emerald-400"
          style={{ opacity: completing ? 1 : 0 }}
        >
          <IconCheck size={16} stroke={2} />
        </span>
      </div>

      <p
        className="mt-1 font-medium transition-colors"
        style={{
          textDecoration: completing ? "line-through" : "none",
          opacity: completing ? 0.5 : 1,
        }}
      >
        {action.title}
      </p>
      <p className="text-sm text-zinc-500">
        {action.category} · {formatEffort(action.effortMinutes)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {external ? (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-signal px-4 text-xs font-semibold text-signal-ink transition-colors hover:bg-signal-hi"
          >
            Run the security check <IconExternalLink size={13} />
          </a>
        ) : locked ? (
          <a
            href="/pricing"
            className="flex h-9 items-center justify-center rounded-full border border-zinc-300 px-4 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            Upgrade for more AI actions →
          </a>
        ) : (
          <button
            type="button"
            disabled={guidePending || completing}
            onClick={() => {
              if (guide) {
                setOpen((v) => !v);
                return;
              }
              startGuide(async () => {
                const result = await generateActionGuide(action.id);
                if ("error" in result) {
                  setGuideError(result.error);
                  return;
                }
                setGuide(result.text);
                setSteps(result.steps);
                setOpen(true);
              });
            }}
            className="flex h-9 items-center justify-center rounded-full bg-signal px-4 text-xs font-semibold text-signal-ink transition-colors hover:bg-signal-hi disabled:opacity-50"
          >
            {primaryLabel}
          </button>
        )}
        <button
          type="button"
          disabled={mutPending || completing}
          onClick={trigger}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
        >
          {mutPending ? "…" : "Mark done"}
        </button>
        <button
          type="button"
          disabled={mutPending || completing}
          onClick={() => startMut(() => skipAction(action.id))}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
        >
          Skip
        </button>
      </div>

      {guideError && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {guideError}{" "}
          <a href="/pricing" className="font-medium underline">
            See plans
          </a>
        </p>
      )}

      {external
        ? action.steps && action.steps.length > 0 && <StepChecklist steps={action.steps} />
        : guide &&
          open && (
            <>
              <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-sans text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {guide}
              </pre>
              {steps && steps.length > 0 && <StepChecklist steps={steps} />}
            </>
          )}
    </li>
  );
}

function DoneRow({ action }: { action: DoneAction }) {
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-zinc-500">
        {action.status === "DONE" ? (
          <IconCircleCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <IconPlayerSkipForward size={16} />
        )}
        <span className="line-through">{action.title}</span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => reopenAction(action.id))}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
      >
        Reopen
      </button>
    </li>
  );
}

type Filter = "all" | "HIGH" | "MEDIUM" | "LOW" | "done";

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-edge-hi bg-surface-2 text-ink"
          : "border-edge text-dim hover:text-ink"
      }`}
    >
      {label} <span className="text-faint">{count}</span>
    </button>
  );
}

export function ActionList({
  openCount,
  queued,
  done,
  aiActionsAtLimit = false,
}: {
  openCount: number;
  queued: CardAction[];
  done: DoneAction[];
  aiActionsAtLimit?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  if (openCount === 0 && done.length === 0) return null;

  const byImpact = (i: "HIGH" | "MEDIUM" | "LOW") => queued.filter((a) => a.impact === i);
  const visible = filter === "all" || filter === "done" ? queued : byImpact(filter);
  const showDone = filter === "done";

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Growth Backlog ({openCount})</h2>

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={queued.length} />
        <Chip active={filter === "HIGH"} onClick={() => setFilter("HIGH")} label="High impact" count={byImpact("HIGH").length} />
        <Chip active={filter === "MEDIUM"} onClick={() => setFilter("MEDIUM")} label="Medium" count={byImpact("MEDIUM").length} />
        <Chip active={filter === "LOW"} onClick={() => setFilter("LOW")} label="Low" count={byImpact("LOW").length} />
        {done.length > 0 && (
          <Chip active={filter === "done"} onClick={() => setFilter("done")} label="Completed" count={done.length} />
        )}
      </div>

      {showDone ? (
        <ul className="flex flex-col divide-y divide-zinc-900 rounded-xl border border-edge bg-surface px-2">
          {done.map((a) => (
            <DoneRow key={a.id} action={a} />
          ))}
        </ul>
      ) : visible.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {visible.map((a) => (
            <BacklogCard key={a.id} action={a} aiActionsAtLimit={aiActionsAtLimit} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">
          {filter === "all"
            ? "Nothing open — re-analyze from the Overview to refill the backlog."
            : "Nothing in the backlog at this impact level."}
        </p>
      )}
    </section>
  );
}
