import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import type { NormalizedIssue } from "@/lib/analysis";
import type { ReadinessCheck } from "@/lib/website";
import {
  computeScoreBreakdown,
  overallFromBreakdown,
  projectScore,
  type DimensionScore,
} from "@/lib/score";
import { loadProjectActions } from "../load-actions";

function barColor(score: number): string {
  if (score < 34) return "bg-red-500";
  if (score < 67) return "bg-amber-500";
  return "bg-emerald-500";
}

/** Solid segments for the current score, hollow ringed segments for the
 *  projected gain — so "potential" never reads as "achieved". Segments light
 *  up one at a time on load, and each row starts `rowIndex * 70ms` later. */
function ScoreBar({
  score,
  projected,
  rowIndex,
}: {
  score: number;
  projected: number;
  rowIndex: number;
}) {
  const filled = Math.round(score / 10);
  const projectedFilled = Math.round(Math.min(100, projected) / 10);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => {
        const delay = { animationDelay: `${rowIndex * 70 + i * 35}ms` };
        if (i < filled) {
          return (
            <span
              key={i}
              className={`lr-seg h-2.5 w-4 rounded-sm ${barColor(score)}`}
              style={delay}
            />
          );
        }
        if (i < projectedFilled) {
          return (
            <span
              key={i}
              className="lr-seg h-2.5 w-4 rounded-sm border border-dashed border-emerald-500/60 bg-emerald-500/10"
              style={delay}
            />
          );
        }
        return <span key={i} className="h-2.5 w-4 rounded-sm bg-zinc-200 dark:bg-zinc-800" />;
      })}
    </div>
  );
}

function DimensionRow({
  row,
  projected,
  rowIndex,
}: {
  row: DimensionScore;
  projected: number;
  rowIndex: number;
}) {
  const gain = projected - row.score;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{row.dimension}</span>
        <span className="text-sm text-zinc-500">
          {row.score}/100
          {gain > 0 && (
            <span className="ml-2 rounded border border-dashed border-emerald-500/60 px-1 text-xs text-emerald-600 dark:text-emerald-400">
              → {projected} potential
            </span>
          )}
        </span>
      </div>
      <ScoreBar score={row.score} projected={projected} rowIndex={rowIndex} />
    </div>
  );
}

function formatDay(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default async function ScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id, organisationId: organisation.id },
    include: {
      analyses: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  const history = project.analyses;
  const analysis = history[0];
  const { rawOpen, openCount } = await loadProjectActions(project.id);

  if (!analysis) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Growth Score</h1>
        <p className="text-zinc-500">
          No completed analysis yet.{" "}
          <Link href={`/projects/${project.id}`} className="underline">
            Run one from the Overview
          </Link>
          .
        </p>
      </div>
    );
  }

  const issues = (analysis.issues as unknown as NormalizedIssue[]) ?? [];
  const readiness = (analysis.readinessChecklist as unknown as ReadinessCheck[]) ?? [];
  const breakdown = computeScoreBreakdown(issues, readiness);
  // The stored snapshot is the one canonical number shown across the app.
  const overall = analysis.growthScore ?? overallFromBreakdown(breakdown);
  const { projected, byDimension } = projectScore(breakdown, rawOpen);
  const projectedByDim = new Map(byDimension.map((d) => [d.dimension, d.score]));
  const projectedGain = Math.max(0, projected - overall);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Overview
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Why your Growth Score is {overall}
        </h1>
      </div>

      <div className="flex flex-col gap-5">
        {breakdown.map((row, i) => (
          <DimensionRow
            key={row.dimension}
            row={row}
            rowIndex={i}
            projected={projectedByDim.get(row.dimension) ?? row.score}
          />
        ))}
      </div>

      {openCount > 0 && (
        <div className="rounded-2xl border border-dashed border-emerald-500/50 bg-emerald-50/40 p-5 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Projected
            </span>
            <span className="text-sm text-zinc-500">not yet achieved</span>
          </div>
          <p className="mt-2 text-sm">
            Complete your{" "}
            <Link href={`/projects/${project.id}/actions`} className="font-medium underline">
              {openCount} open action{openCount === 1 ? "" : "s"}
            </Link>{" "}
            and this score could reach{" "}
            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {projected}
            </span>{" "}
            <span className="text-zinc-500">(+{projectedGain})</span>.
          </p>
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h2 className="mb-3 text-lg font-medium">Score history</h2>
          <ul className="flex flex-col gap-2">
            {[...history].reverse().map((a, i, arr) => {
              const score = a.growthScore ?? 0;
              const prev = i > 0 ? (arr[i - 1].growthScore ?? 0) : null;
              const delta = prev === null ? null : score - prev;
              const isLatest = i === arr.length - 1;
              return (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-zinc-500">{formatDay(a.createdAt)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${barColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span
                    className={`w-10 text-right font-medium ${
                      isLatest ? "text-black dark:text-zinc-50" : "text-zinc-500"
                    }`}
                  >
                    {score}
                  </span>
                  <span className="w-10 text-right text-xs text-zinc-400">
                    {delta === null ? "" : delta > 0 ? `+${delta}` : delta}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
