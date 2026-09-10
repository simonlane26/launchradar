"use client";

import { useState, useTransition } from "react";
import { IconAntenna, IconSparkles, IconThumbUp, IconThumbDown } from "@tabler/icons-react";
import { runScan, updateProfile, draftReply, giveFeedback, markStatus } from "./actions";
import type { Profile } from "@/lib/radar";

export function ScanButton({
  projectId,
  label,
  atLimit = false,
}: {
  projectId: string;
  label?: string;
  atLimit?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (atLimit) {
    return (
      <a
        href="/pricing"
        className="flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
      >
        <IconAntenna size={16} />
        Scan limit reached — upgrade →
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => runScan(projectId))}
      className="flex h-11 items-center justify-center gap-2 rounded-full bg-signal px-6 text-sm font-semibold text-signal-ink transition-colors hover:bg-signal-hi disabled:opacity-50"
    >
      {isPending ? (
        "Scanning… (a few minutes)"
      ) : (
        <>
          <IconAntenna size={16} />
          {label ?? "Scan for opportunities"}
        </>
      )}
    </button>
  );
}

function toLines(items: string[]): string {
  return items.join("\n");
}
function fromLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function ProfileEditor({ projectId, profile }: { projectId: string; profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    audiences: toLines(profile.audiences),
    problems: toLines(profile.problems),
    alternatives: toLines(profile.alternatives),
    commercialIntents: toLines(profile.commercialIntents),
  });

  if (!editing) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <ProfileList label="Who experiences the problem" items={profile.audiences} />
        <ProfileList label="Problems, in their own words" items={profile.problems} />
        <ProfileList label="Alternatives" items={profile.alternatives} />
        <ProfileList label="Buying-intent situations" items={profile.commercialIntents} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-start text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <ProfileField
        label="Who experiences the problem (one per line)"
        value={form.audiences}
        onChange={(v) => setForm((f) => ({ ...f, audiences: v }))}
      />
      <ProfileField
        label="Problems, in their own words (one per line)"
        value={form.problems}
        onChange={(v) => setForm((f) => ({ ...f, problems: v }))}
      />
      <ProfileField
        label="Alternatives (one per line)"
        value={form.alternatives}
        onChange={(v) => setForm((f) => ({ ...f, alternatives: v }))}
      />
      <ProfileField
        label="Buying-intent situations (one per line)"
        value={form.commercialIntents}
        onChange={(v) => setForm((f) => ({ ...f, commercialIntents: v }))}
      />
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateProfile(projectId, {
                audiences: fromLines(form.audiences),
                problems: fromLines(form.problems),
                alternatives: fromLines(form.alternatives),
                commercialIntents: fromLines(form.commercialIntents),
              });
              setEditing(false);
            })
          }
          className="flex h-9 items-center justify-center rounded-full bg-signal px-4 text-xs font-semibold text-signal-ink disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProfileList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-zinc-600 dark:text-zinc-400">{items.join(" · ") || "—"}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
    </label>
  );
}

export function OpportunityActions({ opportunityId }: { opportunityId: string }) {
  const [reply, setReply] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [replyPending, startReply] = useTransition();
  const [statusPending, startStatus] = useTransition();
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  return (
    <div className="mt-3 flex flex-col gap-2">
      {reply && (
        <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-sans text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {reply}
        </pre>
      )}
      {replyError && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {replyError}{" "}
          <a href="/pricing" className="font-medium underline">
            See plans
          </a>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          disabled={replyPending}
          onClick={() =>
            startReply(async () => {
              if (reply) {
                await navigator.clipboard.writeText(reply);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
                return;
              }
              const result = await draftReply(opportunityId);
              if ("error" in result) setReplyError(result.error);
              else setReply(result.reply);
            })
          }
          className="flex h-9 items-center gap-1.5 rounded-full bg-signal px-4 text-xs font-semibold text-signal-ink disabled:opacity-50"
        >
          {replyPending ? (
            "Drafting…"
          ) : reply ? (
            copied ? "Copied!" : "Copy reply"
          ) : (
            <>
              <IconSparkles size={14} /> Draft reply
            </>
          )}
        </button>
        <button
          type="button"
          disabled={statusPending}
          onClick={() => startStatus(() => markStatus(opportunityId, "DISMISSED"))}
          className="font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
        >
          Not relevant
        </button>
        <button
          type="button"
          disabled={statusPending}
          onClick={() => startStatus(() => markStatus(opportunityId, "REPLIED"))}
          className="font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
        >
          Already replied
        </button>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={voted !== null}
            onClick={() => {
              setVoted("up");
              startTransitionSafe(() => giveFeedback(opportunityId, "up"));
            }}
            className={voted === "up" ? "opacity-100" : "opacity-40 hover:opacity-100"}
            aria-label="Great opportunity"
          >
            <IconThumbUp size={16} />
          </button>
          <button
            type="button"
            disabled={voted !== null}
            onClick={() => {
              setVoted("down");
              startTransitionSafe(() => giveFeedback(opportunityId, "down"));
            }}
            className={voted === "down" ? "opacity-100" : "opacity-40 hover:opacity-100"}
            aria-label="Not relevant"
          >
            <IconThumbDown size={16} />
          </button>
        </span>
      </div>
    </div>
  );
}

// Fire-and-forget helper for the feedback buttons — they update their own
// local `voted` state immediately and don't need to block on the request.
function startTransitionSafe(fn: () => Promise<unknown>) {
  fn().catch((err) => console.error("Feedback failed:", err));
}
