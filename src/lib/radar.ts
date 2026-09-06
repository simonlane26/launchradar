import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Prisma } from "@/generated/prisma/client";
import { anthropic, ANALYSIS_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { domainOf } from "@/lib/url";
import type { Extraction } from "@/lib/analysis";
import { PLAN_LIMITS, getUsage, recordUsage, type PlanLimits } from "@/lib/plan";
import { toUserMessage } from "@/lib/errors";

/**
 * Phase 3 — Opportunity Radar. Finds people already showing buying intent
 * for the problem this product solves — searching for the *circumstances*
 * ("I have dyslexia and writing emails at work takes forever"), not the
 * product name. Pipeline: ProductProfile → intent queries → web search per
 * query → cheap filter → one batched AI classification → score in code →
 * save. See CLAUDE.md "Data model (Phase 3)" for the full shape and the
 * V1 scope notes (web search stands in for a real Reddit provider; the
 * feedback loop is a weight nudge, not ML).
 */

type ExtractionCompetitor = { name: string; url: string; note: string };

export type Profile = {
  audiences: string[];
  problems: string[];
  alternatives: string[];
  commercialIntents: string[];
};

export type RawResult = {
  source: string; // "reddit" | "web" — inferred from the result's domain
  url: string;
  title: string;
  content: string;
  author: string | null;
  publishedAt: string | null;
  queryMatched: string;
};

function toProfile(row: {
  audiences: unknown;
  problems: unknown;
  alternatives: unknown;
  commercialIntents: unknown;
}): Profile {
  return {
    audiences: (row.audiences as string[] | null) ?? [],
    problems: (row.problems as string[] | null) ?? [],
    alternatives: (row.alternatives as string[] | null) ?? [],
    commercialIntents: (row.commercialIntents as string[] | null) ?? [],
  };
}

// --- Product Intelligence Profile -------------------------------------------

// Bounds are `.min()` only, not `.max()` — Claude reliably over-produces
// relative to a target count (see the identical `issues`/`nextActions`
// lesson in analysis.ts), and a strict upper bound makes `messages.parse`
// hard-fail the whole response instead of just returning a longer list.
// Enforced lengths are clamped in code after parsing (`clamp`, below).
const ProfileSchema = z.object({
  audiences: z
    .array(z.string())
    .min(2)
    .describe("Who experiences the problem this product solves — roles/situations, not demographics. Aim for around 5."),
  problems: z
    .array(z.string())
    .min(3)
    .describe(
      "Phrased the way a real person experiencing the problem would actually type it — first person, plain language, no marketing or product jargon. E.g. 'writing emails at work takes me forever', not 'inefficient written communication'. Aim for around 8.",
    ),
  alternatives: z
    .array(z.string())
    .describe("Competitor or substitute product names. Aim for around 6."),
  commercialIntents: z
    .array(z.string())
    .min(2)
    .describe("Short phrases describing situations that signal someone is ready to buy. Aim for around 5."),
});

function clamp<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function profilePrompt(
  project: { name: string | null; url: string; category: string | null; icp: string | null },
  competitorNames: string[],
): string {
  return `You are LaunchRadar's demand-intelligence analyst. Build a profile of who experiences this product's problem and how they'd actually describe it — this profile drives search queries that find real buying-intent conversations, not just people already searching for the product's name.

PRODUCT
Name: ${project.name ?? "(unknown)"}
URL: ${project.url}
Category: ${project.category ?? "(unknown)"}
ICP: ${project.icp ?? "(unknown)"}
Known competitors: ${competitorNames.join(", ") || "(none known)"}

The critical part is "problems": write each one as a frustrated real person would actually phrase it out loud or type it into a forum post — first person, concrete, no marketing language. Someone doesn't say "inefficient written communication workflows"; they say "writing emails at work takes me forever." Get this wrong and the whole search engine downstream searches for the wrong thing.`;
}

/** Loads the project's ProductProfile, generating it once from the latest
 *  COMPLETE Analysis if it doesn't exist yet. Founder-editable afterwards. */
export async function ensureProductProfile(projectId: string, organisationId: string) {
  const existing = await prisma.productProfile.findUnique({ where: { projectId } });
  if (existing) return existing;

  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId },
    include: {
      analyses: { where: { status: "COMPLETE" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) throw new Error("Project not found.");

  const analysis = project.analyses[0];
  if (!analysis) {
    throw new Error("Run a growth analysis first — Radar builds on its findings.");
  }

  const extraction = (analysis.rawExtraction as unknown as Extraction | null) ?? null;
  const competitorNames = (
    (extraction?.competitors as unknown as ExtractionCompetitor[] | undefined) ?? []
  ).map((c) => c.name);

  const response = await anthropic.messages.parse({
    model: ANALYSIS_MODEL,
    max_tokens: 2000,
    output_config: { format: zodOutputFormat(ProfileSchema) },
    messages: [{ role: "user", content: profilePrompt(project, competitorNames) }],
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Claude did not return a parseable product profile.");

  try {
    return await prisma.productProfile.create({
      data: {
        projectId,
        organisationId,
        audiences: clamp(parsed.audiences, 8) as unknown as Prisma.InputJsonValue,
        problems: clamp(parsed.problems, 10) as unknown as Prisma.InputJsonValue,
        alternatives: clamp(
          parsed.alternatives.length ? parsed.alternatives : competitorNames,
          8,
        ) as unknown as Prisma.InputJsonValue,
        commercialIntents: clamp(parsed.commercialIntents, 8) as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // This runs on page render, which React/Next can invoke concurrently —
    // if another request won the create() race, just return what it made.
    const winner = await prisma.productProfile.findUnique({ where: { projectId } });
    if (winner) return winner;
    throw new Error("Failed to create product profile.");
  }
}

/** Founder edit of the auto-drafted profile (marks it `edited`). */
export async function updateProductProfile(
  projectId: string,
  organisationId: string,
  fields: Profile,
) {
  const profile = await prisma.productProfile.findFirst({ where: { projectId, organisationId } });
  if (!profile) throw new Error("Product profile not found.");

  return prisma.productProfile.update({
    where: { id: profile.id },
    data: {
      audiences: fields.audiences as unknown as Prisma.InputJsonValue,
      problems: fields.problems as unknown as Prisma.InputJsonValue,
      alternatives: fields.alternatives as unknown as Prisma.InputJsonValue,
      commercialIntents: fields.commercialIntents as unknown as Prisma.InputJsonValue,
      edited: true,
    },
  });
}

// --- Intent queries ----------------------------------------------------------

const INTENT_TYPES = ["BUYING", "RECOMMENDATION", "PROBLEM", "COMPETITOR_PAIN"] as const;
const QUERIES_PER_INTENT = 4;

const QuerySchema = z.object({
  query: z.string(),
  intentType: z.enum(INTENT_TYPES),
});
const QuerySetSchema = z.object({
  // No `.max()` — see the ProfileSchema comment above; over-production is
  // capped in code (`ensureRadarQueries`'s per-intent-type bucketing).
  queries: z
    .array(QuerySchema)
    .min(INTENT_TYPES.length)
    .describe(`Aim for ${QUERIES_PER_INTENT} per intent type: ` + INTENT_TYPES.join(", ")),
});

function queryGenPrompt(
  project: { name: string | null; url: string; category: string | null },
  profile: Profile,
): string {
  return `You are building the search layer of LaunchRadar's Opportunity Radar for this product.

PRODUCT
Name: ${project.name ?? "(unknown)"}
Category: ${project.category ?? "(unknown)"}
Audiences: ${profile.audiences.join(", ")}
Problems (in the audience's own words): ${profile.problems.join("; ")}
Alternatives/competitors: ${profile.alternatives.join(", ") || "(none known)"}
Buying-intent situations: ${profile.commercialIntents.join("; ")}

Generate ${QUERIES_PER_INTENT} search queries for EACH of these 4 intent types (${QUERIES_PER_INTENT * INTENT_TYPES.length} total):

- BUYING: someone actively searching for a solution — "best X for Y", "X software for Z". Can look like a normal search phrase.
- RECOMMENDATION: someone asking real people for suggestions — "can anyone recommend...", "what do you use for...". Phrase these as an actual forum question, not a search phrase.
- PROBLEM: the broadest and most valuable bucket. Someone venting about the problem itself, not asking for software — phrase these EXACTLY as a frustrated person would type them, first person, no product/category jargon (e.g. "writing emails at work takes me forever", not "seeking written communication efficiency tools").
- COMPETITOR_PAIN: someone unhappy with a named alternative — "X too expensive", "X alternative", "switch from X", using the actual competitor names above.

Every query should be something you could paste into a search engine or forum search and plausibly get a real person's post back — not a product description.`;
}

/** Loads active RadarQuery rows (persisted across scans so feedback-driven
 *  weight nudges accumulate); generates them once if none exist yet. */
export async function ensureRadarQueries(
  project: {
    id: string;
    organisationId: string;
    name: string | null;
    url: string;
    category: string | null;
  },
  profile: Profile,
) {
  const existing = await prisma.radarQuery.findMany({
    where: { projectId: project.id, active: true },
    orderBy: { weight: "desc" },
  });
  if (existing.length > 0) return existing;

  const response = await anthropic.messages.parse({
    model: ANALYSIS_MODEL,
    max_tokens: 3000,
    output_config: { format: zodOutputFormat(QuerySetSchema) },
    messages: [{ role: "user", content: queryGenPrompt(project, profile) }],
  });
  const generated = response.parsed_output?.queries ?? [];
  if (generated.length === 0) throw new Error("Claude did not return any Radar queries.");

  // Cap at QUERIES_PER_INTENT per bucket rather than requiring an exact
  // count — Claude occasionally over/under-produces one bucket.
  const byIntent = new Map<string, typeof generated>();
  for (const q of generated) {
    const list = byIntent.get(q.intentType) ?? [];
    if (list.length < QUERIES_PER_INTENT) list.push(q);
    byIntent.set(q.intentType, list);
  }
  const finalQueries = INTENT_TYPES.flatMap((t) => byIntent.get(t) ?? []);

  await prisma.radarQuery.createMany({
    data: finalQueries.map((q) => ({
      projectId: project.id,
      organisationId: project.organisationId,
      query: q.query,
      intentType: q.intentType,
    })),
  });

  return prisma.radarQuery.findMany({
    where: { projectId: project.id, active: true },
    orderBy: { weight: "desc" },
  });
}

// --- Web search provider -----------------------------------------------------

function searchPrompt(query: string, projectDomain: string): string {
  const cutoff = new Date(Date.now() - MAX_RESULT_AGE_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return `Search the web for: ${query}

You're looking for real forum posts, Reddit threads, Q&A pages, or discussions from real people — not marketing pages, not ${projectDomain || "the product's own site"}, not generic "best X tools" listicles.

Only include results published on or after ${cutoff} (roughly the last 12 months). Skip anything older, even if it looks relevant — an old thread isn't live demand.

Respond with ONLY a JSON array (no other text before or after it) of up to 6 distinct results you found, each shaped: {"url": "...", "title": "...", "excerpt": "1-3 sentences quoting or closely paraphrasing what the person actually wrote", "author": "... or null", "publishedAt": "the date the post was written, as an ISO date (YYYY-MM-DD) or a relative phrase like \\"3 months ago\\" if that's all that's shown, else null"}. If nothing relevant was found, respond with [].`;
}

function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function coerceRawResults(items: unknown[], query: string): RawResult[] {
  const out: RawResult[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    if (typeof it.url !== "string" || typeof it.title !== "string") continue;
    const excerpt = typeof it.excerpt === "string" ? it.excerpt.trim() : "";
    if (excerpt.length < 20) continue;
    const domain = domainOf(it.url) ?? "";
    out.push({
      source: domain.includes("reddit.com") ? "reddit" : "web",
      url: it.url,
      title: it.title,
      content: excerpt,
      author: typeof it.author === "string" ? it.author : null,
      publishedAt: typeof it.publishedAt === "string" ? it.publishedAt : null,
      queryMatched: query,
    });
  }
  return out;
}

async function webSearchOnce(query: string, projectDomain: string): Promise<string> {
  const stream = anthropic.messages.stream({
    model: ANALYSIS_MODEL,
    max_tokens: 2000,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    messages: [{ role: "user", content: searchPrompt(query, projectDomain) }],
  });
  const message = await stream.finalMessage();

  let text = "";
  for (const block of message.content as unknown as Array<Record<string, unknown>>) {
    if (block.type === "text") text += block.text as string;
  }
  return text;
}

/**
 * The sole V1 search provider — returns `RawResult[]` matching the same
 * shape a future Reddit-API provider would, so the rest of the pipeline
 * never has to change. Retries once on a transient stream/network error;
 * gives up (empty array) rather than sinking the whole scan.
 */
export async function webSearchProvider(query: string, projectDomain: string): Promise<RawResult[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await webSearchOnce(query, projectDomain);
      return coerceRawResults(extractJsonArray(text), query);
    } catch (err) {
      if (attempt === 1) {
        console.error(`Radar query failed after retry: "${query}"`, err);
        return [];
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return [];
}

// --- Cheap filter (no LLM) ---------------------------------------------------

const LISTICLE_RE = /\btop\s+\d+\b|\bbest\s+\d+\b/i;
const MAX_CANDIDATES = 40;

function cheapFilter(raw: RawResult[], projectDomain: string, existingUrls: Set<string>): RawResult[] {
  const seen = new Set<string>();
  const out: RawResult[] = [];
  for (const r of raw) {
    if (!r.url || seen.has(r.url) || existingUrls.has(r.url)) continue;
    if (r.content.length < 40) continue;
    if (LISTICLE_RE.test(r.title)) continue;
    if (isTooOld(r.publishedAt)) continue; // stale discussions aren't live demand
    const domain = domainOf(r.url);
    if (!domain || (projectDomain && domain === projectDomain)) continue;
    seen.add(r.url);
    out.push(r);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

// --- AI classification -------------------------------------------------------

const INTENTS = [
  "RECOMMENDATION_REQUEST",
  "PROBLEM_FRUSTRATION",
  "COMPETITOR_DISSATISFACTION",
  "PURCHASE_RESEARCH",
  "OTHER",
] as const;

const ClassificationSchema = z.object({
  url: z.string(),
  relevant: z.boolean(),
  intent: z.enum(INTENTS),
  audienceMatch: z.number().int().min(0).max(100),
  problemMatch: z.number().int().min(0).max(100),
  purchaseIntent: z.number().int().min(0).max(100),
  productFit: z.number().int().min(0).max(100),
  urgency: z.number().int().min(0).max(100),
  reason: z.string().describe("One sentence, grounded in what the person actually wrote."),
  suggestedAction: z.string().describe("What the founder should do about this one."),
  competitorName: z
    .string()
    .optional()
    .describe("Set only when intent is COMPETITOR_DISSATISFACTION."),
  advantage: z
    .string()
    .optional()
    .describe("One line — why this product is the better fit. Set only alongside competitorName."),
});

const ClassificationSetSchema = z.object({
  results: z.array(ClassificationSchema),
});

export type Classification = z.infer<typeof ClassificationSchema>;

function classifyPrompt(
  project: { name: string | null; url: string; category: string | null },
  profile: Profile,
  candidates: RawResult[],
): string {
  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. URL: ${c.url}\n   Title: ${c.title}\n   Excerpt: ${c.content}\n   Matched query: ${c.queryMatched}`,
    )
    .join("\n\n");

  return `You are LaunchRadar's Opportunity Radar analyst, judging whether each result below is a genuine buying-intent signal for this product — not whether it merely mentions the category.

PRODUCT
Name: ${project.name ?? "(unknown)"}
URL: ${project.url}
Category: ${project.category ?? "(unknown)"}
Who experiences the problem: ${profile.audiences.join(", ")}
Problems this product solves: ${profile.problems.join("; ")}
Alternatives/competitors: ${profile.alternatives.join(", ") || "(none known)"}

CANDIDATES
${list}

For each candidate (matched by its URL), decide if it's genuinely relevant — a real person showing intent related to this product's problem space, not a marketing page, listicle, or unrelated discussion. Mark clearly irrelevant candidates relevant:false rather than guessing. For relevant ones: classify intent, score the four 0-100 dimensions plus urgency, give a one-sentence reason grounded in what they actually wrote, and a suggestedAction. If they're specifically unhappy with a named alternative, set intent to COMPETITOR_DISSATISFACTION, name it in competitorName, and give a one-line advantage — why this product fits what they're asking for better.`;
}

// --- scoring -----------------------------------------------------------------

/** No real engagement signal from generic web search in V1 (upvotes/replies
 *  aren't returned) — neutral placeholder until a real provider supplies it. */
const ENGAGEMENT_PLACEHOLDER = 50;

/**
 * Parse a published-at string into a Date. Handles ISO dates and the
 * relative forms web-search snippets usually carry ("5 years ago",
 * "3 months ago", "yesterday", "last year"). Returns null if it can't tell.
 */
function parsePublishedAt(s: string | null): Date | null {
  if (!s) return null;
  const trimmed = s.trim();

  const abs = Date.parse(trimmed);
  if (!Number.isNaN(abs)) return new Date(abs);

  const lower = trimmed.toLowerCase();
  if (/^(just now|today|moments? ago|an? hour ago)$/.test(lower)) return new Date();
  if (lower === "yesterday") return new Date(Date.now() - 86_400_000);

  const UNIT_DAYS: Record<string, number> = {
    minute: 1 / 1440,
    hour: 1 / 24,
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };
  const rel = lower.match(/^(?:about |over |almost |last |a |an )?(\d+)?\s*(minute|hour|day|week|month|year)s?(?:\s+ago)?$/);
  if (rel) {
    const n = rel[1] ? Number(rel[1]) : 1;
    const days = n * (UNIT_DAYS[rel[2]] ?? 0);
    if (days > 0) return new Date(Date.now() - days * 86_400_000);
  }
  return null;
}

/** Days after which a found discussion is considered stale and not saved. */
const MAX_RESULT_AGE_DAYS = 365;

function isTooOld(publishedAt: string | null): boolean {
  const d = parsePublishedAt(publishedAt);
  if (!d) return false; // undated → let scoring handle it, don't hard-drop
  return (Date.now() - d.getTime()) / 86_400_000 > MAX_RESULT_AGE_DAYS;
}

function recencyScore(publishedAt: string | null): number {
  const d = parsePublishedAt(publishedAt);
  if (!d) return 30;
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days <= 1) return 100;
  if (days <= 7) return 80;
  if (days <= 30) return 60;
  if (days <= 90) return 40;
  if (days <= 180) return 30;
  return 20;
}

function toValidDate(s: string | null): Date | null {
  return parsePublishedAt(s);
}

/** Weights per the product spec: fit 30 / intent 25 / problem 20 / recency
 *  10 / audience 10 / engagement 5. */
function computeOpportunityScore(
  c: Pick<Classification, "productFit" | "purchaseIntent" | "problemMatch" | "audienceMatch">,
  publishedAt: string | null,
): number {
  const score =
    0.3 * c.productFit +
    0.25 * c.purchaseIntent +
    0.2 * c.problemMatch +
    0.1 * recencyScore(publishedAt) +
    0.1 * c.audienceMatch +
    0.05 * ENGAGEMENT_PLACEHOLDER;
  return Math.round(score);
}

/** Below this, an opportunity isn't saved at all — keeps the list from
 *  turning into "300 results found" noise. */
const SAVE_FLOOR = 35;

// --- orchestrator --------------------------------------------------------

export async function runRadarScan(
  projectId: string,
  organisationId: string,
  limits: PlanLimits = PLAN_LIMITS.FREE,
) {
  const project = await prisma.project.findFirst({ where: { id: projectId, organisationId } });
  if (!project) throw new Error("Project not found.");

  const profileRow = await ensureProductProfile(projectId, organisationId);
  const profile = toProfile(profileRow);
  const queries = await ensureRadarQueries(
    {
      id: project.id,
      organisationId,
      name: project.name,
      url: project.url,
      category: project.category,
    },
    profile,
  );

  const scan = await prisma.radarScan.create({
    data: { projectId, organisationId, status: "RUNNING" },
  });

  try {
    const projectDomain = domainOf(project.url) ?? "";

    const rawBatches = await Promise.all(queries.map((q) => webSearchProvider(q.query, projectDomain)));
    const raw = rawBatches.flat();

    const existingRows = await prisma.opportunity.findMany({
      where: { projectId },
      select: { url: true },
    });
    const existingUrls = new Set(existingRows.map((o) => o.url));

    const candidates = cheapFilter(raw, projectDomain, existingUrls);

    let saved = 0;
    if (candidates.length > 0) {
      const response = await anthropic.messages.parse({
        model: ANALYSIS_MODEL,
        max_tokens: 16000,
        output_config: { format: zodOutputFormat(ClassificationSetSchema) },
        messages: [{ role: "user", content: classifyPrompt(project, profile, candidates) }],
      });
      const classifications = response.parsed_output?.results ?? [];
      const byUrl = new Map(candidates.map((c) => [c.url, c]));

      const scored = classifications
        .filter((c) => c.relevant && byUrl.has(c.url))
        .map((c) => {
          const rawResult = byUrl.get(c.url)!;
          return { c, rawResult, opportunityScore: computeOpportunityScore(c, rawResult.publishedAt) };
        })
        .filter(({ opportunityScore }) => opportunityScore >= SAVE_FLOOR)
        .sort((a, b) => b.opportunityScore - a.opportunityScore);

      // Cap to what's left of this month's opportunity quota for the tier.
      const usedResults = await getUsage(organisationId, "RADAR_RESULT");
      const remainingResults = Math.max(0, limits.radarResultsPerMonth - usedResults);
      const rows = scored.slice(0, remainingResults);

      if (rows.length > 0) {
        const result = await prisma.opportunity.createMany({
          data: rows.map(({ c, rawResult, opportunityScore }) => ({
            projectId,
            organisationId,
            scanId: scan.id,
            source: rawResult.source,
            url: rawResult.url,
            title: rawResult.title,
            excerpt: rawResult.content,
            author: rawResult.author,
            publishedAt: toValidDate(rawResult.publishedAt),
            queryMatched: rawResult.queryMatched,
            intent: c.intent,
            audienceMatch: c.audienceMatch,
            problemMatch: c.problemMatch,
            purchaseIntent: c.purchaseIntent,
            productFit: c.productFit,
            urgency: c.urgency,
            aiReason: c.reason,
            suggestedAction: c.suggestedAction,
            competitorName: limits.competitorRadar ? c.competitorName ?? null : null,
            advantage: limits.competitorRadar ? c.advantage ?? null : null,
            opportunityScore,
          })),
          skipDuplicates: true,
        });
        saved = result.count;
        await recordUsage(organisationId, "RADAR_RESULT", saved);
      }
    }

    await prisma.radarScan.update({
      where: { id: scan.id },
      data: {
        status: "COMPLETE",
        queriesRun: queries.length,
        resultsFound: raw.length,
        candidates: candidates.length,
        saved,
        completedAt: new Date(),
      },
    });

    return scan.id;
  } catch (error) {
    await prisma.radarScan.update({
      where: { id: scan.id },
      data: {
        status: "FAILED",
        errorMessage: toUserMessage("runRadarScan", error, "The Radar scan couldn't be completed. Try again shortly."),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

// --- draft reply -----------------------------------------------------------

/** "Draft reply" — genuinely useful advice first, the product mentioned
 *  briefly and only if it naturally fits. Never auto-posted (see CLAUDE.md). */
export async function generateOpportunityReply(
  opportunity: { title: string; excerpt: string; aiReason: string },
  project: { name: string | null; url: string; category: string | null },
): Promise<string> {
  const response = await anthropic.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are drafting a reply to a real online post for the founder of ${project.name ?? "this product"} (${project.category ?? "a product"}, ${project.url}).

THE POST
"${opportunity.title}"
${opportunity.excerpt}

WHY THIS MATTERS
${opportunity.aiReason}

Write a short, genuinely useful reply (under 120 words) — real advice for their actual problem first. Only mention ${project.name ?? "the product"} briefly, naturally, and only if it's a real fit — don't hard-sell. Plain text, no preamble, ready to paste.`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned an empty reply.");
  return text;
}

// --- feedback ----------------------------------------------------------------

/** 👍/👎 on an opportunity nudges the RadarQuery that surfaced it — a
 *  heuristic weight adjustment (not ML) that `ensureRadarQueries`' weight
 *  ordering reflects on future scans. */
export async function recordOpportunityFeedback(
  opportunityId: string,
  organisationId: string,
  rating: "up" | "down",
) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, organisationId },
  });
  if (!opportunity) throw new Error("Opportunity not found.");

  await prisma.opportunityFeedback.create({
    data: { opportunityId, rating },
  });

  const query = await prisma.radarQuery.findFirst({
    where: { projectId: opportunity.projectId, query: opportunity.queryMatched },
  });
  if (query) {
    const delta = rating === "up" ? 0.15 : -0.25;
    const next = Math.min(2, Math.max(0.1, query.weight + delta));
    await prisma.radarQuery.update({ where: { id: query.id }, data: { weight: next } });
  }
}
