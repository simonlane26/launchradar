import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Prisma } from "@/generated/prisma/client";
import { anthropic, ANALYSIS_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { analyzeWebsite } from "@/lib/website";
import type { ReadinessCheck, DiscoverySignals } from "@/lib/website";
import type { Extraction } from "@/lib/analysis";
import { similarTitle } from "@/lib/action-dedup";
import { domainOf } from "@/lib/url";
import { PLAN_LIMITS, type PlanLimits } from "@/lib/plan";
import { SafeError, toUserMessage } from "@/lib/errors";

/**
 * Phase 3a — "How easy are you to find?" Deterministic on-site AEO/GEO
 * checks + a Claude-scored 5-dimension breakdown + a live AI Visibility test
 * (ICP prompts run through web-search-grounded Claude, brand vs competitor
 * mention/citation). Findings seed Actions on the Growth Backlog.
 *
 * The founder never has to learn SEO/AEO/GEO — dimensions are plain-language;
 * the acronym is a footnote in each detail line.
 */

const QUERY_COUNT = 8;

export const DIMENSION_KEYS = [
  "google_search",
  "ai_answers",
  "brand_authority",
  "community_presence",
  "directory_presence",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABEL: Record<DimensionKey, { label: string; acronym: string }> = {
  google_search: { label: "Findable on Google", acronym: "SEO" },
  ai_answers: { label: "AI answer-ready", acronym: "AEO" },
  brand_authority: { label: "Brand authority", acronym: "GEO" },
  community_presence: { label: "Community presence", acronym: "Communities" },
  directory_presence: { label: "Directory presence", acronym: "Directories" },
};

/**
 * Best-effort map from an Action's free-text `category` to a visibility
 * dimension — used to fold pre-existing/general backlog items into the
 * "N actions address this" counts on the Visibility page without requiring
 * every action to have been created by this module.
 */
export function categoryToVisibilityDimension(category: string): DimensionKey | null {
  const c = category.toLowerCase();
  if (/director|listing|marketplace|g2|capterra|alternativeto/.test(c)) return "directory_presence";
  if (/faq|structured data|schema|semantic|answer/.test(c)) return "ai_answers";
  if (/comparison|brand authority|credib|entity|\bpr\b|press|\bgeo\b/.test(c)) return "brand_authority";
  if (/communit|forum|discord|slack|social media/.test(c)) return "community_presence";
  if (/seo|sitemap|robots|canonical|on-?page|keyword/.test(c)) return "google_search";
  if (/content/.test(c)) return "ai_answers";
  return null;
}

/**
 * Does this Action address the given visibility dimension? An explicit
 * `visibilityDimension` tag (set when the action was generated from a
 * dimension's diagnosis, or seeded from a visibility finding) wins; falls
 * back to the category heuristic so untagged/general backlog items still
 * count where they obviously apply.
 */
export function actionMatchesDimension(
  action: { category: string; visibilityDimension: string | null },
  key: DimensionKey,
): boolean {
  if (action.visibilityDimension) return action.visibilityDimension === key;
  return categoryToVisibilityDimension(action.category) === key;
}

const DimensionSchema = z.object({
  key: z.enum(DIMENSION_KEYS),
  score: z.number().int().min(0).max(100),
  detail: z
    .string()
    .describe("One sentence, specific to this product — what's working or missing, and why it matters."),
});

const DimensionsSchema = z
  .array(DimensionSchema)
  .min(DIMENSION_KEYS.length)
  .describe("One entry per key, no duplicates: " + DIMENSION_KEYS.join(", "));

const QuerySetSchema = z.object({
  queries: z
    .array(z.string())
    .length(QUERY_COUNT)
    .describe(
      `${QUERY_COUNT} natural-language questions a member of this product's ICP would actually type into ChatGPT/Claude/Perplexity when looking for a solution — a mix of 'best X for Y', 'alternatives to <competitor>', 'how do I <job to be done>', and any funding/scheme-specific phrasing relevant to the ICP. No brand names of THIS product.`,
    ),
});

const SuggestedActionSchema = z.object({
  title: z.string(),
  category: z.string().describe("2-3 word bucket, e.g. 'SEO', 'Content', 'Directories', 'Comparison pages'."),
  deliverable: z.enum(["TASK", "ASSET"]),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
  effortMinutes: z.number().int().min(5).max(480),
});

const GapSchema = z.object({
  severity: z.enum(["red", "amber"]),
  title: z.string().describe("Short imperative, e.g. 'Weak third-party mentions'."),
  detail: z.string().describe("1-2 sentences — the gap, grounded in the test results and on-site checks."),
  suggestedActions: z.array(SuggestedActionSchema).min(1).max(3),
});

const GapsSchema = z.object({
  gaps: z.array(GapSchema).min(2).max(4),
});

export type VisibilityDimension = {
  key: DimensionKey;
  label: string;
  acronym: string;
  score: number;
  detail: string;
};
export type OnSiteCheck = { key: string; label: string; status: "pass" | "fail" | "unknown"; detail: string };
export type VisibilityQueryResult = {
  query: string;
  answerExcerpt: string;
  brandMentioned: boolean;
  brandCited: boolean;
  competitorsMentioned: string[];
  competitorsCited: string[];
};
export type LeaderboardEntry = { name: string; appearances: number; isBrand: boolean };
export type VisibilityFinding = z.infer<typeof GapSchema>;

// --- deterministic on-site checks --------------------------------------------

function buildOnSiteChecks(
  readiness: ReadinessCheck[],
  d: DiscoverySignals,
): OnSiteCheck[] {
  const r = (key: string) => readiness.find((c) => c.key === key)?.status ?? "unknown";
  const bool = (ok: boolean): "pass" | "fail" => (ok ? "pass" : "fail");

  const orgSchema = d.schemaTypes.some((t) =>
    ["Organization", "SoftwareApplication", "Product", "WebSite"].includes(t),
  );

  return [
    { key: "sitemap", label: "sitemap.xml", status: r("sitemap"), detail: "Lets crawlers find every page." },
    { key: "robots", label: "robots.txt", status: r("robots"), detail: "Tells crawlers what they may index." },
    {
      key: "canonical",
      label: "Canonical URLs",
      status: bool(d.hasCanonical),
      detail: "Stops duplicate-URL dilution in search.",
    },
    {
      key: "org_schema",
      label: "Organization / product structured data",
      status: bool(orgSchema),
      detail: "The machine-readable 'what and who' AI systems read first.",
    },
    {
      key: "faq_schema",
      label: "FAQ / question content",
      status: bool(d.faqShaped),
      detail: "Question-and-answer blocks answer engines can lift directly.",
    },
    {
      key: "answer_lede",
      label: "Plain 'what is it' opening",
      status: bool(d.hasAnswerLede),
      detail: "A one-line definition an engine can quote.",
    },
    {
      key: "headings",
      label: "Clear heading structure",
      status: bool(d.h1Count === 1 && d.hasHeadingOutline),
      detail: d.h1Count === 1 ? "One H1, nested H2/H3." : `${d.h1Count} H1s — should be exactly one.`,
    },
    {
      key: "structured_data",
      label: "Any JSON-LD structured data",
      status: r("structured_data"),
      detail: "Baseline for rich results and entity understanding.",
    },
    {
      key: "meta_description",
      label: "Meta description",
      status: r("meta_description"),
      detail: "The snippet under your search result.",
    },
  ];
}

// --- brand / competitor detection ------------------------------------------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentioned(text: string, name: string): boolean {
  const n = name.trim();
  if (n.length < 2) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(n)}(?:$|[^a-z0-9])`, "i").test(text);
}

function cited(sourceDomains: string[], name: string, url: string | undefined): boolean {
  const target = url && url !== "Unknown" ? domainOf(url) : null;
  if (target && sourceDomains.some((d) => d === target || d.endsWith(`.${target}`) || target.endsWith(`.${d}`))) {
    return true;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return slug.length >= 4 && sourceDomains.some((d) => d.replace(/[^a-z0-9]/g, "").includes(slug));
}

// --- AI Visibility test ----------------------------------------------------

type Competitor = { name: string; url: string; note: string };

async function webSearchAnswer(query: string): Promise<{ answer: string; sourceDomains: string[] }> {
  const stream = anthropic.messages.stream({
    model: ANALYSIS_MODEL,
    max_tokens: 1500,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 2 }],
    messages: [
      {
        role: "user",
        content: `${query}\n\nAnswer as a helpful assistant would for someone choosing a product — name specific tools and link where useful.`,
      },
    ],
  });
  const message = await stream.finalMessage();

  let answer = "";
  const sourceDomains: string[] = [];
  for (const block of message.content as unknown as Array<Record<string, unknown>>) {
    if (block.type === "text") {
      answer += block.text as string;
    } else if (block.type === "web_search_tool_result") {
      const content = block.content;
      if (Array.isArray(content)) {
        for (const r of content as Array<Record<string, unknown>>) {
          const d = domainOf(String(r.url ?? ""));
          if (d) sourceDomains.push(d);
        }
      }
    }
  }

  return { answer, sourceDomains };
}

/**
 * Run one query, retrying once on a transient stream/network error. Returns
 * null if it still fails — one dead query shouldn't sink the whole test.
 */
async function runQuery(
  query: string,
  brand: string,
  competitors: Competitor[],
): Promise<VisibilityQueryResult | null> {
  let answer = "";
  let sourceDomains: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      ({ answer, sourceDomains } = await webSearchAnswer(query));
      break;
    } catch (err) {
      if (attempt === 1) {
        console.error(`Visibility query failed after retry: "${query}"`, err);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return {
    query,
    answerExcerpt: answer.trim().slice(0, 400),
    brandMentioned: mentioned(answer, brand),
    brandCited: cited(sourceDomains, brand, undefined),
    competitorsMentioned: competitors.filter((c) => mentioned(answer, c.name)).map((c) => c.name),
    competitorsCited: competitors
      .filter((c) => cited(sourceDomains, c.name, c.url))
      .map((c) => c.name),
  };
}

function aggregate(results: VisibilityQueryResult[], brand: string, competitors: Competitor[]) {
  const n = results.length || 1;
  const rate = (count: number) => Math.round((count / n) * 100);

  const brandMentions = results.filter((r) => r.brandMentioned).length;
  const brandCites = results.filter((r) => r.brandCited).length;
  const compMentionRuns = results.filter((r) => r.competitorsMentioned.length > 0).length;
  const compCiteRuns = results.filter((r) => r.competitorsCited.length > 0).length;

  const counts = new Map<string, number>();
  for (const c of competitors) counts.set(c.name, 0);
  for (const r of results) for (const name of r.competitorsMentioned) counts.set(name, (counts.get(name) ?? 0) + 1);

  const leaderboard: LeaderboardEntry[] = [
    { name: brand, appearances: brandMentions, isBrand: true },
    ...[...counts.entries()].map(([name, appearances]) => ({ name, appearances, isBrand: false })),
  ]
    .filter((e) => e.isBrand || e.appearances > 0)
    .sort((a, b) => b.appearances - a.appearances);

  return {
    brandMentionRate: rate(brandMentions),
    brandCitationRate: rate(brandCites),
    competitorMentionRate: rate(compMentionRuns),
    competitorCitationRate: rate(compCiteRuns),
    brandMentions,
    totalQueries: results.length,
    leaderboard,
  };
}

// --- prompts -------------------------------------------------------------

function contextBlock(
  project: { name: string | null; url: string; category: string | null; icp: string | null },
  competitors: Competitor[],
): string {
  return `PRODUCT
Name: ${project.name ?? "(unknown)"}
URL: ${project.url}
Category: ${project.category ?? "(unknown)"}
ICP: ${project.icp ?? "(unknown)"}
Known competitors: ${competitors.map((c) => c.name).join(", ") || "(none identified)"}`;
}

function dimensionsPrompt(
  ctx: string,
  checks: OnSiteCheck[],
): string {
  const checkLines = checks.map((c) => `- ${c.label}: ${c.status}`).join("\n");
  return `You are LaunchRadar's discoverability analyst. Score how easily this product can be found and recommended across search and AI systems.

${ctx}

On-site checks (ground truth — do not contradict):
${checkLines}

Score these 5 dimensions 0-100 for THIS product, each with a one-sentence, product-specific detail:
- google_search: can Google/Bing crawl, understand and rank it? (technical SEO, content depth, intent coverage)
- ai_answers: can answer engines lift a clean direct answer? (structured data, FAQ/Q&A content, plain definitions, semantic HTML)
- brand_authority: would generative AI understand it as a credible entity? (clear identity, third-party mentions, corroborating references)
- community_presence: is it visible where its ICP hangs out and asks questions?
- directory_presence: is it listed on the review sites / marketplaces buyers in this category check?
Base google_search / ai_answers heavily on the checks above. For the others, infer from what's on the page (footer links, badges, social links) since you cannot browse the wider web here.`;
}

