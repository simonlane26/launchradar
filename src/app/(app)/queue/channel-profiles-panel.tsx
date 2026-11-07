"use client";

import { useTransition } from "react";
import type { QueueChannel } from "@/generated/prisma/client";
import { upsertChannelProfile } from "./actions";

type ChannelRow = { channel: QueueChannel; label: string; active: boolean; maxPerWeek: number };

export function ChannelProfilesPanel({
  projects,
}: {
  projects: { id: string; name: string; profiles: ChannelRow[] }[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium">Channel profiles</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Which channels each project is actually active on, and how often — this is what keeps
        &quot;Add to this week&quot; from turning into an overwhelming list.
      </p>
      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          <details key={p.id} className="group rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              {p.name}
              <span className="text-xs text-zinc-400">
                {p.profiles.filter((c) => c.active).length} channel
                {p.profiles.filter((c) => c.active).length === 1 ? "" : "s"} active
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {p.profiles.map((row) => (
                <ChannelRow key={row.channel} projectId={p.id} row={row} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function ChannelRow({ projectId, row }: { projectId: string; row: ChannelRow }) {
  const [isPending, startTransition] = useTransition();

  const save = (active: boolean, maxPerWeek: number) => {
    startTransition(() => {
      void upsertChannelProfile({ projectId, channel: row.channel, active, maxPerWeek });
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={row.active}
          disabled={isPending}
          onChange={(e) => save(e.target.checked, row.maxPerWeek)}
        />
        {row.label}
      </label>
      {row.active && (
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          up to
          <input
            type="number"
            min={1}
            max={14}
            defaultValue={row.maxPerWeek}
            disabled={isPending}
            onBlur={(e) => save(row.active, Number(e.target.value) || 1)}
            className="h-7 w-14 rounded border border-zinc-300 px-1 text-center dark:border-zinc-700 dark:bg-zinc-900"
          />
          / week
        </label>
      )}
    </div>
  );
}
