import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment automatically.
export const anthropic = new Anthropic();

/**
 * Model tiers for the analysis pipeline. Matched to what each call actually
 * needs so we're not paying Opus rates for "categorise this thread":
 *
 *  - FAST  (Haiku)  — extraction / classification substeps: query generation,
 *                     "score this candidate 0-100 on relevance".
 *  - WRITE (Sonnet) — the bulk of the writing: issue summaries, the "Why:"
 *                     rationales, visibility diagnosis text, launch copy,
 *                     how-to guides, web-search retrieval passes.
 *  - JUDGE (Opus)   — one call per analysis: takes the Sonnet-written
 *                     findings and produces the single sharpened
 *                     "next best action". The one place top-tier judgment
 *                     changes the output.
 */
export const MODEL_FAST = "claude-haiku-4-5";
export const MODEL_WRITE = "claude-sonnet-5";
export const MODEL_JUDGE = "claude-opus-5";
