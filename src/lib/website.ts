/**
 * Deterministic technical checks against a site's HTML — the objective half
 * of the Marketing Readiness Checklist. Everything here is a plain regex/
 * fetch check, not an LLM call, so it's fast, free, and doesn't hallucinate.
 * The qualitative half (positioning, social proof, demo video, ...) is
 * Claude's job — see analysis.ts.
 */

import { assertHostReachable } from "@/lib/url";
import { SafeError } from "@/lib/errors";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_CHARS = 200_000; // guard against pathological pages
const MAX_RESPONSE_BYTES = 5_000_000; // hard read cap — servers can omit Content-Length
const MAX_REDIRECTS = 5;
const USER_AGENT = "LaunchRadarBot/0.1 (+https://launchradar.app)";

/**
 * Read a response body up to `maxBytes`, then stop — a server can stream
 * unbounded chunked data with no `Content-Length`, which `res.text()` would
 * buffer whole (memory-exhaustion DoS).
 */
async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const body = response.body;
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
        if (total >= maxBytes) {
          await reader.cancel();
          break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(concat(chunks, total));
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    if (offset + c.byteLength > total) {
      out.set(c.subarray(0, total - offset), offset);
      break;
    }
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export interface ReadinessCheck {
  key: string;
  label: string;
  status: "pass" | "fail" | "unknown";
  detail: string;
}

export interface QualitativeSignals {
  hasDemoVideo: boolean;
  hasComparisonLinks: boolean;
  testimonialKeywordHits: number;
  /** The site already shows some security assurance (a security/trust page,
   *  a cert, a disclosure policy) — so "run a security check" is redundant. */
  hasSecuritySignal: boolean;
}

/**
 * Deterministic AEO/GEO ("answer engine" / "generative engine") readiness
 * signals — do search and AI systems have clean, structured facts to extract?
 */
export interface DiscoverySignals {
  schemaTypes: string[]; // JSON-LD @type values found (Organization, SoftwareApplication, FAQPage, …)
  hasCanonical: boolean;
  h1Count: number;
  hasHeadingOutline: boolean; // h2/h3 present
  faqShaped: boolean; // FAQ markup or repeated question-style headings
  hasAnswerLede: boolean; // a definitional "<X> is a …" sentence near the top
}

export interface WebsiteSnapshot {
  url: string;
  finalUrl: string;
  html: string;
  title: string | null;
  metaDescription: string | null;
  bodyText: string; // rough tag-stripped text, truncated
  readinessChecks: ReadinessCheck[];
  qualitativeSignals: QualitativeSignals;
  discoverySignals: DiscoverySignals;
}

/**
 * Fetch a URL following redirects manually so every hop's host can be
 * re-checked against the private-address blocklist — `redirect: "follow"`
 * would let a public URL bounce to an internal one unseen.
 */
async function safeFetch(
  startUrl: string,
  timeoutMs: number,
): Promise<{ response: Response; finalUrl: string }> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertHostReachable(new URL(current).hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(current, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "manual",
      });
    } finally {
      clearTimeout(timer);
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return { response, finalUrl: current };
  }

  throw new SafeError(`Too many redirects fetching ${startUrl}`);
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Probe for a well-known path. Distinguishes "server answered, not there"
 * (fail) from "we couldn't complete the check" (unknown) so a flaky network
 * run doesn't get scored as a site with missing marketing infra.
 */
async function probePath(
  baseUrl: string,
  path: string,
): Promise<"pass" | "fail" | "unknown"> {
  try {
    const res = await fetch(new URL(path, baseUrl).toString(), {
      signal: AbortSignal.timeout(5_000),
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual",
    });
    if (res.ok) return "pass";
    if (res.status >= 300 && res.status < 400) return "pass"; // exists, just redirected
    return "fail";
  } catch {
    return "unknown";
  }
}

