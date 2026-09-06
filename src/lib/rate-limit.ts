import { headers } from "next/headers";

/**
 * Burst rate limiting for the expensive server actions (each triggers one or
 * more Claude calls). This is a backstop *on top of* the monthly plan quotas
 * in `plan.ts` — quotas cap spend over a month, this caps a flood in a
 * minute.
 *
 * Storage is a per-process Map: correct and free on a single long-lived
 * instance, but it does NOT share state across serverless invocations or
 * multiple containers. Before scaling out, swap `hit()` for Upstash Redis /
 * Vercel KV `INCR` + `EXPIRE` — the call sites don't change.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// Opportunistic cleanup so the Map can't grow unbounded on a long-lived process.
function sweep() {
  const now = Date.now();
  for (const [key, b] of buckets) if (now >= b.resetAt) buckets.delete(key);
}

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Consume one token for `key`. Returns `{ ok: false, retryAfterSec }` when
 * the caller has exceeded `limit` requests within `windowMs`.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  if (buckets.size > 5000) sweep();
  return hit(key, limit, windowMs);
}

/**
 * Best-effort client IP for rate-limit keys. Trusts `x-forwarded-for` /
 * `x-real-ip` — safe on platforms (Vercel, Railway, Cloudflare) that
 * overwrite these at the edge; behind an untrusted proxy an attacker can
 * spoof them, so IP keys are only ever a *secondary* signal here (the
 * primary key is the authenticated org id).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

/** Standard message for a throttled AI action. */
export function rateLimitMessage(retryAfterSec: number): string {
  const mins = Math.ceil(retryAfterSec / 60);
  return `You're doing that too fast. Try again in ${mins <= 1 ? "a minute" : `${mins} minutes`}.`;
}
