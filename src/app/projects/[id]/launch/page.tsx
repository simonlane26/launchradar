import Link from "next/link";
import { notFound } from "next/navigation";
import { IconCheck, IconX } from "@tabler/icons-react";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import {
  CHANNEL_LABEL,
  type ChannelVerdict,
  type LaunchWeek,
  type LaunchAsset,
  type LaunchDirectory,
  type LaunchChannel,
} from "@/lib/launch";
import { LaunchButton } from "./launch-button";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export default async function LaunchPage({
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
        take: 1,
      },
      launchPlans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!project) notFound();

  const hasAnalysis = project.analyses.length > 0;
  const plan = project.launchPlans[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Launch Mode
        </h1>
        <p className="text-zinc-500">A curated 30-day launch campaign for this product.</p>
      </header>

      {!hasAnalysis && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Run a growth analysis first — Launch Mode builds on its findings.{" "}
          <Link href={`/projects/${project.id}`} className="underline">
            Back to the project
          </Link>
          .
        </div>
      )}

      {hasAnalysis && !plan && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">
            Generate a 30-day plan: which channels to use (and which to skip), a
            week-by-week schedule, ready-to-post copy, and a curated directory list.
          </p>
          <LaunchButton projectId={project.id} />
        </div>
      )}

      {plan?.status === "RUNNING" || plan?.status === "PENDING" ? (
        <p className="text-zinc-500">Building your launch plan — refresh in a moment.</p>
      ) : null}

      {plan?.status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Launch plan generation failed: {plan.errorMessage}
        </div>
      )}

      {plan?.status === "COMPLETE" && (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-lg font-medium">The strategy</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {plan.summary}
            </p>
          </section>

          <ChannelTable channels={plan.channels as unknown as ChannelVerdict[]} />
          <Schedule weeks={plan.schedule as unknown as LaunchWeek[]} />
          <Assets assets={plan.assets as unknown as LaunchAsset[]} />
          <Directories directories={plan.directories as unknown as LaunchDirectory[]} />

          <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <LaunchButton projectId={project.id} label="Regenerate plan" />
            <span className="text-xs text-zinc-500">
              Generated {plan.completedAt?.toLocaleString() ?? plan.createdAt.toLocaleString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function ChannelTable({ channels }: { channels: ChannelVerdict[] }) {
  const go = channels
    .filter((c) => c.verdict === "go")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const skip = channels.filter((c) => c.verdict === "skip");

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Channels</h2>
      <div className="flex flex-col gap-2">
        {go.map((c) => (
          <div
            key={c.channel}
            className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"
          >
            <div className="flex items-center gap-2">
              <IconCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">{CHANNEL_LABEL[c.channel as LaunchChannel] ?? c.channel}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {c.priority} priority
              </span>
              <span className="text-xs text-zinc-500">· {c.effort} effort</span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.rationale}</p>
          </div>
        ))}
        {skip.map((c) => (
          <div
            key={c.channel}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-center gap-2">
              <IconX size={16} className="text-zinc-400" />
              <span className="font-medium text-zinc-500">
                {CHANNEL_LABEL[c.channel as LaunchChannel] ?? c.channel}
              </span>
              <span className="text-xs uppercase tracking-wide text-zinc-400">skip</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{c.rationale}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Schedule({ weeks }: { weeks: LaunchWeek[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">30-day schedule</h2>
      <div className="flex flex-col gap-4">
        {[...weeks]
          .sort((a, b) => a.week - b.week)
          .map((w) => (
            <div
              key={w.week}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Week {w.week} — {w.theme}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {w.tasks.map((t, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{t.day}: {t.title}</span>
                    <span className="block text-zinc-600 dark:text-zinc-400">{t.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}

function Assets({ assets }: { assets: LaunchAsset[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Ready-to-post copy</h2>
      <div className="flex flex-col gap-3">
        {assets.map((a) => (
          <details
            key={a.key}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <summary className="cursor-pointer font-medium">
              {a.title}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {CHANNEL_LABEL[a.channel as LaunchChannel] ?? a.channel} · {a.format}
              </span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">
              {a.body}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}

function Directories({ directories }: { directories: LaunchDirectory[] }) {
  const submit = directories.filter((d) => d.submit);
  const skip = directories.filter((d) => !d.submit);

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">
        Directories — submit to {submit.length}, skip {skip.length}
      </h2>
      <ul className="flex flex-col gap-2">
        {submit.map((d) => (
          <li
            key={d.name}
            className="flex items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <IconCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                {d.name}
              </a>
              <span className="ml-2 text-xs text-zinc-500">{d.category}</span>
              <p className="text-zinc-600 dark:text-zinc-400">{d.rationale}</p>
            </div>
          </li>
        ))}
        {skip.map((d) => (
          <li key={d.name} className="flex items-start gap-3 px-3 py-1 text-sm text-zinc-400">
            <IconX size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{d.name}</span>
              <span className="ml-2 text-xs">{d.rationale}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
