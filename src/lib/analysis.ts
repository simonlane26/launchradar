import { createHash } from "node:crypto";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Prisma } from "@/generated/prisma/client";
import { anthropic, MODEL_WRITE, MODEL_JUDGE } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { analyzeWebsite } from "@/lib/website";
import type { ReadinessCheck } from "@/lib/website";
import { computeScoreBreakdown, overallFromBreakdown } from "@/lib/score";
import { similarTitle } from "@/lib/action-dedup";
import { PLAN_LIMITS } from "@/lib/plan";
import { toUserMessage } from "@/lib/errors";

const ISSUE_AREAS = [
  "positioning",
  "comparison_pages",
  "demo_video",
  "seo_coverage",
  "directory_presence",
  "social_proof",
  "signup_flow",
] as const;

// `area` is a loose string at parse time — Claude occasionally emits an 8th
// entry with an off-list area, which a strict enum would reject for the whole
// response. `normalizeIssues` pins it back to the 7 canonical areas.
const IssueSchema = z.object({
  area: z.string().describe("One of: " + ISSUE_AREAS.join(", ")),
  severity: z.enum(["red", "amber", "green"]),
  summary: z.string().describe("One sentence, specific to this site — not generic advice."),
});

export type IssueArea = (typeof ISSUE_AREAS)[number];
export type NormalizedIssue = {
  area: IssueArea;
  severity: "red" | "amber" | "green";
  summary: string;
};

const NextActionSchema = z.object({
  title: z
    .string()
    .describe(
      "Imperative and specific to THIS product, e.g. 'Add lead capture to the Free Screener'.",
    ),
  category: z
    .string()
    .describe(
      "2-3 word bucket a vibe-coder recognises, e.g. 'Conversion', 'SEO', 'Social proof', 'Directories', 'Positioning', 'Content', 'Onboarding', 'Analytics'.",
    ),
  rationale: z
    .string()
    .describe("One or two sentences — why this matters for this product's growth right now."),
  detail: z.string().describe("2-4 concrete sub-steps the founder can follow to do it."),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
  deliverable: z
    .enum(["TASK", "ASSET"])
    .describe(
      "ASSET = the main output is a piece of content LaunchRadar can draft for them (a landing page, comparison page, email, post). TASK = a change the founder makes in their own product or accounts.",
    ),
  effortMinutes: z
    .number()
    .int()
    .min(5)
    .max(480)
    .describe("Rough hands-on-keyboard time to complete it."),
});

