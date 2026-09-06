import type { ReactNode } from "react";
import Link from "next/link";
import { CountUpScore } from "./count-up-score";

type Metric = {
  label: string;
  value: string;
  valueNode?: ReactNode;
  hint?: string;
  soon?: boolean;
  href?: string;
};

function Tile({ metric }: { metric: Metric }) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {metric.label}
        </p>
        {metric.soon && (
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
            soon
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {metric.valueNode ?? metric.value}
        {metric.hint && (
          <span className="ml-1.5 align-middle text-sm font-medium text-zinc-500">
            {metric.hint}
          </span>
        )}
      </p>
    </>
  );

  const className = `block rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 ${
    metric.soon ? "opacity-50" : ""
  } ${
    metric.href
      ? "transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
      : ""
  }`;

  return metric.href ? (
    <Link href={metric.href} className={className}>
      {body}
      <span className="mt-1 block text-[11px] font-medium text-zinc-400">
        See breakdown →
      </span>
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function MetricRow({
  growthScore,
  growthDelta,
  scoreHref,
  actionsDone,
  actionsTotal,
  customersAcquired,
  customersGoal,
  opportunitiesFound,
  experimentsRunning,
}: {
  growthScore: number | null;
  growthDelta: number | null;
  scoreHref?: string;
  actionsDone: number;
  actionsTotal: number;
  customersAcquired: number;
  customersGoal: number;
  opportunitiesFound: number;
  experimentsRunning: number;
}) {
  const deltaHint =
    growthDelta === null || growthDelta === 0
      ? undefined
      : growthDelta > 0
        ? `↑${growthDelta}`
        : `↓${Math.abs(growthDelta)}`;

  const metrics: Metric[] = [
    {
      label: "Growth Score",
      value: growthScore?.toString() ?? "—",
      valueNode: growthScore !== null ? <CountUpScore value={growthScore} /> : undefined,
      hint: deltaHint,
      href: growthScore !== null ? scoreHref : undefined,
    },
    {
      label: "Customers acquired",
      value: `${customersAcquired} / ${customersGoal}`,
      soon: true,
    },
    { label: "Opportunities found", value: opportunitiesFound.toString(), soon: true },
    { label: "Actions completed", value: `${actionsDone} / ${actionsTotal}` },
    { label: "Experiments running", value: experimentsRunning.toString(), soon: true },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <Tile key={m.label} metric={m} />
      ))}
    </section>
  );
}
