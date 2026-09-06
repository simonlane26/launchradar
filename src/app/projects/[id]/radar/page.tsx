import { notFound } from "next/navigation";
import { IconFlame, IconExternalLink } from "@tabler/icons-react";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { RadarScan } from "@/components/radar-scan";
import { ensureProductProfile, type Profile } from "@/lib/radar";
import { quota, limitsForOrg, formatLimit } from "@/lib/plan";
import { ScanButton, ProfileEditor, OpportunityActions } from "./radar-buttons";

function relativeTime(date: Date | null): string | null {
  if (!date) return null;
  const ms = Date.now() - date.getTime();
  const hours = ms / 3_600_000;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

type Bucket = { label: string; className: string; dotColor: string | null };

function bucket(score: number): Bucket {
  if (score >= 80) return { label: "HIGH INTENT", className: "text-red-600 dark:text-red-400", dotColor: null };
  if (score >= 60)
    return { label: "GOOD FIT", className: "text-amber-600 dark:text-amber-400", dotColor: "bg-amber-500" };
  return { label: "WORTH WATCHING", className: "text-yellow-600 dark:text-yellow-500", dotColor: "bg-yellow-500" };
}

/** High-intent gets the flame; the other two buckets use the same coloured-dot
 *  convention as impact badges elsewhere in the app (action-format.ts). */
function BucketIcon({ bucket }: { bucket: Bucket }) {
  if (!bucket.dotColor) return <IconFlame size={16} className={bucket.className} />;
  return <span className={`h-2.5 w-2.5 rounded-full ${bucket.dotColor}`} />;
}

const INTENT_LABEL: Record<string, string> = {
  RECOMMENDATION_REQUEST: "Looking for a recommendation",
  PROBLEM_FRUSTRATION: "Frustrated with the problem",
  COMPETITOR_DISSATISFACTION: "Unhappy with a competitor",
  PURCHASE_RESEARCH: "Researching a purchase",
  OTHER: "Other",
};

export default async function RadarPage({
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
      radarScans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) notFound();

  const hasAnalysis = project.analyses.length > 0;
  const scan = project.radarScans[0];
  const profileRow = hasAnalysis ? await ensureProductProfile(project.id, organisation.id) : null;
  const profile: Profile | null = profileRow
    ? {
        audiences: (profileRow.audiences as string[] | null) ?? [],
        problems: (profileRow.problems as string[] | null) ?? [],
        alternatives: (profileRow.alternatives as string[] | null) ?? [],
        commercialIntents: (profileRow.commercialIntents as string[] | null) ?? [],
      }
    : null;

  const opportunities =
    scan?.status === "COMPLETE"
      ? await prisma.opportunity.findMany({
          where: { projectId: project.id, scanId: scan.id, status: "NEW" },
          orderBy: { opportunityScore: "desc" },
        })
      : [];

  const hot = opportunities.filter((o) => o.opportunityScore >= 80).length;
  const good = opportunities.filter((o) => o.opportunityScore >= 60 && o.opportunityScore < 80).length;
  const watch = opportunities.filter((o) => o.opportunityScore < 60).length;

  const scanQuota = await quota(organisation, "RADAR_SCAN");
  const resultQuota = await quota(organisation, "RADAR_RESULT");
  const competitorRadar = limitsForOrg(organisation).competitorRadar;

  const usageLine = (
    <p className="text-xs text-zinc-500">
      Radar scans {scanQuota.used}/{formatLimit(scanQuota.limit)} · opportunities{" "}
      {resultQuota.used}/{formatLimit(resultQuota.limit)} this month ·{" "}
      <a href="/pricing" className="underline">
        Plans
      </a>
    </p>
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Opportunity Radar
        </h1>
        <p className="text-zinc-500">Find people already looking for what you built.</p>
      </header>

      {!hasAnalysis && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Run a growth analysis first — Radar builds its search profile from its findings.
        </div>
      )}

      {profile && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-lg font-medium">What Radar is searching for</h2>
          <ProfileEditor projectId={project.id} profile={profile} />
        </section>
      )}

      {profile && !scan && (
        <section className="flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">
            Radar searches for the circumstances that create a customer — not your product name —
            across 16 intent queries, then scores and ranks what it finds. Takes a few minutes.
          </p>
          <ScanButton projectId={project.id} atLimit={scanQuota.atLimit} />
          {usageLine}
        </section>
      )}

      {scan?.status === "RUNNING" || scan?.status === "PENDING" ? (
        <RadarScan title="Scanning for opportunities" />
      ) : null}

      {scan?.status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Scan failed: {scan.errorMessage}
        </div>
      )}

      {scan?.status === "COMPLETE" && (
        <>
          <section className="flex flex-wrap items-center gap-4">
            <p className="text-lg font-medium">{opportunities.length} new opportunities</p>
            <p className="flex items-center gap-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <IconFlame size={14} className="text-red-500" /> {hot} High Intent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {good} Good Fit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> {watch} Worth Watching
              </span>
            </p>
          </section>

          {opportunities.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nothing scored high enough this time. Try re-scanning later, or edit the profile above
              if it&apos;s not capturing how your customers actually talk about this problem.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {opportunities.map((o) => {
                const b = bucket(o.opportunityScore);
                const posted = relativeTime(o.publishedAt);
                return (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center gap-1.5">
                      <BucketIcon bucket={b} />
                      <span className={`text-sm font-semibold ${b.className}`}>
                        {o.opportunityScore} — {b.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                      {o.source}
                      {posted ? ` · ${posted}` : ""}
                    </p>
                    <p className="mt-2 text-sm italic text-zinc-700 dark:text-zinc-300">
                      &ldquo;{o.title}&rdquo;
                    </p>
                    {o.excerpt && (
                      <p className="mt-1 text-sm text-zinc-500">{o.excerpt}</p>
                    )}

                    {o.intent === "COMPETITOR_DISSATISFACTION" && o.competitorName ? (
                      <div className="mt-3 rounded-lg border border-dashed border-red-300 bg-red-50/40 p-3 text-sm dark:border-red-900 dark:bg-red-950/20">
                        <p>
                          <span className="font-medium">Competitor:</span> {o.competitorName}
                        </p>
                        {o.advantage && (
                          <p>
                            <span className="font-medium">Your advantage:</span> {o.advantage}
                          </p>
                        )}
                      </div>
                    ) : o.intent === "COMPETITOR_DISSATISFACTION" && !competitorRadar ? (
                      <p className="mt-3 text-xs text-zinc-500">
                        Competitor Radar names the rival and your angle on it —{" "}
                        <a href="/pricing" className="underline">
                          a Builder feature
                        </a>
                        .
                      </p>
                    ) : null}

                    <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                      <p className="font-medium">Why this matters</p>
                      <p className="text-zinc-600 dark:text-zinc-400">{o.aiReason}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {INTENT_LABEL[o.intent] ?? o.intent} · Product fit {o.productFit}% · Problem
                        match {o.problemMatch}%
                      </p>
                    </div>

                    <div className="mt-3">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        View discussion <IconExternalLink size={14} />
                      </a>
                    </div>

                    <OpportunityActions opportunityId={o.id} />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <ScanButton projectId={project.id} label="Re-scan" atLimit={scanQuota.atLimit} />
              <span className="text-xs text-zinc-500">
                Last scan: {scan.completedAt?.toLocaleString() ?? scan.createdAt.toLocaleString()}
              </span>
            </div>
            {usageLine}
          </div>
        </>
      )}
    </div>
  );
}
