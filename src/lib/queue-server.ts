import { prisma } from "@/lib/prisma";
import type { QueueChannel } from "@/generated/prisma/client";
import { currentWeekRange, type EligibleDraft } from "@/lib/queue";

/**
 * Database-touching queue helpers — server-only (imports `prisma`). Kept
 * separate from `src/lib/queue.ts`'s client-safe constants; see that file's
 * doc comment for why the split matters.
 */

/**
 * Drafted content across every project in the org that isn't already
 * scheduled — the source list for "Add to this week". An Action counts
 * once it has a generated ASSET guide; an Opportunity once it has a
 * generated reply. Excludes anything already in an active (PLANNED)
 * QueueItem so a draft only ever appears once.
 */
export async function eligibleDrafts(organisationId: string): Promise<EligibleDraft[]> {
  const [actions, opportunities, queued] = await Promise.all([
    prisma.action.findMany({
      where: { organisationId, deliverable: "ASSET", status: "TODO", guide: { not: null } },
      select: { id: true, projectId: true, title: true, guide: true, project: { select: { name: true, url: true } } },
    }),
    prisma.opportunity.findMany({
      where: { organisationId, status: { not: "DISMISSED" }, reply: { not: null } },
      select: { id: true, projectId: true, title: true, reply: true, project: { select: { name: true, url: true } } },
    }),
    prisma.queueItem.findMany({
      where: { organisationId, status: "PLANNED" },
      select: { actionId: true, opportunityId: true },
    }),
  ]);

  const queuedActionIds = new Set(queued.map((q) => q.actionId).filter(Boolean));
  const queuedOpportunityIds = new Set(queued.map((q) => q.opportunityId).filter(Boolean));

  const fromActions: EligibleDraft[] = actions
    .filter((a) => !queuedActionIds.has(a.id))
    .map((a) => ({
      kind: "action",
      id: a.id,
      projectId: a.projectId,
      projectName: a.project.name ?? a.project.url,
      title: a.title,
      draftText: a.guide ?? "",
    }));

  const fromOpportunities: EligibleDraft[] = opportunities
    .filter((o) => !queuedOpportunityIds.has(o.id))
    .map((o) => ({
      kind: "opportunity",
      id: o.id,
      projectId: o.projectId,
      projectName: o.project.name ?? o.project.url,
      title: o.title,
      draftText: o.reply ?? "",
    }));

  return [...fromActions, ...fromOpportunities];
}

/** Remaining posts this week for one project's channel, against its
 *  ChannelProfile cap — null if the channel has no profile (not configured). */
export async function cadenceRemaining(
  projectId: string,
  channel: QueueChannel,
  week = currentWeekRange(),
): Promise<{ max: number; used: number; remaining: number } | null> {
  const profile = await prisma.channelProfile.findUnique({
    where: { projectId_channel: { projectId, channel } },
    select: { maxPerWeek: true, active: true },
  });
  if (!profile || !profile.active) return null;

  const used = await prisma.queueItem.count({
    where: {
      projectId,
      channel,
      status: { not: "SKIPPED" },
      scheduledFor: { gte: week.start, lt: week.end },
    },
  });
  return { max: profile.maxPerWeek, used, remaining: Math.max(0, profile.maxPerWeek - used) };
}
