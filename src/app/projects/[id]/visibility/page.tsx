import Link from "next/link";
import { notFound } from "next/navigation";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { RadarScan } from "@/components/radar-scan";
import { actionMatchesDimension } from "@/lib/visibility";
import type {
  VisibilityDimension,
  VisibilityQueryResult,
  LeaderboardEntry,
  VisibilityFinding,
} from "@/lib/visibility";
import { loadProjectActions } from "../load-actions";
import { limitsForOrg } from "@/lib/plan";
import { VisibilityButton, AddFindingsButton, GenerateDimensionButton } from "./visibility-button";

function barColor(score: number): string {
  if (score < 34) return "bg-red-500";
  if (score < 67) return "bg-amber-500";
  return "bg-emerald-500";
}

function SegBar({ score, rowIndex }: { score: number; rowIndex: number }) {
  const filled = Math.round(score / 10);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`lr-seg h-2.5 w-4 rounded-sm ${
            i < filled ? barColor(score) : "bg-zinc-200 dark:bg-zinc-800"
          }`}
          style={{ animationDelay: `${rowIndex * 70 + i * 35}ms` }}
        />
      ))}
    </div>
  );
}

type AiSummary = {
  brandMentionRate: number;
  brandCitationRate: number;
  competitorMentionRate: number;
  leaderboard: LeaderboardEntry[];
} | null;

export default async function VisibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id, organisationId: organisation.id },
    include: {
      analyses: { where: { status: "COMPLETE" }, orderBy: { createdAt: "desc" }, take: 1 },
      visibilityReports: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) notFound();

  const hasAnalysis = project.analyses.length > 0;
  const report = project.visibilityReports[0];
  const { queued } = await loadProjectActions(project.id);
  const visibilityAiTest = limitsForOrg(organisation).visibilityAiTest;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Search &amp; AI Visibility
        </h1>
        <p className="text-zinc-500">How easy are you to find — by Google, answer engines, and AI assistants?</p>
      </header>

      {!hasAnalysis && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Run a growth analysis first — the visibility scan builds on its findings and competitor list.
        </div>
      )}

      {hasAnalysis && !report && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">
            We&apos;ll check your site for search &amp; answer-engine readiness, then run real ICP
            questions through web-grounded AI to see whether it recommends you or your competitors.
            Takes a few minutes.
          </p>
          <VisibilityButton projectId={project.id} />
        </div>
      )}

      {report?.status === "RUNNING" || report?.status === "PENDING" ? (
        <RadarScan title="Testing your visibility" />
      ) : null}

      {report?.status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Visibility scan failed: {report.errorMessage}
        </div>
      )}

      {report?.status === "COMPLETE" && (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">How easy are you to find?</p>
            <p className="text-5xl font-semibold tracking-tight">{report.overallScore}<span className="text-2xl text-zinc-400"> / 100</span></p>
          </section>

          <section className="flex flex-col gap-5">
            {(report.dimensions as unknown as VisibilityDimension[]).map((d, i) => {
              const matches = queued.filter((a) => actionMatchesDimension(a, d.key));
              return (
                <div key={d.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">
                      {d.label}
                      <span className="ml-2 text-xs text-zinc-400">{d.acronym}</span>
                    </span>
                    <span className="text-sm text-zinc-500">{d.score}/100</span>
                  </div>
                  <SegBar score={d.score} rowIndex={i} />
                  <p className="text-sm text-zinc-500">{d.detail}</p>
                  {matches.length > 0 ? (
                    <Link
                      href={`/projects/${project.id}/actions?dimension=${d.key}`}
                      className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      {matches.length} action{matches.length === 1 ? "" : "s"} address this →
                    </Link>
                  ) : d.score < 67 ? (
                    <GenerateDimensionButton projectId={project.id} dimensionKey={d.key} />
                  ) : (
                    <p className="text-sm text-zinc-400">Already strong — no backlog item needed.</p>
                  )}
                </div>
              );
            })}
          </section>

          {report.aiSummary ? (
            <AiPanel
              summary={report.aiSummary as unknown as AiSummary}
              queries={report.queries as unknown as VisibilityQueryResult[]}
            />
          ) : !visibilityAiTest ? (
            <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
              <h2 className="text-base font-medium text-black dark:text-zinc-50">AI Visibility test</h2>
              <p className="mt-1">
                This is the on-site scan. The live AI Visibility test — running real ICP questions
                through web-grounded AI to see whether it recommends you or your competitors — is a{" "}
                <Link href="/pricing" className="underline">
                  Builder feature
                </Link>
                .
              </p>
            </section>
          ) : (
            <p className="text-sm text-zinc-500">
              AI Visibility test didn&apos;t run this time (no competitors identified, or the test
              errored). Re-run to try again.
            </p>
          )}

          <Findings
            findings={(report.findings as unknown as VisibilityFinding[]) ?? []}
            reportId={report.id}
          />

          <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <VisibilityButton projectId={project.id} label="Re-run scan" />
            <span className="text-xs text-zinc-500">
              {report.completedAt?.toLocaleString() ?? report.createdAt.toLocaleString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function AiPanel({
  summary,
  queries,
}: {
  summary: AiSummary;
  queries: VisibilityQueryResult[];
}) {
  if (!summary) return null;
  const max = Math.max(1, ...summary.leaderboard.map((l) => l.appearances));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-medium">AI Visibility test</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Brand mentioned in{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {Math.round((summary.brandMentionRate / 100) * queries.length)} / {queries.length}
        </span>{" "}
        answers · citation rate {summary.brandCitationRate}% · competitors appeared in{" "}
        {summary.competitorMentionRate}% of answers
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {summary.leaderboard.map((l) => (
          <li key={l.name} className="flex items-center gap-3 text-sm">
            <span className={`w-32 truncate ${l.isBrand ? "font-semibold" : "text-zinc-600 dark:text-zinc-400"}`}>
              {l.isBrand ? `${l.name} (you)` : l.name}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${l.isBrand ? "bg-emerald-500" : "bg-zinc-400"}`}
                style={{ width: `${(l.appearances / max) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-zinc-500">{l.appearances}</span>
          </li>
        ))}
      </ul>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-500">
          The {queries.length} queries we tested
        </summary>
        <ul className="mt-2 flex flex-col gap-3">
          {queries.map((q, i) => (
            <li key={i} className="text-sm">
              <p className="font-medium">{q.query}</p>
              <p className="flex items-center gap-1.5 text-zinc-500">
                {q.brandMentioned ? (
                  <IconCircleCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <IconCircleX size={14} className="text-red-500" />
                )}
                {q.brandMentioned ? "mentioned you" : "didn't mention you"}
                {q.competitorsMentioned.length > 0 && ` · named: ${q.competitorsMentioned.join(", ")}`}
              </p>
              <p className="mt-0.5 text-zinc-500">{q.answerExcerpt}…</p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function Findings({
  findings,
  reportId,
}: {
  findings: VisibilityFinding[];
  reportId: string;
}) {
  if (findings.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Why competitors win these queries</h2>
        <AddFindingsButton reportId={reportId} />
      </div>
      <ul className="flex flex-col gap-2">
        {findings.map((f, i) => (
          <li
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${f.severity === "red" ? "bg-red-500" : "bg-amber-500"}`}
              />
              <p className="font-medium">{f.title}</p>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.detail}</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-500">
              {f.suggestedActions.map((a, j) => (
                <li key={j}>
                  → {a.title} <span className="text-xs">({a.category} · {a.impact})</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
