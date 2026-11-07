"use client";

import { useMemo, useState, useTransition } from "react";
import type { QueueChannel } from "@/generated/prisma/client";
import type { EligibleDraft } from "@/lib/queue";
import { CHANNEL_LABEL } from "@/lib/queue";
import { addToQueue } from "./actions";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function weekDays(weekStartIso: string): { label: string; date: Date }[] {
  const start = new Date(weekStartIso);
  return DAY_LABELS.map((label, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { label, date: d };
  });
}

export function AddToQueuePanel({
  drafts,
  projectChannels,
  weekStart,
}: {
  drafts: EligibleDraft[];
  projectChannels: { projectId: string; channels: QueueChannel[] }[];
  weekStart: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [draftKey, setDraftKey] = useState("");
  const [channel, setChannel] = useState<QueueChannel | "">("");
  const [dayIndex, setDayIndex] = useState(0);
  const [result, setResult] = useState<{ error?: string; warning?: string } | null>(null);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const selected = drafts.find((d) => `${d.kind}:${d.id}` === draftKey);
  const availableChannels = selected
    ? projectChannels.find((p) => p.projectId === selected.projectId)?.channels ?? []
    : [];

  if (drafts.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="text-base font-medium text-black dark:text-zinc-50">Add to this week</h2>
        <p className="mt-1">
          No drafted content waiting yet — generate an asset from a project&apos;s Actions, or draft a
          reply from Radar, and it&apos;ll show up here to schedule.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-medium">Add to this week</h2>
      <div className="mt-4 flex flex-col gap-3">
        <select
          value={draftKey}
          onChange={(e) => {
            setDraftKey(e.target.value);
            setChannel("");
          }}
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Pick a drafted post…</option>
          {drafts.map((d) => (
            <option key={`${d.kind}:${d.id}`} value={`${d.kind}:${d.id}`}>
              {d.projectName}: {d.title}
            </option>
          ))}
        </select>

        {selected && (
          <div className="flex flex-wrap gap-3">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as QueueChannel)}
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Channel…</option>
              {availableChannels.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
            {availableChannels.length === 0 && (
              <p className="self-center text-xs text-amber-600 dark:text-amber-400">
                No active channels set up for this project yet — add one below.
              </p>
            )}

            <select
              value={dayIndex}
              onChange={(e) => setDayIndex(Number(e.target.value))}
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {days.map((d, i) => (
                <option key={d.label} value={i}>
                  {d.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isPending || !channel}
              onClick={() =>
                startTransition(async () => {
                  const r = await addToQueue({
                    projectId: selected.projectId,
                    actionId: selected.kind === "action" ? selected.id : undefined,
                    opportunityId: selected.kind === "opportunity" ? selected.id : undefined,
                    channel: channel as QueueChannel,
                    scheduledFor: days[dayIndex]!.date,
                  });
                  setResult(r);
                  if (!r.error) {
                    setDraftKey("");
                    setChannel("");
                  }
                })
              }
              className="h-10 rounded-full bg-signal px-5 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
          </div>
        )}
        {result?.error && <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>}
        {result?.warning && <p className="text-xs text-amber-600 dark:text-amber-400">{result.warning}</p>}
      </div>
    </section>
  );
}
