"use server";

import { revalidatePath } from "next/cache";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis";
import { limitsForOrg } from "@/lib/plan";
import { SafeError, logError } from "@/lib/errors";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export async function rerunAnalysis(projectId: string) {
  const organisation = await requireOrganisation();

  // Resolve the project server-side against the caller's org — never trust a
  // client-supplied id or URL (see CLAUDE.md conventions).
  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId: organisation.id },
  });
  if (!project) {
    throw new SafeError("Project not found.");
  }

  const rl = rateLimit(`analyze:${organisation.id}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) throw new SafeError(rateLimitMessage(rl.retryAfterSec));

  try {
    await runAnalysis(project.id, organisation.id, project.url, {
      backlogSize: limitsForOrg(organisation).backlogSize,
    });
  } catch (error) {
    logError("rerunAnalysis", error);
    // The Analysis row is marked FAILED with a generic message inside
    // runAnalysis; the page renders that state on reload.
  }
  revalidatePath(`/projects/${project.id}`);
}