function queriesPrompt(ctx: string): string {
  return `You are building an AI Visibility test for this product.

${ctx}

Produce ${QUERY_COUNT} questions a real member of this ICP would type into ChatGPT / Claude / Perplexity when looking for a solution in this space. Mix: "best <thing> for <ICP>", "alternatives to <a named competitor>", "how do I <job to be done>", and any scheme/funding/regulatory phrasing that matters for this ICP. Do NOT mention this product's own name.`;
}

function gapsPrompt(
  ctx: string,
  checks: OnSiteCheck[],
  summary: ReturnType<typeof aggregate>,
): string {
  const checkLines = checks.map((c) => `- ${c.label}: ${c.status}`).join("\n");
  return `${ctx}

AI Visibility test result (${summary.totalQueries} ICP queries run through web-grounded AI):
- This product mentioned in ${summary.brandMentions}/${summary.totalQueries} answers (${summary.brandMentionRate}%)
- Competitor appearances: ${summary.leaderboard
    .filter((l) => !l.isBrand)
    .map((l) => `${l.name} ${l.appearances}`)
    .join(", ") || "none"}

On-site checks:
${checkLines}

Identify 2-4 concrete gaps that explain why AI systems recommend competitors over this product, grounded in the data above. For each gap give 1-3 suggestedActions the founder can pick up — each with a category, deliverable (ASSET if LaunchRadar can draft the content, TASK if it's a change they make), impact and effortMinutes. Actions should be specific to this product and its market.`;
}

