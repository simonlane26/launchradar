"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import {
  runVisibilityReport,
  seedActionsFromVisibility,
  generateActionsForDimension,
  type DimensionKey,
  type VisibilityDimension,
} from "@/lib/visibility";
import { similarTitle } from "@/lib/action-dedup";
import { assertQuota, recordUsage, limitsForOrg, PlanLimitError } from "@/lib/plan";
import { SafeError, toUserMessage, logError } from "@/lib/errors";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export async function runVisibility(projectId: string) {
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId: organisation.id },
    select: { id: true },
  });
  if (!project) throw new SafeError("Project not found.");

  const rl = rateLimit(`ai-heavy:${organisation.id}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) throw new SafeError(rateLimitMessage(rl.retryAfterSec));

  try {
    // Synchronous for the MVP — several web-search-grounded Claude calls,
    // minutes long. Same background-job need as Launch Mode / analysis.
    await runVisibilityReport(project.id, organisation.id, limitsForOrg(organisation));
  } catch (error) {
    logError("runVisibility", error);
  }

  revalidatePath(`/projects/${project.id}/visibility`);
  redirect(`/projects/${project.id}/visibility`);
}

export async function addVisibilityFindingsToBacklog(reportId: string) {
  const organisation = await requireOrganisation();
  const report = await prisma.visibilityReport.findFirst({
    where: { id: reportId, organisationId: organisation.id },
    select: { projectId: true },
  });
  if (!report) throw new SafeError("Visibility report not found.");

  await seedActionsFromVisibility(reportId, organisation.id);
  revalidatePath(`/projects/${report.projectId}/visibility`);
  revalidatePath(`/projects/${report.projectId}/actions`);
}

/**
 * "No actions yet — generate some" on a dimension row: turns that
 * dimension's diagnosis straight into 1-2 tagged Action rows.
 */
export async function generateDimensionActions(
  projectId: string,
  dimensionKey: DimensionKey,
): Promise<{ error?: string }> {
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId: organisation.id },
  });
  if (!project) throw new SafeError("Project not found.");

  const rl = rateLimit(`ai-light:${organisation.id}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return { error: rateLimitMessage(rl.retryAfterSec) };

  try {
    await assertQuota(organisation, "AI_ACTION");
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    throw error;
  }

  const report = await prisma.visibilityReport.findFirst({
    where: { projectId, organisationId: organisation.id, status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
  });
  if (!report) throw new SafeError("Run a visibility scan first.");

  const dimension = (report.dimensions as unknown as VisibilityDimension[]).find(
    (d) => d.key === dimensionKey,
  );
  if (!dimension) throw new SafeError("Unknown dimension.");

  let generated: Awaited<ReturnType<typeof generateActionsForDimension>>;
  try {
    generated = await generateActionsForDimension(project, dimension);
  } catch (error) {
    return { error: toUserMessage("generateDimensionActions", error, "Couldn't generate actions. Try again.") };
  }

  const existing = await prisma.action.findMany({
    where: { projectId },
    select: { title: true, rank: true },
  });
  const blockTitles = existing.map((a) => a.title);
  const startRank = existing.reduce((max, a) => Math.max(max, a.rank), 0) + 1;
  const fresh = generated.filter((a) => !blockTitles.some((t) => similarTitle(t, a.title)));

  if (fresh.length > 0) {
    await prisma.action.createMany({
      data: fresh.map((a, i) => ({
        projectId,
        organisationId: organisation.id,
        analysisId: report.analysisId,
        source: "VISIBILITY" as const,
        title: a.title,
        detail: a.rationale,
        rationale: a.rationale,
        category: a.category,
        impact: a.impact,
        deliverable: a.deliverable,
        effortMinutes: a.effortMinutes,
        rank: startRank + i,
        visibilityDimension: dimensionKey,
      })),
    });
  }

  await recordUsage(organisation.id, "AI_ACTION");
  revalidatePath(`/projects/${projectId}/visibility`);
  revalidatePath(`/projects/${projectId}/actions`);
  return {};
}
