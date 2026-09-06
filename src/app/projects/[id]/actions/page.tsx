import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { loadProjectActions } from "../load-actions";
import { ActionList } from "../action-list";
import { actionMatchesDimension, DIMENSION_LABEL, type DimensionKey } from "@/lib/visibility";
import { computeScoreBreakdown, projectScore } from "@/lib/score";
import { quota, formatLimit } from "@/lib/plan";
import type { NormalizedIssue } from "@/lib/analysis";
import type { ReadinessCheck } from "@/lib/website";

export default async function ActionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dimension?: string }>;
}) {
  const { id } = await params;
  const { dimension } = await searchParams;
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id, organisationId: organisation.id },
    include: {
      analyses: { where: { status: "COMPLETE" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) notFound();

  const { queued, done, openCount, rawOpen } = await loadProjectActions(project.id);
  const aiActionQuota = await quota(organisation, "AI_ACTION");

  const analysis = project.analyses[0];
  let projectedScore: number | null = null;
  if (analysis?.growthScore != null && openCount > 0) {
    const breakdown = computeScoreBreakdown(
      (analysis.issues as unknown as NormalizedIssue[]) ?? [],
      (analysis.readinessChecklist as unknown as ReadinessCheck[]) ?? [],
    );
    const { projected } = projectScore(breakdown, rawOpen);
    if (projected > analysis.growthScore) projectedScore = projected;
  }

  const dimensionLabel =
    dimension && dimension in DIMENSION_LABEL
      ? DIMENSION_LABEL[dimension as DimensionKey].label
      : null;
  const visibleQueued = dimensionLabel
    ? queued.filter((a) => actionMatchesDimension(a, dimension as DimensionKey))
    : queued;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Actions
        </h1>
        <p className="text-zinc-500">
          Your growth backlog — worked highest impact first.
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          AI actions {aiActionQuota.used}/{formatLimit(aiActionQuota.limit)} this month ·{" "}
          <Link href="/pricing" className="underline">
            Plans
          </Link>
        </p>
        {projectedScore !== null && (
          <p className="mt-1 text-sm text-zinc-500">
            Clearing this backlog could take your{" "}
            <Link href={`/projects/${project.id}/score`} className="underline">
              Growth Score
            </Link>{" "}
            to <span className="font-medium text-emerald-600 dark:text-emerald-400">{projectedScore}</span>.
          </p>
        )}
      </div>

      {dimensionLabel && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span>
            Filtered to actions addressing <span className="font-medium">{dimensionLabel}</span>
          </span>
          <Link href={`/projects/${project.id}/actions`} className="font-medium underline">
            Show all backlog ({openCount})
          </Link>
        </div>
      )}

      {openCount === 0 && done.length === 0 ? (
        <p className="text-zinc-500">
          No actions yet. Run an analysis from the Overview to build the backlog.
        </p>
      ) : dimensionLabel && visibleQueued.length === 0 ? (
        <p className="text-zinc-500">Nothing in the backlog addresses this yet.</p>
      ) : (
        <ActionList
          openCount={dimensionLabel ? visibleQueued.length : openCount}
          queued={visibleQueued}
          done={dimensionLabel ? [] : done}
          aiActionsAtLimit={aiActionQuota.atLimit}
        />
      )}
    </div>
  );
}
