import { prisma } from "@/lib/prisma";
import { IMPACT_RANK } from "./action-format";
import type { CardAction } from "./next-action-card";

export type DoneAction = { id: string; title: string; status: "DONE" | "SKIPPED" };

/**
 * Shared Action shaping for the Overview and Actions pages — load, split by
 * status, priority-sort the open queue, and project down to serialisable
 * `CardAction`s for the client components.
 */
export async function loadProjectActions(projectId: string) {
  const actions = await prisma.action.findMany({
    where: { projectId },
    orderBy: { rank: "asc" },
  });

  const toCard = (a: (typeof actions)[number]): CardAction => ({
    id: a.id,
    title: a.title,
    category: a.category,
    rationale: a.rationale,
    detail: a.detail,
    impact: a.impact,
    deliverable: a.deliverable,
    effortMinutes: a.effortMinutes,
    guide: a.guide,
    steps: (a.steps as string[] | null) ?? null,
    visibilityDimension: a.visibilityDimension,
    externalUrl: a.externalUrl,
  });

  const open = actions
    .filter((a) => a.status === "TODO")
    .sort(
      (x, y) =>
        IMPACT_RANK[x.impact] - IMPACT_RANK[y.impact] ||
        x.rank - y.rank ||
        x.effortMinutes - y.effortMinutes,
    );

  const done: DoneAction[] = actions
    .filter((a) => a.status !== "TODO")
    .map((a) => ({ id: a.id, title: a.title, status: a.status as "DONE" | "SKIPPED" }));

  return {
    nextAction: open[0] ? toCard(open[0]) : null,
    queued: open.map(toCard),
    restQueued: open.slice(1).map(toCard),
    done,
    openCount: open.length,
    actionsDone: actions.filter((a) => a.status === "DONE").length,
    actionsTotal: actions.filter((a) => a.status !== "SKIPPED").length,
    rawOpen: open.map((a) => ({ category: a.category, impact: a.impact })),
  };
}
