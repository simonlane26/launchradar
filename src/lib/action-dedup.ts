/**
 * Loose title-similarity check used everywhere Actions get seeded from an
 * LLM (`analysis.ts`, `visibility.ts`) — Claude paraphrases the same task
 * differently across runs, so an exact-string check under-deduplicates.
 */
export function titleTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function similarTitle(a: string, b: string): boolean {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter) >= 0.5;
}
