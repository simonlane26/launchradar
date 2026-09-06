import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, ANALYSIS_MODEL } from "@/lib/anthropic";
import type { Action, Project } from "@/generated/prisma/client";

/**
 * The backlog CTA step of the dashboard — given one Action and the product it
 * belongs to, either draft the asset ("Create with AI") or produce a
 * do-it-now walkthrough ("Show me how"), depending on `action.deliverable`.
 * The result is cached by the caller (`Action.guide` + `Action.steps`) so a
 * founder reopening the card doesn't re-bill.
 */

function productBlock(project: Project): string {
  return `PRODUCT
Name: ${project.name ?? "(unknown)"}
URL: ${project.url}
Category: ${project.category ?? "(unknown)"}
ICP: ${project.icp ?? "(unknown)"}
Stage: ${project.stage}`;
}

function assetPrompt(project: Project, action: Action): string {
  return `You are LaunchRadar's growth agent. Draft the actual asset for this backlog item so the founder can copy, paste and ship it with light edits — do not explain how to write it, write it.

${productBlock(project)}

BACKLOG ITEM
${action.title}
Category: ${action.category}
Why it matters: ${action.rationale}

Produce ONE focused asset (if the item implies a set — several pages, a whole hub — draft the single most important piece and list the rest as follow-ups at the end):
- Lead with a one-line note on what this is and where it goes.
- Then the full draft — real headlines, real body copy, real CTAs, in the voice of a bootstrapped founder. If it's a page, include section headings and the copy under each. If it's an email or post, write the whole thing. Keep it tight: aim for under ~500 words of actual copy.
- End with 2-3 short "before you publish" edit notes (things only the founder can confirm — numbers, names, links).

Plain text, no preamble.`;
}

// No `.max()` on `steps` — a hard array-length ceiling makes messages.parse()
// hard-reject the whole response if Claude runs long, rather than just
// returning more steps (see the identical lesson in analysis.ts/radar.ts).
const WalkthroughSchema = z.object({
  goal: z.string().describe("One line: what you'll have done by the end."),
  steps: z
    .array(z.string())
    .min(3)
    .describe(
      "Each step is one concrete action the founder takes — name the specific tool, page, setting, or copy where relevant to THIS product. Aim for 4-8. If copy/text is needed (a headline, an email, a form label), write the actual words in the step, don't describe them.",
    ),
  doneWhen: z.string().describe("One line — how the founder knows they're finished."),
});

function walkthroughPrompt(project: Project, action: Action): string {
  return `You are LaunchRadar's growth agent, walking a founder through one backlog item — a short, concrete checklist they can follow right now, not background theory.

${productBlock(project)}

BACKLOG ITEM
${action.title}
Category: ${action.category}
Why it matters: ${action.rationale}
Rough effort: ${action.effortMinutes} minutes

Keep the whole thing readable in under a minute.`;
}

export type Guide = { text: string; steps: string[] | null };

export async function generateGuide(project: Project, action: Action): Promise<Guide> {
  if (action.deliverable === "ASSET") {
    const response = await anthropic.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: assetPrompt(project, action) }],
    });
    const text = response.content
      .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (!text) throw new Error("Claude returned an empty guide.");
    return { text, steps: null };
  }

  const response = await anthropic.messages.parse({
    model: ANALYSIS_MODEL,
    max_tokens: 1500,
    output_config: { format: zodOutputFormat(WalkthroughSchema) },
    messages: [{ role: "user", content: walkthroughPrompt(project, action) }],
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Claude did not return a parseable walkthrough.");

  return {
    text: `${parsed.goal}\n\nDone when: ${parsed.doneWhen}`,
    steps: parsed.steps.slice(0, 8),
  };
}
