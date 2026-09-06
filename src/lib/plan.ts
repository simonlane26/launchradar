import { Tier, type UsageMetric } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Pricing-tier limits and monthly-usage bookkeeping — the single source of
 * truth behind the `/pricing` table. Tier lives on `Organisation.tier` (set
 * manually for now; a billing webhook will own it later). Monthly counters
 * live in the `Usage` table, keyed by (org, "YYYY-MM", metric).
 */

export type PlanLimits = {
  projects: number;
  radarScansPerMonth: number;
  radarResultsPerMonth: number;
  aiActionsPerMonth: number;
  draftRepliesPerMonth: number;
  /** OPEN_QUEUE_TARGET override for `seedActionsFromAnalysis`. */
  backlogSize: number;
  /** Free gets the on-site visibility scan only, not the live AI test. */
  visibilityAiTest: boolean;
  /** Free doesn't get the competitor-dissatisfaction treatment. */
  competitorRadar: boolean;
};

export const PLAN_LIMITS: Record<Tier, PlanLimits> = {
  FREE: {
    projects: 1,
    radarScansPerMonth: 1,
    radarResultsPerMonth: 5,
    aiActionsPerMonth: 3,
    draftRepliesPerMonth: 2,
    backlogSize: 3,
    visibilityAiTest: false,
    competitorRadar: false,
  },
  BUILDER: {
    projects: 3,
    radarScansPerMonth: 4,
    radarResultsPerMonth: 50,
    aiActionsPerMonth: 30,
    draftRepliesPerMonth: 25,
    backlogSize: 6,
    visibilityAiTest: true,
    competitorRadar: true,
  },
  GROWTH: {
    projects: 10,
    radarScansPerMonth: 20,
    radarResultsPerMonth: 250,
    aiActionsPerMonth: 150,
    draftRepliesPerMonth: 100,
    backlogSize: 6,
    visibilityAiTest: true,
    competitorRadar: true,
  },
};

export const TIER_LABEL: Record<Tier, string> = {
  FREE: "Free",
  BUILDER: "Builder",
  GROWTH: "Growth",
};

/**
 * Admin bypass — an `Organisation` row from `requireOrganisation()` carries
 * an `isAdmin` flag (from the `ADMIN_CLERK_USER_IDS` allowlist, keyed on the
 * Clerk *user* id so it follows the owner into every org). Admins get
 * unlimited metered usage and every feature gate open. `recordUsage` still
 * runs for them — it just never blocks.
 */
const ADMIN_LIMITS: PlanLimits = {
  projects: Infinity,
  radarScansPerMonth: Infinity,
  radarResultsPerMonth: Infinity,
  aiActionsPerMonth: Infinity,
  draftRepliesPerMonth: Infinity,
  backlogSize: 6,
  visibilityAiTest: true,
  competitorRadar: true,
};

/** Minimal shape the plan helpers need — the Prisma `Organisation` row
 *  (with the `isAdmin` flag `requireOrganisation()` adds) satisfies it. */
export type OrgLike = { id: string; tier: Tier; isAdmin?: boolean };

/** The limits actually in force for an org — admin bypass or the tier row. */
export function limitsForOrg(org: OrgLike): PlanLimits {
  return org.isAdmin ? ADMIN_LIMITS : PLAN_LIMITS[org.tier];
}

/** Plan name for UI — "Admin" for a bypassed org, else the tier label. */
export function planLabel(org: OrgLike): string {
  return org.isAdmin ? "Admin" : TIER_LABEL[org.tier];
}

/** `"5"`, or `"∞"` for an unlimited (admin) limit. */
export function formatLimit(n: number): string {
  return Number.isFinite(n) ? String(n) : "∞";
}

const METRIC_LIMIT: Record<UsageMetric, keyof PlanLimits> = {
  RADAR_SCAN: "radarScansPerMonth",
  RADAR_RESULT: "radarResultsPerMonth",
  AI_ACTION: "aiActionsPerMonth",
  DRAFT_REPLY: "draftRepliesPerMonth",
};

const METRIC_NOUN: Record<UsageMetric, string> = {
  RADAR_SCAN: "Radar scans",
  RADAR_RESULT: "opportunities",
  AI_ACTION: "AI actions",
  DRAFT_REPLY: "draft replies",
};

export function currentPeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function limitFor(tier: Tier, metric: UsageMetric): number {
  return PLAN_LIMITS[tier][METRIC_LIMIT[metric]] as number;
}

function limitForOrg(org: OrgLike, metric: UsageMetric): number {
  return limitsForOrg(org)[METRIC_LIMIT[metric]] as number;
}

export async function getUsage(organisationId: string, metric: UsageMetric): Promise<number> {
  const row = await prisma.usage.findUnique({
    where: {
      organisationId_period_metric: { organisationId, period: currentPeriod(), metric },
    },
    select: { count: true },
  });
  return row?.count ?? 0;
}

export async function recordUsage(organisationId: string, metric: UsageMetric, n = 1): Promise<void> {
  if (n <= 0) return;
  const period = currentPeriod();
  await prisma.usage.upsert({
    where: { organisationId_period_metric: { organisationId, period, metric } },
    create: { organisationId, period, metric, count: n },
    update: { count: { increment: n } },
  });
}

export type Quota = { used: number; limit: number; remaining: number; atLimit: boolean };

export async function quota(org: OrgLike, metric: UsageMetric): Promise<Quota> {
  const used = await getUsage(org.id, metric);
  const limit = limitForOrg(org, metric);
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, atLimit: remaining === 0 };
}

export async function projectQuota(org: OrgLike): Promise<Quota> {
  const used = await prisma.project.count({ where: { organisationId: org.id } });
  const limit = limitsForOrg(org).projects;
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, atLimit: remaining === 0 };
}

export class PlanLimitError extends Error {
  constructor(
    readonly kind: UsageMetric | "PROJECT",
    readonly tier: Tier,
    readonly used: number,
    readonly limit: number,
  ) {
    const noun = kind === "PROJECT" ? "projects" : METRIC_NOUN[kind];
    const scope = kind === "PROJECT" ? "" : " this month";
    super(
      `You've used all ${limit} ${noun}${scope} on the ${TIER_LABEL[tier]} plan. Upgrade for more.`,
    );
    this.name = "PlanLimitError";
  }
}

export async function assertQuota(org: OrgLike, metric: UsageMetric): Promise<void> {
  const q = await quota(org, metric);
  if (q.atLimit) throw new PlanLimitError(metric, org.tier, q.used, q.limit);
}

export async function assertProjectQuota(org: OrgLike): Promise<void> {
  const q = await projectQuota(org);
  if (q.atLimit) throw new PlanLimitError("PROJECT", org.tier, q.used, q.limit);
}

export { Tier };
