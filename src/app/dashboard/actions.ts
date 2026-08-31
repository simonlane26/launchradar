"use server";

import { redirect } from "next/navigation";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis";

export async function analyzeUrl(_prevState: unknown, formData: FormData) {
  const rawUrl = String(formData.get("url") ?? "").trim();
  if (!rawUrl) {
    return { error: "Enter a URL." };
  }

  const organisation = await requireOrganisation();

  const project = await prisma.project.create({
    data: { organisationId: organisation.id, url: rawUrl },
  });

  try {
    // Synchronous for the MVP scaffold — a single fetch + one Claude call.
    // Move to a background job (queue/cron) once analyses get slower or
    // this needs to survive request timeouts (see CLAUDE.md, Phase 1 notes).
    await runAnalysis(project.id, organisation.id, rawUrl);
  } catch (error) {
    console.error("Analysis failed:", error);
    // Fall through to the project page — it will show the FAILED state.
  }

  redirect(`/projects/${project.id}`);
}