export async function analyzeWebsite(rawUrl: string): Promise<WebsiteSnapshot> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const { response: res, finalUrl } = await safeFetch(url, FETCH_TIMEOUT_MS);
  if (!res.ok) {
    throw new SafeError(`Could not fetch ${url} (HTTP ${res.status})`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType && !/text\/html|application\/xhtml/i.test(contentType)) {
    throw new SafeError(`${finalUrl} did not return an HTML page (${contentType}).`);
  }
  const declaredLength = Number(res.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) {
    throw new SafeError(`${finalUrl} response is too large to analyze.`);
  }
  const html = (await readCapped(res, MAX_RESPONSE_BYTES)).slice(0, MAX_HTML_CHARS);

  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  const metaDescription = extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  );
  const ogImage = extractTag(
    html,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i,
  );
  const faviconStatus: "pass" | "fail" | "unknown" =
    /<link[^>]+rel=["'](?:shortcut icon|icon)["']/i.test(html)
      ? "pass"
      : await probePath(finalUrl, "/favicon.ico");

  const hasGoogleAnalytics =
    /googletagmanager\.com\/gtag\/js|gtag\(['"]config['"]|google-analytics\.com\/analytics\.js/i.test(
      html,
    );
  const hasGTM = /googletagmanager\.com\/gtm\.js/i.test(html);
  const hasMetaPixel = /connect\.facebook\.net\/[^"']*\/fbevents\.js|fbq\(['"]init['"]/i.test(
    html,
  );
  const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const hasOgTags = /<meta[^>]+property=["']og:(title|description|image)["']/i.test(html);
  const hasCookieConsent =
    /cookieconsent|cookie-consent|cookiebot|onetrust|osano|termly/i.test(html);
  const hasEmailCapture =
    /<input[^>]+type=["']email["']|newsletter|subscribe/i.test(html);
  const sitemapStatus = await probePath(finalUrl, "/sitemap.xml");
  const robotsStatus = await probePath(finalUrl, "/robots.txt");

  // Rough signals for the *qualitative* Growth Score issues (positioning,
  // demo video, comparison pages, social proof, ...) — computed here so
  // Claude is grounded in facts rather than guessing from the URL alone.
  const hasDemoVideo =
    /youtube\.com\/embed|youtu\.be\/|player\.vimeo\.com|<video[\s>]/i.test(html);
  const hasComparisonLinks =
    /href=["'][^"']*(?:-vs-|-alternative|\/alternatives|\/compare)[^"']*["']/i.test(
      html,
    );
  const testimonialKeywordHits = (
    html.match(/testimonial|customer stor|case study|"[^"]{20,140}"\s*[-—]\s*\w/gi) ?? []
  ).length;
  const hasSecuritySignal =
    /soc\s?-?2|iso\s?27001|penetration test|pen[-\s]?test|vulnerability disclosure|security\.txt|trust cent(?:er|re)|href=["'][^"']*\/security[/"']|security (?:policy|practices|overview|whitepaper|report|compliance)/i.test(
      html,
    );

  // Discovery (AEO/GEO) signals — structured facts search & AI systems extract.
  const schemaTypes = Array.from(
    new Set(
      (html.match(/"@type"\s*:\s*"([A-Za-z]+)"/g) ?? []).map(
        (m) => m.replace(/.*"([A-Za-z]+)"$/, "$1"),
      ),
    ),
  );
  const bodyText = stripTags(html).slice(0, 15_000);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const hasHeadingOutline = /<h2[\s>]/i.test(html) && /<h3[\s>]/i.test(html);
  const faqShaped =
    schemaTypes.includes("FAQPage") ||
    schemaTypes.includes("Question") ||
    /frequently asked questions/i.test(bodyText) ||
    (html.match(/<summary[\s>]/gi) ?? []).length >= 3;
  const hasAnswerLede = /\b(is|are|helps?|lets? you|makes? it)\b/i.test(bodyText.slice(0, 400));

  const readinessChecks: ReadinessCheck[] = [
    checkResult("ga", "Google Analytics", hasGoogleAnalytics),
    checkResult("gtm", "Google Tag Manager", hasGTM),
    checkResult("meta_pixel", "Meta Pixel", hasMetaPixel),
    checkResult("og_tags", "OpenGraph tags", hasOgTags),
    checkResult("og_image", "OpenGraph image", Boolean(ogImage)),
    triCheck("sitemap", "sitemap.xml", sitemapStatus),
    triCheck("robots", "robots.txt", robotsStatus),
    checkResult("structured_data", "Structured data (JSON-LD)", hasStructuredData),
    checkResult("cookie_consent", "Cookie/privacy consent", hasCookieConsent),
    checkResult("email_capture", "Email capture form", hasEmailCapture),
    triCheck("favicon", "Favicon", faviconStatus),
    checkResult("meta_description", "Meta description", Boolean(metaDescription)),
  ];

  return {
    url,
    finalUrl,
    html,
    title,
    metaDescription,
    bodyText,
    readinessChecks,
    qualitativeSignals: {
      hasDemoVideo,
      hasComparisonLinks,
      testimonialKeywordHits,
      hasSecuritySignal,
    },
    discoverySignals: {
      schemaTypes,
      hasCanonical,
      h1Count,
      hasHeadingOutline,
      faqShaped,
      hasAnswerLede,
    },
  };
}

function checkResult(key: string, label: string, pass: boolean): ReadinessCheck {
  return {
    key,
    label,
    status: pass ? "pass" : "fail",
    detail: pass ? `${label} detected.` : `${label} not detected.`,
  };
}

function triCheck(
  key: string,
  label: string,
  status: "pass" | "fail" | "unknown",
): ReadinessCheck {
  const detail =
    status === "pass"
      ? `${label} detected.`
      : status === "fail"
        ? `${label} not detected.`
        : `${label} could not be checked.`;
  return { key, label, status, detail };
}
