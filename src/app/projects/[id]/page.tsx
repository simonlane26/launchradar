import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconTarget,
  IconSearch,
  IconRocket,
  IconCircleCheck,
  IconCircleX,
  IconMinus,
} from "@tabler/icons-react";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import type { NormalizedIssue } from "@/lib/analysis";
import type { ReadinessCheck } from "@/lib/website";
import { RerunButton } from "./rerun-button";
import { MetricRow } from "./metric-row";
import { NextBestActionCard } from "./next-action-card";
import { loadProjectActions } from "./load-actions";
import { quota } from "@/lib/plan";
import { RadarScan } from "@/components/radar-scan";

type Issue = NormalizedIssue;

const SEVERITY_DOT: Record<Issue["severity"], string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
};

const AREA_LABEL: Record<Issue["area"], string> = {
  positioning: "Positioning",
  comparison_pages: "Comparison pages",
  demo_video: "Demo video",
  seo_coverage: "SEO coverage",
  directory_presence: "Directory presence",
  social_proof: "Social proof",
  signup_flow: "Signup flow",
};

const CUSTOMER_GOAL = 10;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id, organisationId: organisation.id },
    include: {
      analyses: { orderBy: { createdAt: "desc" } },
      visibilityReports: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) notFound();

  const latest = project.analyses[0];
  const completed = project.analyses.filter((a) => a.status === "COMPLETE");
  const growthScore = completed[0]?.growthScore ?? null;
  const growthDelta =
    completed.length > 1 && completed[0].growthScore != null && completed[1].growthScore != null
      ? completed[0].growthScore - completed[1].growthScore
      : null;

  const { nextAction, openCount, actionsDone, actionsTotal } = await loadProjectActions(
    project.id,
  );
  const aiActionQuota = await quota(organisation, "AI_ACTION");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Overview
          </h1>
          <p className="text-zinc-500">{project.url}</p>
        </div>
        <RerunButton projectId={project.id} />
      </header>

      {!latest && <p className="text-zinc-500">No analysis yet.</p>}

      {latest?.status === "RUNNING" || latest?.status === "PENDING" ? (
        <RadarScan title="Scanning your site" />
      ) : null}

      {latest?.status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Analysis failed: {latest.errorMessage}
        </div>
      )}

      {completed.length > 0 && (
        <>
          <MetricRow
            growthScore={growthScore}
            growthDelta={growthDelta}
            scoreHref={`/projects/${project.id}/score`}
            actionsDone={actionsDone}
            actionsTotal={actionsTotal}
            customersAcquired={0}
            customersGoal={CUSTOMER_GOAL}
            opportunitiesFound={0}
            experimentsRunning={0}
          />

          {nextAction ? (
            <div className="flex flex-col gap-2">
              <NextBestActionCard action={nextAction} aiActionsAtLimit={aiActionQuota.atLimit} />
              <Link
                href={`/projects/${project.id}/actions`}
                className="self-start text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                View full backlog ({openCount}) →
              </Link>
            </div>
          ) : (
            <section className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <IconTarget size={16} />
              No open actions. Re-analyze to surface the next round of growth work.
            </section>
          )}

          <Link
            href={`/projects/${project.id}/visibility`}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <div>
              <p className="flex items-center gap-1.5 font-medium">
                <IconSearch size={16} />
                Search &amp; AI Visibility
              </p>
              <p className="text-sm text-zinc-500">
                How easy are you to find by Google and AI assistants?
              </p>
            </div>
            <span className="text-lg font-semibold">
              {project.visibilityReports[0]
                ? `${project.visibilityReports[0].overallScore}/100`
                : "Run scan →"}
            </span>
          </Link>

          <section className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div>
              <p className="font-medium">Ready to launch?</p>
              <p className="text-sm text-zinc-500">
                Turn this analysis into a curated 30-day launch campaign.
              </p>
            </div>
            <Link
              href={`/projects/${project.id}/launch`}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <IconRocket size={16} />
              Launch Mode
            </Link>
          </section>

          <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500">Full analysis</p>

            {latest?.status === "COMPLETE" && (
              <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <summary className="cursor-pointer font-medium">
                  Growth problems
                  <span className="ml-2 text-sm font-normal text-zinc-500">
                    {project.category ?? "—"} · {project.stage}
                  </span>
                </summary>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">ICP:</span> {project.icp ?? "—"} ·{" "}
                  <span className="font-medium">Pricing:</span> {project.pricing ?? "—"}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {(latest.issues as Issue[]).map((issue) => (
                    <li key={issue.area} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[issue.severity]}`}
                      />
                      <div>
                        <p className="font-medium">{AREA_LABEL[issue.area]}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">{issue.summary}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {latest?.status === "COMPLETE" && (
              <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <summary className="cursor-pointer font-medium">
                  Marketing readiness checklist
                </summary>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(latest.readinessChecklist as unknown as ReadinessCheck[]).map((check) => (
                    <li key={check.key} className="flex items-center gap-2 text-sm">
                      {check.status === "pass" ? (
                        <IconCircleCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : check.status === "fail" ? (
                        <IconCircleX size={16} className="text-red-500" />
                      ) : (
                        <IconMinus size={16} className="text-zinc-400" />
                      )}
                      <span className={check.status === "unknown" ? "text-zinc-400" : undefined}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {completed.length > 1 && (
              <Link
                href={`/projects/${project.id}/score`}
                className="rounded-xl border border-zinc-200 p-4 text-sm font-medium hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                Score history &amp; breakdown →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
