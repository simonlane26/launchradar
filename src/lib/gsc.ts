import { clerkClient } from "@clerk/nextjs/server";
import { logError } from "@/lib/errors";

/**
 * Optional Google Search Console integration for the Visibility report.
 * Grounds the "Findable on Google" dimension in real ranking/impression/
 * click data instead of only on-page inference.
 *
 * No Google credential is stored anywhere in this app. Clerk holds the
 * OAuth connection (once the founder connects Google with the
 * `webmasters.readonly` scope via their Clerk account page) and refreshes
 * it; `getAccessToken` fetches a fresh token from Clerk per request. If the
 * founder hasn't connected Google (or hasn't granted that scope),
 * everything below returns `null`/`[]` rather than throwing — the
 * Visibility report runs exactly as it does today, just without the extra
 * grounding. Same "optional, fail-open" shape as `stripe.ts`/`email.ts`.
 */

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

const API_BASE = "https://www.googleapis.com/webmasters/v3";

export type GscPerformance = {
  siteUrl: string;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  /** Position 11-20 ("page 2") — closest to a quick win. Sorted by impressions desc, capped at 10. */
  strikingDistanceQueries: { query: string; position: number; impressions: number; clicks: number }[];
  /** High-impression, low-CTR pages — usually a title/meta problem. Sorted by impressions desc, capped at 10. */
  lowCtrPages: { page: string; impressions: number; ctr: number; position: number }[];
};

/**
 * A founder's Google access token, via their Clerk OAuth connection.
 * Returns `null` on anything short of a usable token — not connected, scope
 * not granted, Clerk/Google error — never throws, so callers can treat this
 * exactly like `stripe`/`resend` being null.
 */
export async function getAccessToken(clerkUserId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(clerkUserId, "oauth_google");
    const token = tokens.data?.[0]?.token;
    return token ?? null;
  } catch (err) {
    logError("gsc:getAccessToken", err);
    return null;
  }
}

/** Verified Search Console properties the connected account can read. */
export async function listSites(accessToken: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/sites`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      siteEntry?: { siteUrl: string; permissionLevel: string }[];
    };
    return (data.siteEntry ?? [])
      .filter((s) => s.permissionLevel !== "siteUnverifiedUser")
      .map((s) => s.siteUrl);
  } catch (err) {
    logError("gsc:listSites", err);
    return [];
  }
}

/**
 * Matches a project's domain against the founder's verified GSC
 * properties — handles both URL-prefix properties ("https://example.com/")
 * and domain properties ("sc-domain:example.com"). When more than one
 * verified property matches (e.g. both a domain property and an https://
 * URL-prefix one — common, since Search Console treats them separately),
 * picks the most reliable one rather than asking the founder to choose: a
 * domain property covers every protocol/subdomain/www-variant, so it's
 * preferred; otherwise https wins over http. Returns `null` only when
 * nothing matches at all.
 */
export function resolveSiteForDomain(sites: string[], domain: string): string | null {
  const bare = domain.replace(/^www\./, "").toLowerCase();
  const matches = sites.filter((s) => {
    if (s.startsWith("sc-domain:")) return s.slice("sc-domain:".length).toLowerCase() === bare;
    try {
      return new URL(s).hostname.replace(/^www\./, "").toLowerCase() === bare;
    } catch {
      return false;
    }
  });
  if (matches.length === 0) return null;
  const domainProperty = matches.find((s) => s.startsWith("sc-domain:"));
  if (domainProperty) return domainProperty;
  const https = matches.find((s) => s.startsWith("https://"));
  return https ?? matches[0];
}

type SearchAnalyticsRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function queryAnalytics(
  accessToken: string,
  siteUrl: string,
  dimension: "query" | "page",
): Promise<SearchAnalyticsRow[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await fetch(
    `${API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: [dimension],
        rowLimit: 500,
      }),
    },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { rows?: SearchAnalyticsRow[] };
  return data.rows ?? [];
}

/** Condensed 28-day performance for one property — `null` on any failure. */
export async function fetchPerformance(accessToken: string, siteUrl: string): Promise<GscPerformance | null> {
  try {
    const [queryRows, pageRows] = await Promise.all([
      queryAnalytics(accessToken, siteUrl, "query"),
      queryAnalytics(accessToken, siteUrl, "page"),
    ]);
    if (queryRows.length === 0 && pageRows.length === 0) return null;

    const totalClicks = queryRows.reduce((s, r) => s + r.clicks, 0);
    const totalImpressions = queryRows.reduce((s, r) => s + r.impressions, 0);
    const avgPosition =
      totalImpressions > 0
        ? queryRows.reduce((s, r) => s + r.position * r.impressions, 0) / totalImpressions
        : 0;

    const strikingDistanceQueries = queryRows
      .filter((r) => r.position >= 11 && r.position <= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map((r) => ({
        query: r.keys[0],
        position: Math.round(r.position * 10) / 10,
        impressions: r.impressions,
        clicks: r.clicks,
      }));

    const lowCtrPages = pageRows
      .filter((r) => r.impressions >= 20 && r.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map((r) => ({
        page: r.keys[0],
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 1000) / 10, // percent, one decimal
        position: Math.round(r.position * 10) / 10,
      }));

    return {
      siteUrl,
      totalClicks,
      totalImpressions,
      avgPosition: Math.round(avgPosition * 10) / 10,
      strikingDistanceQueries,
      lowCtrPages,
    };
  } catch (err) {
    logError("gsc:fetchPerformance", err);
    return null;
  }
}
