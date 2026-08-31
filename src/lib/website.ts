/**
 * Deterministic technical checks against a site's HTML — the objective half
 * of the Marketing Readiness Checklist. Everything here is a plain regex/
 * fetch check, not an LLM call, so it's fast, free, and doesn't hallucinate.
 * The qualitative half (positioning, social proof, demo video, ...) is
 * Claude's job — see analysis.ts.
 */

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_CHARS = 200_000; // guard against pathological pages
const USER_AGENT = "LaunchRadarBot/0.1 (+https://launchradar.app)";

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
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
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

async function pathExists(baseUrl: string, path: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(new URL(path, baseUrl).toString(), 5_000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeWebsite(rawUrl: string): Promise<WebsiteSnapshot> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`Could not fetch ${url} (HTTP ${res.status})`);
  }
  const finalUrl = res.url || url;
  const html = (await res.text()).slice(0, MAX_HTML_CHARS);

  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  const metaDescription = extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  );
  const ogImage = extractTag(
    html,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i,
  );
  const favicon =
    /<link[^>]+rel=["'](?:shortcut icon|icon)["']/i.test(html) ||
    (await pathExists(finalUrl, "/favicon.ico"));

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
  const hasSitemap = await pathExists(finalUrl, "/sitemap.xml");
  const hasRobots = await pathExists(finalUrl, "/robots.txt");

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

  const readinessChecks: ReadinessCheck[] = [
    checkResult("ga", "Google Analytics", hasGoogleAnalytics),
    checkResult("gtm", "Google Tag Manager", hasGTM),
    checkResult("meta_pixel", "Meta Pixel", hasMetaPixel),
    checkResult("og_tags", "OpenGraph tags", hasOgTags),
    checkResult("og_image", "OpenGraph image", Boolean(ogImage)),
    checkResult("sitemap", "sitemap.xml", hasSitemap),
    checkResult("robots", "robots.txt", hasRobots),
    checkResult("structured_data", "Structured data (JSON-LD)", hasStructuredData),
    checkResult("cookie_consent", "Cookie/privacy consent", hasCookieConsent),
    checkResult("email_capture", "Email capture form", hasEmailCapture),
    checkResult("favicon", "Favicon", favicon),
    checkResult("meta_description", "Meta description", Boolean(metaDescription)),
  ];

  return {
    url,
    finalUrl,
    html,
    title,
    metaDescription,
    bodyText: stripTags(html).slice(0, 15_000),
    readinessChecks,
    qualitativeSignals: { hasDemoVideo, hasComparisonLinks, testimonialKeywordHits },
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
