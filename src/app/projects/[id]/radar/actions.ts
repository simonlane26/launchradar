"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import {
  runRadarScan,
  updateProductProfile,
  generateOpportunityReply,
  recordOpportunityFeedback,
  type Profile,
} from "@/lib/radar";
import { assertQuota, recordUsage, limitsForOrg, PlanLimitError } from "@/lib/plan";
import { SafeError, toUserMessage, logError } from "@/lib/errors";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export async function runScan(projectId: string) {
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!project) throw new SafeError("Project not found.");

  const rl = rateLimit(`ai-heavy:${organisation.id}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) throw new SafeError(rateLimitMessage(rl.retryAfterSec));

  try {
    // Re-check the monthly scan quota server-side — the button is disabled
    // at the limit, this is the defensive backstop.
    await assertQuota(organisation, "RADAR_SCAN");
  } catch (error) {
    if (error instanceof PlanLimitError) {
      revalidatePath(`/projects/${project.id}/radar`);
      redirect(`/projects/${project.id}/radar`);
    }
    throw error;
  }

  try {
    // Synchronous for the MVP — 16 parallel web-search calls + a batched
    // classification call, minutes long. Same background-job debt as
    // analysis / Launch Mode / the Visibility scan.
    await runRadarScan(project.id, organisation.id, limitsForOrg(organisation));
    await recordUsage(organisation.id, "RADAR_SCAN");
  } catch (error) {
    logError("runScan", error);
  }

  revalidatePath(`/projects/${project.id}/radar`);
  redirect(`/projects/${project.id}/radar`);
}

/** Accept only an array of non-empty strings, each ≤300 chars, ≤50 entries —
 *  server actions can be called with an arbitrary payload, not just the form. */
function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= 300)
    .slice(0, 50);
}

export async function updateProfile(projectId: string, fields: Profile) {
  const organisation = await requireOrganisation();
  await updateProductProfile(projectId, organisation.id, {
    audiences: cleanStringList(fields?.audiences),
    problems: cleanStringList(fields?.problems),
    alternatives: cleanStringList(fields?.alternatives),
    commercialIntents: cleanStringList(fields?.commercialIntents),
  });
  revalidatePath(`/projects/${projectId}/radar`);
}

export async function draftReply(
  opportunityId: string,
): Promise<{ reply: string } | { error: string }> {
  const organisation = await requireOrganisation();

  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, organisationId: organisation.id },
    include: { project: true },
  });
  if (!opportunity) throw new SafeError("Opportunity not found.");
  if (opportunity.reply) return { reply: opportunity.reply };

  const rl = rateLimit(`ai-light:${organisation.id}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return { error: rateLimitMessage(rl.retryAfterSec) };

  try {
    await assertQuota(organisation, "DRAFT_REPLY");
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    throw error;
  }

  let reply: string;
  try {
    reply = await generateOpportunityReply(opportunity, opportunity.project);
  } catch (error) {
    return { error: toUserMessage("draftReply", error, "Couldn't draft a reply. Try again.") };
  }
  await prisma.opportunity.update({ where: { id: opportunity.id }, data: { reply } });
  await recordUsage(organisation.id, "DRAFT_REPLY");
  revalidatePath(`/projects/${opportunity.projectId}/radar`);
  return { reply };
}

export async function giveFeedback(opportunityId: string, rating: "up" | "down") {
  if (rating !== "up" && rating !== "down") throw new SafeError("Invalid rating.");
  const organisation = await requireOrganisation();
  await recordOpportunityFeedback(opportunityId, organisation.id, rating);
}

export async function markStatus(opportunityId: string, status: "REPLIED" | "DISMISSED") {
  if (status !== "REPLIED" && status !== "DISMISSED") throw new SafeError("Invalid status.");
  const organisation = await requireOrganisation();
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, organisationId: organisation.id },
    select: { id: true, projectId: true },
  });
  if (!opportunity) throw new SafeError("Opportunity not found.");

  await prisma.opportunity.update({ where: { id: opportunity.id }, data: { status } });
  revalidatePath(`/projects/${opportunity.projectId}/radar`);
}
