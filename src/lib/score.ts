/**
 * Growth Score breakdown — deterministic, no LLM. Regroups the same signals
 * the analysis already produced (7 qualitative issues + technical readiness
 * checks) into 6 founder-facing dimensions, so the headline number can be
 * explained ("why is it 33?") and given a next target ("clear your backlog →
 * ~51"). Pure functions; safe to call on any stored Analysis.
 */

export const DIMENSIONS = [
  "Positioning",
  "Conversion",
  "SEO",
  "Trust",
  "Distribution",
  "Analytics",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

type IssueLike = { area: string; severity: "red" | "amber" | "green" };
type ReadinessLike = { key: string; status: "pass" | "fail" | "unknown" };

const SEVERITY_VALUE: Record<IssueLike["severity"], number> = {
  red: 0,
  amber: 0.5,
  green: 1,
};

/** Which issue areas / readiness keys feed each dimension. */
const DIMENSION_INPUTS: Record<Dimension, { issues: string[]; readiness: string[] }> = {
  Positioning: { issues: ["positioning"], readiness: [] },
  Conversion: { issues: ["signup_flow", "demo_video"], readiness: ["email_capture"] },
  SEO: {
    issues: ["seo_coverage"],
    readiness: ["sitemap", "robots", "structured_data", "meta_description"],
  },
  Trust: { issues: ["social_proof"], readiness: ["cookie_consent", "favicon"] },
  Distribution: { issues: ["directory_presence", "comparison_pages"], readiness: [] },
  Analytics: {
    issues: [],
    readiness: ["ga", "gtm", "meta_pixel", "og_tags", "og_image"],
  },
};

export type DimensionScore = { dimension: Dimension; score: number };

export function computeScoreBreakdown(
  issues: IssueLike[],
  readiness: ReadinessLike[],
): DimensionScore[] {
  return DIMENSIONS.map((dimension) => {
    const { issues: issueKeys, readiness: readinessKeys } = DIMENSION_INPUTS[dimension];
    const values: number[] = [];

    for (const key of issueKeys) {
      const issue = issues.find((i) => i.area === key);
      if (issue) values.push(SEVERITY_VALUE[issue.severity]);
    }
    for (const key of readinessKeys) {
      const check = readiness.find((c) => c.key === key);
      if (check && check.status !== "unknown") values.push(check.status === "pass" ? 1 : 0);
    }

    const score = values.length
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100)
      : 0;
    return { dimension, score };
  });
}

export function overallFromBreakdown(breakdown: DimensionScore[]): number {
  if (breakdown.length === 0) return 0;
  return Math.round(breakdown.reduce((sum, d) => sum + d.score, 0) / breakdown.length);
}

type OpenActionLike = { category: string; impact: "HIGH" | "MEDIUM" | "LOW" };

const IMPACT_BUMP: Record<OpenActionLike["impact"], number> = {
  HIGH: 18,
  MEDIUM: 10,
  LOW: 5,
};

/** Best-effort map from an Action's free-text category to a dimension. */
function categoryToDimension(category: string): Dimension | null {
  const c = category.toLowerCase();
  if (/seo|search|keyword|sitemap|structured/.test(c)) return "SEO";
  if (/convert|conversion|signup|sign-up|lead|cta|email|onboard|demo|video/.test(c))
    return "Conversion";
  if (/trust|review|testimonial|social proof|proof|credibilit/.test(c)) return "Trust";
  if (/distribut|director|comparison|compare|launch|channel|listing|outreach/.test(c))
    return "Distribution";
  if (/analytic|pixel|tag manager|tracking|measurement|og |open graph/.test(c))
    return "Analytics";
  if (/position|messaging|value prop|headline|copy|narrative/.test(c)) return "Positioning";
  return null;
}

export type ScoreProjection = {
  projected: number;
  byDimension: DimensionScore[];
};

/**
 * Rough "if you complete every open backlog item" score. Each open action
 * nudges its mapped dimension up by an impact-weighted amount (a
 * dimension-less action spreads a small bump across all six). Capped at 100
 * per dimension, then re-meaned. An estimate, labelled as such in the UI.
 */
export function projectScore(
  breakdown: DimensionScore[],
  openActions: OpenActionLike[],
): ScoreProjection {
  const bumps = new Map<Dimension, number>(DIMENSIONS.map((d) => [d, 0]));

  for (const action of openActions) {
    const dimension = categoryToDimension(action.category);
    const amount = IMPACT_BUMP[action.impact];
    if (dimension) {
      bumps.set(dimension, bumps.get(dimension)! + amount);
    } else {
      for (const d of DIMENSIONS) bumps.set(d, bumps.get(d)! + amount / DIMENSIONS.length);
    }
  }

  const byDimension: DimensionScore[] = breakdown.map(({ dimension, score }) => ({
    dimension,
    score: Math.min(100, Math.round(score + bumps.get(dimension)!)),
  }));

  return { projected: overallFromBreakdown(byDimension), byDimension };
}