const DimensionActionSchema = z.object({
  title: z.string(),
  category: z.string().describe("2-3 word bucket, e.g. 'SEO', 'Structured data', 'Directories'."),
  deliverable: z.enum(["TASK", "ASSET"]),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
  effortMinutes: z.number().int().min(5).max(480),
  rationale: z.string().describe("One line — why this fixes the diagnosis below."),
});

const DimensionActionsSchema = z.object({
  actions: z
    .array(DimensionActionSchema)
    .min(1)
    .max(2)
    .describe(
      "Normally exactly 1. Only produce a second if the diagnosis clearly names two distinct, separately-doable fixes.",
    ),
});

export type DimensionAction = z.infer<typeof DimensionActionSchema>;

function dimensionActionPrompt(ctx: string, dimension: VisibilityDimension): string {
  return `${ctx}

DIMENSION: ${dimension.label} (${dimension.acronym}) — currently ${dimension.score}/100
DIAGNOSIS: ${dimension.detail}

Turn this diagnosis into a concrete backlog action the founder can pick up and finish (a second only if the diagnosis clearly names two separate, independently-doable fixes). Ground the title and rationale in the diagnosis text above — specific to this product, not generic advice.`;
}

/**
 * "No actions yet — generate some" on the Visibility page — turns one
 * dimension's diagnosis directly into backlog action(s). Tagged with that
 * dimension by the caller so the page's count updates reliably rather than
 * depending on `categoryToVisibilityDimension` guessing right.
 */
