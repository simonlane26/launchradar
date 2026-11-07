import type { QueueChannel } from "@/generated/prisma/client";

/**
 * Cross-project posting queue — pure, client-safe constants and helpers.
 * Deliberately has NO Prisma import: this file is imported from client
 * components (queue-item-card.tsx etc.), and bundling Prisma's Node-only
 * dependency chain into the browser build breaks Turbopack entirely
 * ("chunking context does not support external modules"). Anything that
 * touches the database lives in `src/lib/queue-server.ts` instead.
 */

export const QUEUE_CHANNELS: QueueChannel[] = [
  "PRODUCT_HUNT",
  "INDIE_HACKERS",
  "REDDIT",
  "LINKEDIN",
  "X_TWITTER",
  "BLOG",
];

export const CHANNEL_LABEL: Record<QueueChannel, string> = {
  PRODUCT_HUNT: "Product Hunt",
  INDIE_HACKERS: "Indie Hackers",
  REDDIT: "Reddit",
  LINKEDIN: "LinkedIn",
  X_TWITTER: "X / Twitter",
  BLOG: "Blog",
};

/**
 * Per-channel "open composer" targets. Only X has a real public
 * compose-intent URL; everything else just opens the site itself — the
 * founder pastes the copied draft by hand. Deliberately not pretending
 * every channel can be deep-linked into a pre-filled composer.
 */
export const CHANNEL_COMPOSE_URL: Record<QueueChannel, (draft: string) => string> = {
  X_TWITTER: (draft) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(draft)}`,
  PRODUCT_HUNT: () => "https://www.producthunt.com/",
  INDIE_HACKERS: () => "https://www.indiehackers.com/",
  REDDIT: () => "https://www.reddit.com/submit",
  LINKEDIN: () => "https://www.linkedin.com/feed/",
  BLOG: () => "",
};

/** Monday–Sunday boundaries for the week containing `date` (local time). */
export function currentWeekRange(date = new Date()): { start: Date; end: Date } {
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export type EligibleDraft = {
  kind: "action" | "opportunity";
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  draftText: string;
};
