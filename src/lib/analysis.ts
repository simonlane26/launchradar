import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Prisma } from "@/generated/prisma/client";
import { anthropic, ANALYSIS_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { analyzeWebsite } from "@/lib/website";
import type { ReadinessCheck } from "@/lib/website";

const ISSUE_AREAS = [
  "positioning",
  "comparison_pages",
  "demo_video",
  "seo_coverage",
  "directory_presence",
  "social_proof",
  "signup_flow",
] as const;

const IssueSchema = z.object({
  area: z.enum(ISSUE_AREAS),
  severity: z.enum(["red", "amber", "green"]),
  summary: z.string().describe("One sentence, specific to this site — not generic advice."),
});

const ActionItemSchema = z.object({
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  title: z.string().describe("Short imperative headline, e.g. 'Submit to 8 SaaS directories'."),
  detail: z.string().describe("1-2 sentences of concrete detail — specific enough to act on today."),
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
  issues: z
    .array(IssueSchema)
    .length(7)
    .describe("Exactly one entry per area, in the fixed order: " + ISSUE_AREAS.join(", ")),
  actionPlan: z
    .array(ActionItemSchema)
    .min(3)
    .max(5)
    .describe("A concrete Monday-Friday 'this week' plan, prioritised by impact."),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

const SEVERITY_SCORE: Record<"red" | "amber" | "green", number> = {
  red: 0,
  amber: 0.5,
  green: 1,
};

function computeGrowthScore(
  readinessChecks: ReadinessCheck[],
  issues: Extraction["issues"],
): number {
  const readinessPassRate =
    readinessChecks.filter((c) => c.status === "pass").length / readinessChecks.length;

  const issuesScore =
    issues.reduce((sum, issue) => sum + SEVERITY_SCORE[issue.severity], 0) / issues.length;

  // Technical readiness is necessary-but-not-sufficient plumbing; the
  // qualitative growth issues carry more weight in the headline score.
  const combined = readinessPassRate * 0.4 + issuesScore * 0.6;
  return Math.round(combined * 100);
}

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

Assess the 7 fixed issue areas (positioning, comparison_pages, demo_video, seo_coverage, directory_presence, social_proof, signup_flow) using red/amber/green severity — red = missing/broken and actively hurting growth, amber = present but weak, green = solid. Ground demo_video and comparison_pages in the detected signals above. For directory_presence and seo_coverage, judge from what's inferable on the page (structured content, clear use-case pages, footer links) since you cannot browse the wider web.

Then write a concrete Monday-to-Friday action plan for THIS WEEK — specific to this product's category and ICP, not generic marketing advice. Reference the actual product name and category in at least one action.`;
}

export async function runAnalysis(projectId: string, organisationId: string, url: string) {
  const analysis = await prisma.analysis.create({
    data: { projectId, organisationId, status: "RUNNING" },
  });

  try {
    const site = await analyzeWebsite(url);

    const response = await anthropic.messages.parse({
      model: ANALYSIS_MODEL,
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

    const growthScore = computeGrowthScore(site.readinessChecks, extraction.issues);

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
          issues: extraction.issues as unknown as Prisma.InputJsonValue,
          readinessChecklist: site.readinessChecks as unknown as Prisma.InputJsonValue,
          actionPlan: extraction.actionPlan as unknown as Prisma.InputJsonValue,
          rawExtraction: extraction as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      }),
    ]);

    return analysis.id;
  } catch (error) {
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