export async function generateActionsForDimension(
  project: { name: string | null; url: string; category: string | null; icp: string | null },
  dimension: VisibilityDimension,
): Promise<DimensionAction[]> {
  const response = await anthropic.messages.parse({
    model: ANALYSIS_MODEL,
    max_tokens: 1500,
    output_config: { format: zodOutputFormat(DimensionActionsSchema) },
    messages: [
      { role: "user", content: dimensionActionPrompt(contextBlock(project, []), dimension) },
    ],
  });
  return response.parsed_output?.actions ?? [];
}

// --- orchestrator --------------------------------------------------------

function overallFromDimensions(dims: VisibilityDimension[]): number {
  if (dims.length === 0) return 0;
  return Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
}

export async function runVisibilityReport(
  projectId: string,
  organisationId: string,
  limits: PlanLimits = PLAN_LIMITS.FREE,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId },
    include: {
      analyses: { where: { status: "COMPLETE" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) throw new SafeError("Project not found.");

  const analysis = project.analyses[0];
  if (!analysis) {
    throw new SafeError("Run a growth analysis first — the visibility scan builds on its findings.");
  }

  const extraction = (analysis.rawExtraction as unknown as Extraction | null) ?? null;
  const competitors: Competitor[] = (
    (extraction?.competitors as Competitor[] | undefined) ?? []
  ).filter((c) => c.name && c.name.trim().length > 1);

  const report = await prisma.visibilityReport.create({
    data: { projectId: project.id, organisationId, analysisId: analysis.id, status: "RUNNING" },
  });

  try {
    const site = await analyzeWebsite(project.url);
    const onSiteChecks = buildOnSiteChecks(site.readinessChecks, site.discoverySignals);
    const ctx = contextBlock(project, competitors);

    const dimResponse = await anthropic.messages.parse({
      model: ANALYSIS_MODEL,
      max_tokens: 4000,
      output_config: { format: zodOutputFormat(DimensionsSchema) },
      messages: [{ role: "user", content: dimensionsPrompt(ctx, onSiteChecks) }],
    });
    const rawDims = dimResponse.parsed_output;
    if (!rawDims) throw new Error("Claude did not return a parseable dimension breakdown.");

    const dimensions: VisibilityDimension[] = DIMENSION_KEYS.map((key) => {
      const found = rawDims.find((d) => d.key === key);
      if (!found) throw new Error(`Visibility scoring omitted the '${key}' dimension.`);
      return { key, ...DIMENSION_LABEL[key], score: found.score, detail: found.detail };
    });
    const overallScore = overallFromDimensions(dimensions);

    // AI Visibility test — isolated so a failure still saves the scoring above.
    let aiSummary: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
    const queries: VisibilityQueryResult[] = [];
    let findings: VisibilityFinding[] = [];

    // "Basic" Visibility (Free tier) runs the on-site dimension scoring only —
    // the live web-search AI Visibility test is a Builder feature. `aiSummary`
    // stays JsonNull, same as a test failure, and the page renders the
    // "Builder feature" note in place of the AI panel.
    if (limits.visibilityAiTest && competitors.length > 0 && project.name) {
      try {
        const qsetResponse = await anthropic.messages.parse({
          model: ANALYSIS_MODEL,
          max_tokens: 1500,
          output_config: { format: zodOutputFormat(QuerySetSchema) },
          messages: [{ role: "user", content: queriesPrompt(ctx) }],
        });
        const queryList = qsetResponse.parsed_output?.queries ?? [];

        // Run the queries concurrently — 8 sequential web-search calls would
        // take 10+ minutes.
        const settled = await Promise.all(
          queryList.map((q) => runQuery(q, project.name!, competitors)),
        );
        for (const result of settled) if (result) queries.push(result);
        if (queries.length < 3) {
          throw new Error(`Only ${queries.length}/${queryList.length} visibility queries succeeded.`);
        }

        const summary = aggregate(queries, project.name, competitors);

        const gapsResponse = await anthropic.messages.parse({
          model: ANALYSIS_MODEL,
          max_tokens: 4000,
          output_config: { format: zodOutputFormat(GapsSchema) },
          messages: [{ role: "user", content: gapsPrompt(ctx, onSiteChecks, summary) }],
        });
        findings = gapsResponse.parsed_output?.gaps ?? [];

        aiSummary = {
          brandMentionRate: summary.brandMentionRate,
          brandCitationRate: summary.brandCitationRate,
          competitorMentionRate: summary.competitorMentionRate,
          competitorCitationRate: summary.competitorCitationRate,
          leaderboard: summary.leaderboard as unknown as Prisma.InputJsonValue,
          gaps: findings.map((g) => ({ severity: g.severity, title: g.title, detail: g.detail })),
        } as unknown as Prisma.InputJsonValue;
      } catch (aiError) {
        console.error("AI Visibility test failed:", aiError);
      }
    }

    await prisma.visibilityReport.update({
      where: { id: report.id },
      data: {
        status: "COMPLETE",
        overallScore,
        dimensions: dimensions as unknown as Prisma.InputJsonValue,
        onSiteChecks: onSiteChecks as unknown as Prisma.InputJsonValue,
        queries: queries as unknown as Prisma.InputJsonValue,
        aiSummary,
        findings: findings as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return report.id;
  } catch (error) {
    await prisma.visibilityReport.update({
      where: { id: report.id },
      data: {
        status: "FAILED",
        errorMessage: toUserMessage("runVisibilityReport", error, "The visibility scan couldn't be completed. Try again shortly."),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

// --- seed Actions from findings ----------------------------------------------

/**
 * Explicit "Add all to Growth Backlog" from the Visibility page. Unlike the
 * analysis re-scan top-up, this does NOT cap the queue — the founder asked
 * for these — but still skips anything that loosely matches an existing
 * action so clicking twice doesn't duplicate.
 */
export async function seedActionsFromVisibility(reportId: string, organisationId: string) {
  const report = await prisma.visibilityReport.findFirst({
    where: { id: reportId, organisationId },
  });
  if (!report) throw new SafeError("Visibility report not found.");

  const findings = (report.findings as unknown as VisibilityFinding[] | null) ?? [];
  const suggested = findings.flatMap((f) =>
    f.suggestedActions.map((a) => ({ ...a, why: f.detail })),
  );
  if (suggested.length === 0) return 0;

  const existing = await prisma.action.findMany({
    where: { projectId: report.projectId },
    select: { title: true, rank: true },
  });
  const blockTitles = existing.map((a) => a.title);
  const startRank = existing.reduce((max, a) => Math.max(max, a.rank), 0) + 1;

  const fresh: typeof suggested = [];
  for (const a of suggested) {
    if (blockTitles.some((t) => similarTitle(t, a.title))) continue;
    if (fresh.some((f) => similarTitle(f.title, a.title))) continue;
    fresh.push(a);
  }
  if (fresh.length === 0) return 0;

  await prisma.action.createMany({
    data: fresh.map((a, i) => ({
      projectId: report.projectId,
      organisationId,
      analysisId: report.analysisId,
      source: "VISIBILITY" as const,
      title: a.title,
      detail: `From the Search & AI Visibility scan. ${a.title}`,
      rationale: a.why,
      category: a.category,
      impact: a.impact,
      deliverable: a.deliverable,
      effortMinutes: a.effortMinutes,
      rank: startRank + i,
      visibilityDimension: categoryToVisibilityDimension(a.category),
    })),
  });
  return fresh.length;
}
