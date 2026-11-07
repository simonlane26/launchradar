"use client";

import { useState, useTransition } from "react";
import type { QueueChannel, QueueItemStatus } from "@/generated/prisma/client";
import { CHANNEL_LABEL, CHANNEL_COMPOSE_URL } from "@/lib/queue";
import { markPosted, skipQueueItem } from "./actions";

export function QueueItemCard({
  id,
  projectName,
  channel,
  title,
  draftText,
  status,
  postedUrl,
}: {
  id: string;
  projectName: string;
  channel: QueueChannel;
  title: string;
  draftText: string;
  status: QueueItemStatus;
  postedUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");

  const composeUrl = CHANNEL_COMPOSE_URL[channel](draftText);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail (permissions, insecure context) — not worth surfacing an error for.
    }
  };

  if (status === "POSTED") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
        <div>
          <span className="font-medium text-emerald-800 dark:text-emerald-300">Posted</span>
          <span className="text-zinc-500"> · {projectName} · {CHANNEL_LABEL[channel]} · {title}</span>
        </div>
        {postedUrl && (
          <a href={postedUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-zinc-500">
            View post
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {projectName} <span className="text-zinc-400">·</span> {CHANNEL_LABEL[channel]}
        </p>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
      <p className="line-clamp-3 text-xs text-zinc-500">{draftText}</p>

      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={copy} className="font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100">
          {copied ? "Copied" : "Copy"}
        </button>
        {composeUrl && (
          <a
            href={composeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Open composer
          </a>
        )}
        {!showUrlInput ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowUrlInput(true)}
            className="font-medium text-signal-ink"
          >
            Mark posted
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link (optional)"
              className="h-8 w-40 rounded-md border border-zinc-300 px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => void markPosted(id, url))}
              className="font-medium text-signal-ink"
            >
              Confirm
            </button>
          </span>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => void skipQueueItem(id))}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
