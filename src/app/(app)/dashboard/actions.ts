"use server";

import { redirect } from "next/navigation";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis";
import { normalizeSiteUrl } from "@/lib/url";
import { assertProjectQuota, limitsForOrg, PlanLimitError } from "@/lib/plan";
import { toUserMessage, logError } from "@/lib/errors";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

export async function analyzeUrl(_prevState: unknown, formData: FormData) {
  const rawUrl = String(formData.get("url") ?? "");

  let url: string;
  try {
    url = normalizeSiteUrl(rawUrl);
  } catch (error) {
    return { error: toUserMessage("analyzeUrl:normalize", error, "Enter a valid URL.") };
  }

  const organisation = await requireOrganisation();

  const rl = rateLimit(`analyze:${organisation.id}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) return { error: rateLimitMessage(rl.retryAfterSec) };

  try {
    await assertProjectQuota(organisation);
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    throw error;
  }

  const project = await prisma.project.create({
    data: { organisationId: organisation.id, url },
  });

  try {
    // Synchronous for the MVP scaffold — a single fetch + one Claude call.
    // Move to a background job (queue/cron) once analyses get slower or
    // this needs to survive request timeouts (see CLAUDE.md, Phase 1 notes).
    await runAnalysis(project.id, organisation.id, url, {
      backlogSize: limitsForOrg(organisation).backlogSize,
    });
  } catch (error) {
    logError("analyzeUrl:runAnalysis", error);
    // Fall through to the project page — it will show the FAILED state.
  }

  redirect(`/projects/${project.id}`);
}
