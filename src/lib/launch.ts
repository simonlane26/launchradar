import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Prisma } from "@/generated/prisma/client";
import { anthropic, ANALYSIS_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import type { Extraction } from "@/lib/analysis";
import type { ReadinessCheck } from "@/lib/website";
import { SafeError, toUserMessage } from "@/lib/errors";

/**
 * Phase 2 — Launch Mode. Turns a completed Analysis into a curated 30-day
 * launch campaign. The differentiator (per docs/CONCEPT.md) is judgment:
 * every channel gets an explicit go/skip verdict, most directories are
 * marked "skip", and the copy is ready to post — not a generic checklist.
 */

const CHANNELS = [
  "product_hunt",
  "hacker_news",
  "indie_hackers",
  "reddit",
  "linkedin",
  "x_twitter",
  "tiktok",
  "youtube_shorts",
  "directories",
  "cold_email",
  "communities",
  "seo_pages",
  "comparison_pages",
  "press",
  "micro_influencers",
] as const;

export type LaunchChannel = (typeof CHANNELS)[number];

export const CHANNEL_LABEL: Record<LaunchChannel, string> = {
  product_hunt: "Product Hunt",
  hacker_news: "Hacker News (Show HN)",
  indie_hackers: "Indie Hackers",
  reddit: "Reddit",
  linkedin: "LinkedIn",
  x_twitter: "X / Twitter",
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  directories: "Directory submissions",
  cold_email: "Cold email / outbound",
  communities: "Communities (Slack/Discord/forums)",
  seo_pages: "SEO landing pages",
  comparison_pages: "Comparison / alternative pages",
  press: "Press / newsletters",
  micro_influencers: "Micro-influencers",
};

const ChannelVerdictSchema = z.object({
  channel: z.enum(CHANNELS),
  verdict: z.enum(["go", "skip"]),
  priority: z
    .enum(["high", "medium", "low"])
    .describe("Rough effort ranking among the 'go' channels; use 'low' for anything marked 'skip'."),
  effort: z.enum(["low", "medium", "high"]).describe("How much founder time this channel needs."),
  rationale: z
    .string()
    .describe(
      "One or two sentences, specific to THIS product's category, ICP and stage — why it's worth the founder's time this launch, or why to skip it for now.",
    ),
});

const LaunchTaskSchema = z.object({
  day: z.string().describe("e.g. 'Day 1', 'Day 3-4', 'Day 10'."),
  title: z.string().describe("Short imperative headline."),
  detail: z.string().describe("1-2 sentences, concrete enough to act on."),
});

const LaunchWeekSchema = z.object({
  week: z.number().int().min(1).max(4),
  theme: z.string().describe("Short label for the week's focus, e.g. 'Warm-up & assets'."),
  tasks: z.array(LaunchTaskSchema).min(2).max(6),
});

const LaunchAssetSchema = z.object({
  key: z
    .string()
    .describe("Short kebab-case slug, e.g. 'ph-tagline', 'show-hn-post', 'founder-story'."),
  channel: z.enum(CHANNELS),
  format: z.string().describe("e.g. 'tagline', 'forum post', 'email', 'x thread', 'outreach DM'."),
  title: z.string().describe("What this asset is, in a few words."),
  body: z
    .string()
    .describe(
      "Ready-to-post copy for THIS product — real text, no placeholders. Separate the posts of a thread with a blank line.",
    ),
});

const DirectorySchema = z.object({
  name: z.string(),
  url: z.string().describe("Best-known submission URL, or the directory's homepage."),
  category: z.string().describe("e.g. 'General', 'AI tools', 'Dev tools', 'SaaS', 'No-code'."),
  submit: z
    .boolean()
    .describe("true = actually worth submitting this product here; false = well-known but skip it."),
  rationale: z.string().describe("One sentence — why submit, or why it's not worth the time."),
});

const LaunchPlanSchema = z.object({
  summary: z
    .string()
    .describe(
      "One paragraph: the overall launch approach for THIS specific product — the headline judgment a founder should take away, including what you are deliberately NOT doing.",
    ),
  channels: z
    .array(ChannelVerdictSchema)
    .min(CHANNELS.length)
    .describe(
      "One verdict for each channel, no duplicates and no extras: " + CHANNELS.join(", "),
    ),
  schedule: z
    .array(LaunchWeekSchema)
    .min(4)
    .describe("A 4-week (30-day) launch timeline — exactly weeks 1, 2, 3 and 4, one entry each."),
  assets: z
    .array(LaunchAssetSchema)
    .min(4)
    .max(12)
    .describe("Ready-to-use launch copy — only for channels marked 'go'."),
  directories: z
    .array(DirectorySchema)
    .min(8)
    .max(20)
    .describe(
      "Relevant directories with an explicit submit/skip for each. Most products only benefit from 10-15 submissions — mark the rest 'skip'.",
    ),
});

export type LaunchPlanOutput = z.infer<typeof LaunchPlanSchema>;
export type ChannelVerdict = z.infer<typeof ChannelVerdictSchema>;
export type LaunchWeek = z.infer<typeof LaunchWeekSchema>;
export type LaunchAsset = z.infer<typeof LaunchAssetSchema>;
export type LaunchDirectory = z.infer<typeof DirectorySchema>;

/** Reduce Claude's channel list to exactly one verdict per fixed channel. */
function normalizeChannels(raw: ChannelVerdict[]): ChannelVerdict[] {
  return CHANNELS.map((channel) => {
    const found = raw.find((c) => c.channel === channel);
    if (!found) throw new Error(`Launch plan omitted the '${channel}' channel.`);
    return found;
  });
}

/** Reduce Claude's schedule to exactly weeks 1–4 in order. */
function normalizeSchedule(raw: LaunchWeek[]): LaunchWeek[] {
  return [1, 2, 3, 4].map((week) => {
    const found = raw.find((w) => w.week === week);
    if (!found) throw new Error(`Launch plan omitted week ${week}.`);
    return found;
  });
}

function buildLaunchPrompt(project: {
  name: string | null;
  url: string;
  category: string | null;
  icp: string | null;
  pricing: string | null;
  stage: string;
}, extraction: Extraction | null, readiness: ReadinessCheck[]): string {
  const failedInfra = readiness
    .filter((c) => c.status === "fail")
    .map((c) => c.label)
    .join(", ");

  const issueLines = extraction
    ? extraction.issues.map((i) => `- ${i.area}: ${i.severity} — ${i.summary}`).join("\n")
    : "(no analysis issues available)";

  return `You are LaunchRadar's launch strategist. Build a curated 30-day launch campaign for this vibe-coded app.

PRODUCT
Name: ${project.name ?? "(unknown)"}
URL: ${project.url}
Category: ${project.category ?? "(unknown)"}
ICP: ${project.icp ?? "(unknown)"}
Pricing: ${project.pricing ?? "(unknown)"}
Stage: ${project.stage}

GROWTH ANALYSIS FINDINGS
${issueLines}
Marketing infra still missing: ${failedInfra || "none detected"}

YOUR JOB — judgment, not a generic checklist:
1. For EVERY channel, give an explicit go/skip verdict with a rationale tied to THIS product's category, ICP and stage. A developer tool, a consumer app and a B2B SaaS each need very different channels — it is expected and good to mark several channels "skip". Say why the skip is right for now.
2. Produce a 4-week (30-day) timeline. Week themes should build on each other (e.g. warm-up/assets → soft launch/communities → main launch day → follow-up/iterate). Only schedule work for channels you marked "go".
3. Write ready-to-post copy for the "go" channels — real sentences about ${project.name ?? "this product"}, not templated placeholders. Cover the ones that matter for this product (which may include: Product Hunt tagline + first comment, Show HN post, Indie Hackers post, 1-2 Reddit posts for named subreddits, a LinkedIn launch post, an X launch thread, a founder story, a launch email). Skip assets for channels you're skipping.
4. Give 8-20 directories with an explicit submit/skip each. Assume only ~10-15 submissions are worth the founder's time; mark the rest "skip" with a one-line reason.

Be specific: name real subreddits, real directories, real communities. Ground everything in the product's actual category and ICP.`;
}

export async function runLaunchPlan(projectId: string, organisationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId },
    include: {
      analyses: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new SafeError("Project not found.");
  }

  const analysis = project.analyses[0];
  if (!analysis) {
    throw new SafeError("Run a growth analysis first — Launch Mode builds on its findings.");
  }

  const plan = await prisma.launchPlan.create({
    data: {
      projectId: project.id,
      organisationId,
      analysisId: analysis.id,
      status: "RUNNING",
    },
  });

  try {
    const extraction = (analysis.rawExtraction as unknown as Extraction | null) ?? null;
    const readiness =
      (analysis.readinessChecklist as unknown as ReadinessCheck[] | null) ?? [];

    // Streamed: the full plan (channel verdicts + 30-day schedule + copy +
    // directory list) is a large generation, and the SDK rejects a
    // non-streaming request whose worst-case time could exceed 10 minutes.
    const stream = anthropic.messages.stream({
      model: ANALYSIS_MODEL,
      max_tokens: 32000,
      output_config: { format: zodOutputFormat(LaunchPlanSchema) },
      messages: [
        {
          role: "user",
          content: buildLaunchPrompt(project, extraction, readiness),
        },
      ],
    });
    const message = await stream.finalMessage();

    const output = message.parsed_output;
    if (!output) {
      throw new Error("Claude did not return a parseable launch plan.");
    }

    const channels = normalizeChannels(output.channels);
    const schedule = normalizeSchedule(output.schedule);

    await prisma.launchPlan.update({
      where: { id: plan.id },
      data: {
        status: "COMPLETE",
        summary: output.summary,
        channels: channels as unknown as Prisma.InputJsonValue,
        schedule: schedule as unknown as Prisma.InputJsonValue,
        assets: output.assets as unknown as Prisma.InputJsonValue,
        directories: output.directories as unknown as Prisma.InputJsonValue,
        rawOutput: output as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return plan.id;
  } catch (error) {
    await prisma.launchPlan.update({
      where: { id: plan.id },
      data: {
        status: "FAILED",
        errorMessage: toUserMessage("runLaunchPlan", error, "We couldn't generate the launch plan. Try again in a minute."),
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
