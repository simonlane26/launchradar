"use server";

import { revalidatePath } from "next/cache";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { SafeError } from "@/lib/errors";
import { cadenceRemaining } from "@/lib/queue-server";
import { CHANNEL_LABEL } from "@/lib/queue";
import type { QueueChannel } from "@/generated/prisma/client";

/**
 * Cross-project posting queue mutations. Plain org-scoped CRUD — no Claude
 * calls here, so unlike generateActionGuide/draftReply these don't need
 * rateLimit/assertQuota (see CLAUDE.md "Cross-project posting queue").
 */

export async function addToQueue(input: {
  projectId: string;
  actionId?: string;
  opportunityId?: string;
  channel: QueueChannel;
  scheduledFor: Date;
}): Promise<{ error?: string; warning?: string }> {
  const organisation = await requireOrganisation();

  if (!input.actionId === !input.opportunityId) {
    throw new SafeError("Pick exactly one piece of drafted content to queue.");
  }

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!project) throw new SafeError("Project not found.");

  if (input.actionId) {
    const action = await prisma.action.findFirst({
      where: { id: input.actionId, organisationId: organisation.id, projectId: input.projectId },
      select: { id: true },
    });
    if (!action) throw new SafeError("Action not found.");
  } else if (input.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: input.opportunityId, organisationId: organisation.id, projectId: input.projectId },
      select: { id: true },
    });
    if (!opportunity) throw new SafeError("Opportunity not found.");
  }

  // Cadence is guidance, not a hard limit (see CLAUDE.md) — check before
  // creating so the warning reflects the state the founder is adding into.
  const cadence = await cadenceRemaining(input.projectId, input.channel);
  const warning =
    cadence && cadence.remaining <= 0
      ? `That's over your weekly cap for ${CHANNEL_LABEL[input.channel]} (${cadence.used}/${cadence.max} already planned) — added anyway, your call.`
      : undefined;

  await prisma.queueItem.create({
    data: {
      organisationId: organisation.id,
      projectId: input.projectId,
      actionId: input.actionId ?? null,
      opportunityId: input.opportunityId ?? null,
      channel: input.channel,
      scheduledFor: input.scheduledFor,
    },
  });

  revalidatePath("/queue");
  return { warning };
}

export async function markPosted(queueItemId: string, postedUrl?: string): Promise<{ error?: string }> {
  const organisation = await requireOrganisation();
  const item = await prisma.queueItem.findFirst({
    where: { id: queueItemId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!item) throw new SafeError("Queue item not found.");

  await prisma.queueItem.update({
    where: { id: queueItemId },
    data: { status: "POSTED", postedAt: new Date(), postedUrl: postedUrl?.trim() || null },
  });

  revalidatePath("/queue");
  return {};
}

export async function skipQueueItem(queueItemId: string): Promise<{ error?: string }> {
  const organisation = await requireOrganisation();
  const item = await prisma.queueItem.findFirst({
    where: { id: queueItemId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!item) throw new SafeError("Queue item not found.");

  await prisma.queueItem.update({ where: { id: queueItemId }, data: { status: "SKIPPED" } });

  revalidatePath("/queue");
  return {};
}

export async function rescheduleQueueItem(
  queueItemId: string,
  scheduledFor: Date,
): Promise<{ error?: string }> {
  const organisation = await requireOrganisation();
  const item = await prisma.queueItem.findFirst({
    where: { id: queueItemId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!item) throw new SafeError("Queue item not found.");

  await prisma.queueItem.update({ where: { id: queueItemId }, data: { scheduledFor } });

  revalidatePath("/queue");
  return {};
}

export async function upsertChannelProfile(input: {
  projectId: string;
  channel: QueueChannel;
  active: boolean;
  maxPerWeek: number;
}): Promise<{ error?: string }> {
  const organisation = await requireOrganisation();
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!project) throw new SafeError("Project not found.");

  const maxPerWeek = Math.max(1, Math.min(14, Math.round(input.maxPerWeek)));

  await prisma.channelProfile.upsert({
    where: { projectId_channel: { projectId: input.projectId, channel: input.channel } },
    create: {
      organisationId: organisation.id,
      projectId: input.projectId,
      channel: input.channel,
      active: input.active,
      maxPerWeek,
    },
    update: { active: input.active, maxPerWeek },
  });

  revalidatePath("/queue");
  return {};
}