const ExtractionSchema = z.object({
  name: z.string().describe("The product/company name."),
  category: z
    .string()
    .describe("Short category label, e.g. 'B2B SaaS', 'Consumer app', 'Developer tool'."),
  icp: z
    .string()
    .describe("One or two sentences describing the ideal customer profile."),
  pricing: z
    .string()
    .describe("Short pricing summary as found on the site, or 'Not found' if absent."),
  stage: z
    .enum(["IDEA", "NEW_LAUNCH", "EARLY_TRACTION", "GROWING", "ESTABLISHED"])
    .describe("Best guess of company stage from site content (changelog, testimonials, press, etc.)."),
  competitors: z
    .array(
      z.object({
        name: z.string().describe("The competing product/company name."),
        url: z.string().describe("Their homepage URL if known, else 'Unknown'."),
        note: z.string().describe("One line — what they are and why they compete for this ICP."),
      }),
    )
    // No `.max()` — Claude reliably over-produces relative to a target
    // count for well-known products (same lesson as `issues`/`nextActions`);
    // a hard upper bound makes messages.parse() reject the whole response
    // instead of just returning a longer list. Clamped in code after parsing.
    .describe(
      "Named direct competitors an AI assistant would likely mention for this product's category and ICP — from the page (comparison links, 'vs' pages) and your own knowledge of the market. Aim for around 6-8. Empty array only if genuinely none apply.",
    ),
  issues: z
    .array(IssueSchema)
    .min(ISSUE_AREAS.length)
    .describe(
      "One entry for each of these 7 areas, no duplicates and no extras: " +
        ISSUE_AREAS.join(", "),
    ),
  nextActions: z
    .array(NextActionSchema)
    .min(3)
    .max(12)
    .describe(
      "The prioritised growth backlog — highest impact / lowest effort first. These become the founder's backlog on the dashboard, so each must be a self-contained item grounded in the issues and missing infra above.",
    ),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

/**
 * Claude occasionally returns duplicate or extra issue entries. Reduce to
 * exactly one per fixed area, in canonical order — the rest of the app
 * (scoring, UI keyed by area) assumes that shape.
 */
function normalizeIssues(raw: Extraction["issues"]): NormalizedIssue[] {
  return ISSUE_AREAS.map((area) => {
    const found = raw.find((i) => i.area === area);
    if (!found) {
      throw new Error(`Claude omitted the '${area}' issue area.`);
    }
    return { area, severity: found.severity, summary: found.summary };
  });
}

// Headline Growth Score = equal-weight mean of the 6 dimension scores, so
// "why is it 33?" on the score page reconciles with this number. Computed
// inline in runAnalysis now (it also needs the per-dimension breakdown).
// See src/lib/score.ts.

function buildPrompt(
  url: string,
  title: string | null,
  metaDescription: string | null,
  bodyText: string,
  readinessChecks: ReadinessCheck[],
  signals: { hasDemoVideo: boolean; hasComparisonLinks: boolean; testimonialKeywordHits: number },
): string {
  const failedReadiness = readinessChecks.filter((c) => c.status === "fail").map((c) => c.label);

  return `You are LaunchRadar's growth analyst. Analyze this vibe-coded app's homepage and produce a founder-facing growth assessment.

URL: ${url}
Title: ${title ?? "(none found)"}
Meta description: ${metaDescription ?? "(none found)"}

Detected technical signals (ground truth — do not contradict these):
- Demo video embedded on page: ${signals.hasDemoVideo ? "yes" : "no"}
- Comparison/alternative page links found: ${signals.hasComparisonLinks ? "yes" : "no"}
- Testimonial/case-study keyword hits: ${signals.testimonialKeywordHits}
- Marketing infra NOT detected: ${failedReadiness.length ? failedReadiness.join(", ") : "none — all detected"}

Homepage text (truncated):
"""
${bodyText}
"""

First, extract the basics from the page:
- name: the product/company name
- category: a short label (e.g. "B2B SaaS", "Consumer app", "Developer tool")
- icp: the ideal customer profile in one or two sentences
- pricing: a short summary of pricing shown on the site, or "Not found"
- stage: one of IDEA, NEW_LAUNCH, EARLY_TRACTION, GROWING, ESTABLISHED — your best guess from changelog/testimonials/press/team signals
- competitors: up to 8 named direct competitors an AI assistant would likely name for this category and ICP — pull from comparison/"vs" links on the page and from your own knowledge of the market; give each a homepage URL (or "Unknown") and a one-line note

Then assess EXACTLY these 7 issue areas — one entry each, no duplicates, no extras: positioning, comparison_pages, demo_video, seo_coverage, directory_presence, social_proof, signup_flow. Use red/amber/green severity — red = missing/broken and actively hurting growth, amber = present but weak, green = solid. Ground demo_video and comparison_pages in the detected signals above. For directory_presence and seo_coverage, judge from what's inferable on the page (structured content, clear use-case pages, footer links) since you cannot browse the wider web.

Then produce nextActions: a prioritised growth backlog of 3-7 self-contained items, ordered highest impact / lowest effort first — like a development backlog a vibe-coder would recognise. For each item:
- title: imperative and specific, naming the part of THIS product it touches
- category: a 2-3 word bucket (Conversion, SEO, Social proof, Directories, Positioning, Content, Onboarding, Analytics, ...)
- impact: HIGH / MEDIUM / LOW, tied to a specific issue or missing-infra item above
- deliverable: ASSET if the output is content LaunchRadar can draft (landing page, comparison page, email, launch post); TASK if it's a change the founder makes in their own product or accounts
- effortMinutes: realistic hands-on time
- rationale: one line on why it matters now
- detail: 2-4 concrete sub-steps
Every item must be something the founder could pick up and finish — not a theme.`;
}

// Bump to invalidate every cached analysis (e.g. after a prompt change).
const ANALYSIS_REV = "2026-09-06a";

/** Cache key for skip-if-unchanged: the extracted text + the deterministic
 *  signals that actually feed the model, not the raw HTML (which carries
 *  volatile tokens/timestamps that would defeat the cache). */
function hashSiteContent(site: {
  bodyText: string;
  readinessChecks: unknown;
  qualitativeSignals: unknown;
  discoverySignals: unknown;
}): string {
  const h = createHash("sha256");
  h.update(ANALYSIS_REV);
  for (const part of [
    site.bodyText,
    JSON.stringify(site.readinessChecks),
    JSON.stringify(site.qualitativeSignals),
    JSON.stringify(site.discoverySignals),
  ]) {
    h.update(" ");
    h.update(part);
  }
  return h.digest("hex");
}

const TopActionSchema = z.object({
  chosenIndex: z
    .number()
    .int()
    .min(0)
    .describe("0-based index into the candidate list of the single highest-leverage action to do first."),
  title: z.string().describe("Imperative and specific to THIS product."),
  rationale: z
    .string()
    .describe("Two or three sentences — the specific reason this is the one move that matters most for this product right now."),
  detail: z.string().describe("2-4 concrete sub-steps."),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

function topActionPrompt(
  project: { name: string; url: string; category: string; icp: string; pricing: string; stage: string },
  issues: NormalizedIssue[],
  readinessChecks: ReadinessCheck[],
  candidates: Extraction["nextActions"],
): string {
  const problems = issues
    .filter((i) => i.severity !== "green")
    .map((i) => `- ${i.area} (${i.severity}): ${i.summary}`)
    .join("\n");
  const missing = readinessChecks
    .filter((c) => c.status === "fail")
    .map((c) => c.label)
    .join(", ");
  const list = candidates
    .map(
      (a, i) =>
        `[${i}] ${a.title} — ${a.category}, ${a.impact} impact, ~${a.effortMinutes}min — ${a.rationale}`,
    )
    .join("\n");

  return `You are LaunchRadar's lead growth strategist. Below is a vibe-coded product, the growth problems found on its site, and candidate backlog actions another analyst drafted. Pick the ONE action that will move this product's growth most in the next week — the single highest-leverage thing, weighing impact against effort and what a solo founder can realistically finish — and sharpen it.

PRODUCT
Name: ${project.name}
URL: ${project.url}
Category: ${project.category}
ICP: ${project.icp}
Pricing: ${project.pricing}
Stage: ${project.stage}

GROWTH PROBLEMS
${problems || "(none flagged)"}

MISSING MARKETING INFRA: ${missing || "none"}

CANDIDATE ACTIONS
${list}

Return chosenIndex (the best candidate) plus a sharpened title, a rationale that names the concrete reason it matters for THIS product, 2-4 sub-steps, and an impact rating.`;
}

/** One Opus call: choose and sharpen the single best next action, and move
 *  it to the front of the backlog. Degrades to the unranked list on failure
 *  — the analysis still completes. */
async function refineTopAction(
  project: { name: string; url: string; category: string; icp: string; pricing: string; stage: string },
  issues: NormalizedIssue[],
  readinessChecks: ReadinessCheck[],
  candidates: Extraction["nextActions"],
): Promise<Extraction["nextActions"]> {
  if (candidates.length === 0) return candidates;
  try {
    const res = await anthropic.messages.parse({
      model: MODEL_JUDGE,
      max_tokens: 1200,
      output_config: { format: zodOutputFormat(TopActionSchema) },
      messages: [
        { role: "user", content: topActionPrompt(project, issues, readinessChecks, candidates) },
      ],
    });
    const pick = res.parsed_output;
    if (!pick) return candidates;
    const idx = Math.min(Math.max(0, pick.chosenIndex), candidates.length - 1);
    const chosen = candidates[idx];
    const refined: Extraction["nextActions"][number] = {
      ...chosen,
      title: pick.title.trim() || chosen.title,
      rationale: pick.rationale.trim() || chosen.rationale,
      detail: pick.detail.trim() || chosen.detail,
      impact: pick.impact,
    };
    return [refined, ...candidates.filter((_, i) => i !== idx)];
  } catch (err) {
    console.error("refineTopAction failed; using the unranked backlog:", err);
    return candidates;
  }
}

export async function runAnalysis(
  projectId: string,
  organisationId: string,
  url: string,
  opts?: { backlogSize?: number },
) {
  const analysis = await prisma.analysis.create({
    data: { projectId, organisationId, status: "RUNNING" },
  });

  try {
    const site = await analyzeWebsite(url);
    const contentHash = hashSiteContent(site);

    // Nothing changed since the last scan → copy that result forward and
    // spend nothing on the model. Old rows have `contentHash: null` so a
    // first run after this shipped always does the full analysis; bumping
    // ANALYSIS_REV in `hashSiteContent` invalidates every cached result.
    const prior = await prisma.analysis.findFirst({
      where: { projectId, status: "COMPLETE", contentHash },
      orderBy: { createdAt: "desc" },
    });
    if (prior) {
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: "COMPLETE",
          contentHash,
          growthScore: prior.growthScore,
          // A COMPLETE analysis always has these set (written together below).
          issues: prior.issues as unknown as Prisma.InputJsonValue,
          readinessChecklist: prior.readinessChecklist as unknown as Prisma.InputJsonValue,
          rawExtraction: prior.rawExtraction as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
      try {
        const priorIssues = (prior.issues as unknown as NormalizedIssue[] | null) ?? [];
        const breakdown = computeScoreBreakdown(priorIssues, site.readinessChecks);
        const trustScore = breakdown.find((d) => d.dimension === "Trust")?.score ?? 100;
        await maybeSeedSecurityAction(projectId, organisationId, analysis.id, {
          trustScore,
          hasSecuritySignal: site.qualitativeSignals.hasSecuritySignal,
        });
      } catch (secError) {
        console.error("Failed to seed security action:", secError);
      }
      return analysis.id;
    }

    const response = await anthropic.messages.parse({
      model: MODEL_WRITE,
      max_tokens: 16000,
      output_config: { format: zodOutputFormat(ExtractionSchema) },
      messages: [
        {
          role: "user",
          content: buildPrompt(
            site.finalUrl,
            site.title,
            site.metaDescription,
            site.bodyText,
            site.readinessChecks,
            site.qualitativeSignals,
          ),
        },
      ],
    });

    const extraction = response.parsed_output;
    if (!extraction) {
      throw new Error("Claude did not return a parseable extraction.");
    }
    // `competitors` has no Zod `.max()` (see the schema comment) — cap it
    // here instead, before it's stored in rawExtraction or read by
    // launch/visibility/radar.
    extraction.competitors = extraction.competitors.slice(0, 8);

    const issues = normalizeIssues(extraction.issues);
    const breakdown = computeScoreBreakdown(issues, site.readinessChecks);
    const growthScore = overallFromBreakdown(breakdown);

    // One top-tier judgment call: take Sonnet's candidate backlog and
    // sharpen the single highest-leverage action to the front.
    extraction.nextActions = await refineTopAction(
      { name: extraction.name, url: site.finalUrl, category: extraction.category, icp: extraction.icp, pricing: extraction.pricing, stage: extraction.stage },
      issues,
      site.readinessChecks,
      extraction.nextActions,
    );

    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: {
          name: extraction.name,
          category: extraction.category,
          icp: extraction.icp,
          pricing: extraction.pricing,
          stage: extraction.stage,
        },
      }),
      prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: "COMPLETE",
          growthScore,
          contentHash,
          issues: issues as unknown as Prisma.InputJsonValue,
          readinessChecklist: site.readinessChecks as unknown as Prisma.InputJsonValue,
          rawExtraction: extraction as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      }),
    ]);

    // Seed the dashboard action queue. The analysis row is already COMPLETE,
    // so a failure here must not fail the run — just log it.
    try {
      let backlogSize = opts?.backlogSize;
      if (backlogSize == null) {
        const org = await prisma.organisation.findUnique({
          where: { id: organisationId },
          select: { tier: true },
        });
        backlogSize = PLAN_LIMITS[org?.tier ?? "FREE"].backlogSize;
      }
      await seedActionsFromAnalysis(
        projectId,
        organisationId,
        analysis.id,
        extraction.nextActions,
        backlogSize,
      );
    } catch (seedError) {
      console.error("Failed to seed actions from analysis:", seedError);
    }

    try {
      const trustScore = breakdown.find((d) => d.dimension === "Trust")?.score ?? 100;
      await maybeSeedSecurityAction(projectId, organisationId, analysis.id, {
        trustScore,
        hasSecuritySignal: site.qualitativeSignals.hasSecuritySignal,
      });
    } catch (secError) {
      console.error("Failed to seed security action:", secError);
    }

    return analysis.id;
  } catch (error) {
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "FAILED",
        errorMessage: toUserMessage(
          "runAnalysis",
          error,
          "We couldn't finish analysing this site. This is usually temporary — try again.",
        ),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Turn an analysis's `nextActions` into `Action` rows on the project's
 * dashboard queue. Re-analyses only top the open queue back up to
 * `backlogSize` (the tier's `PLAN_LIMITS[...].backlogSize` — 3 on Free, 6
 * otherwise) and skip anything resembling an action that already exists
 * (open, done, or skipped) — so the founder's queue doesn't balloon with
 * near-duplicates every time they re-scan.
 */
async function seedActionsFromAnalysis(
  projectId: string,
  organisationId: string,
  analysisId: string,
  nextActions: Extraction["nextActions"],
  backlogSize: number,
) {
  const existing = await prisma.action.findMany({
    where: { projectId },
    select: { title: true, status: true },
  });
  const openCount = existing.filter((a) => a.status === "TODO").length;
  const slots = Math.max(0, backlogSize - openCount);
  if (slots === 0) return;

  const blockTitles = existing.map((a) => a.title);
  const fresh: Extraction["nextActions"] = [];
  for (const a of nextActions) {
    if (fresh.length >= slots) break;
    if (blockTitles.some((t) => similarTitle(t, a.title))) continue;
    if (fresh.some((f) => similarTitle(f.title, a.title))) continue;
    fresh.push(a);
  }
  if (fresh.length === 0) return;

  await prisma.action.createMany({
    data: fresh.map((a, i) => ({
      projectId,
      organisationId,
      analysisId,
      source: "ANALYSIS" as const,
      title: a.title,
      detail: a.detail,
      rationale: a.rationale,
      category: a.category,
      impact: a.impact,
      deliverable: a.deliverable,
      effortMinutes: a.effortMinutes,
      rank: openCount + i,
    })),
  });
}

/** Below this the Growth Score's Trust dimension is treated as clearly weak. */
const SECURITY_ACTION_TRUST_THRESHOLD = 67;
const VIBECHECK_URL = process.env.VIBECHECK_URL?.trim();

/**
 * Seeds one Trust-category Action — "Run a security check and show the
 * result", linking to VibeCheck — when the app looks unaudited: the Trust
 * dimension is weak and the site shows no security assurance of its own.
 * This isn't a cross-sell dressed as advice — a visible, independent
 * security check is a real trust signal for the people evaluating a
 * vibe-coded product (an HR manager, a SENCo, a procurement reviewer), the
 * same audiences that look for reviews and social proof.
 *
 * Only ever added once per project (any status) so it doesn't reappear after
 * the founder completes or dismisses it, and only when `VIBECHECK_URL` is
 * configured so we never ship a broken link.
 */
async function maybeSeedSecurityAction(
  projectId: string,
  organisationId: string,
  analysisId: string,
  signals: { trustScore: number; hasSecuritySignal: boolean },
) {
  if (!VIBECHECK_URL) return;
  if (signals.trustScore >= SECURITY_ACTION_TRUST_THRESHOLD) return;
  if (signals.hasSecuritySignal) return;

  const existing = await prisma.action.findFirst({
    where: { projectId, source: "SECURITY" },
    select: { id: true },
  });
  if (existing) return;

  const maxRank = await prisma.action.aggregate({
    where: { projectId },
    _max: { rank: true },
  });

  await prisma.action.create({
    data: {
      projectId,
      organisationId,
      analysisId,
      source: "SECURITY",
      title: "Run a security check and show the result",
      category: "Trust",
      detail:
        "Give buyers an independent security check they can see — a badge or a linked result on your site.",
      rationale:
        "Vibe-coded apps are widely assumed to be insecure, and your Trust score is one of your lowest. An independent security check you can point to is a concrete credibility signal for the people evaluating you — an HR manager, a SENCo, a procurement reviewer — the same audiences that look for reviews and social proof.",
      impact: "MEDIUM",
      deliverable: "TASK",
      effortMinutes: 20,
      rank: (maxRank._max.rank ?? 0) + 1,
      externalUrl: VIBECHECK_URL,
      steps: [
        "Run a free security scan of the app with VibeCheck.",
        "Fix anything critical it flags before you promote the app.",
        "Add a short line or badge to your site linking to the result, e.g. \"Independently security-checked\".",
      ] as unknown as Prisma.InputJsonValue,
    },
  });
}
