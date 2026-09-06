"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { generateGuide, type Guide } from "@/lib/action-guide";
import { assertQuota, recordUsage, PlanLimitError } from "@/lib/plan";
import { SafeError, toUserMessage } from "@/lib/errors";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

/** Resolve an Action scoped to the caller's org, or throw. */
async function requireAction(actionId: string) {
  const organisation = await requireOrganisation();
  const action = await prisma.action.findFirst({
    where: { id: actionId, organisationId: organisation.id },
    include: { project: true },
  });
  if (!action) {
    throw new SafeError("Action not found.");
  }
  return { action, organisation };
}

/** Every view that renders an Action list — mutations from any of them
 *  should refresh all three, not just the one the click happened on. */
function revalidateActionViews(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/actions`);
  revalidatePath(`/projects/${projectId}/visibility`);
}

export async function completeAction(actionId: string) {
  const { action } = await requireAction(actionId);
  await prisma.action.update({
    where: { id: action.id },
    data: { status: "DONE", completedAt: new Date() },
  });
  revalidateActionViews(action.projectId);
}

export async function reopenAction(actionId: string) {
  const { action } = await requireAction(actionId);
  await prisma.action.update({
    where: { id: action.id },
    data: { status: "TODO", completedAt: null },
  });
  revalidateActionViews(action.projectId);
}

export async function skipAction(actionId: string) {
  const { action } = await requireAction(actionId);
  await prisma.action.update({
    where: { id: action.id },
    data: { status: "SKIPPED", completedAt: null },
  });
  revalidateActionViews(action.projectId);
}

/**
 * "Show me how" / "Create with AI" — return the cached guide if we have one
 * (always free), otherwise spend one AI-action from the monthly quota to
 * generate it once and persist it on the row.
 */
export async function generateActionGuide(
  actionId: string,
): Promise<Guide | { error: string }> {
  const { action, organisation } = await requireAction(actionId);
  if (action.guide) {
    return { text: action.guide, steps: (action.steps as string[] | null) ?? null };
  }

  const rl = rateLimit(`ai-light:${organisation.id}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return { error: rateLimitMessage(rl.retryAfterSec) };

  try {
    await assertQuota(organisation, "AI_ACTION");
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    throw error;
  }

  let guide: Guide;
  try {
    guide = await generateGuide(action.project, action);
  } catch (error) {
    return { error: toUserMessage("generateActionGuide", error, "Couldn't generate this guide. Try again.") };
  }
  await prisma.action.update({
    where: { id: action.id },
    data: {
      guide: guide.text,
      steps: (guide.steps as unknown as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
    },
  });
  await recordUsage(organisation.id, "AI_ACTION");
  revalidateActionViews(action.projectId);
  return guide;
}
