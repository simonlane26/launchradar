"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { runLaunchPlan } from "@/lib/launch";
import { SafeError, logError } from "@/lib/errors";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export async function generateLaunchPlan(projectId: string) {
  const organisation = await requireOrganisation();

  // Resolve the project server-side against the caller's org before doing
  // any work (see CLAUDE.md conventions).
  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId: organisation.id },
  });
  if (!project) {
    throw new SafeError("Project not found.");
  }

  const rl = rateLimit(`ai-heavy:${organisation.id}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) throw new SafeError(rateLimitMessage(rl.retryAfterSec));

  try {
    // Synchronous for the MVP, same trade-off as Phase 1's analysis — this
    // is a big Claude call and will need moving to a background job before
    // it ships (see CLAUDE.md, Phase 1/2 notes).
    await runLaunchPlan(project.id, organisation.id);
  } catch (error) {
    logError("generateLaunchPlan", error);
    // Fall through — the launch page renders the FAILED state.
  }

  revalidatePath(`/projects/${project.id}/launch`);
  redirect(`/projects/${project.id}/launch`);
}
