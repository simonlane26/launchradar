import type { ActionImpact, ActionDeliverable } from "@/generated/prisma/client";

export function formatEffort(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `~${hours} hr` : `~${hours.toFixed(1)} hr`;
}

export const IMPACT_HEADING: Record<ActionImpact, string> = {
  HIGH: "HIGH IMPACT",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

/** Coloured dot before the impact heading, backlog-card style. */
export const IMPACT_DOT: Record<ActionImpact, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-zinc-400",
};

export const IMPACT_TEXT: Record<ActionImpact, string> = {
  HIGH: "text-red-600 dark:text-red-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  LOW: "text-zinc-500",
};

export const IMPACT_RANK: Record<ActionImpact, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

/**
 * "Create with AI" when LaunchRadar can produce the deliverable itself;
 * "Show me how" when it can only guide the founder through it.
 * (Future: "Fix with AI" once the agent can apply changes directly.)
 */
export function ctaLabel(deliverable: ActionDeliverable): string {
  return deliverable === "ASSET" ? "Create with AI" : "Show me how";
}
