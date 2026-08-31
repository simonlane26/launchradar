"use server";

import { revalidatePath } from "next/cache";
import { requireOrganisation } from "@/lib/org";
import { runAnalysis } from "@/lib/analysis";

export async function rerunAnalysis(projectId: string, url: string) {
  const organisation = await requireOrganisation();
  await runAnalysis(projectId, organisation.id, url);
  revalidatePath(`/projects/${projectId}`);
}
