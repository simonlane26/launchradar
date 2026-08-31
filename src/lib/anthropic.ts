import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment automatically.
export const anthropic = new Anthropic();

// Single place to change model/effort defaults for the analysis pipeline.
export const ANALYSIS_MODEL = "claude-opus-5";
