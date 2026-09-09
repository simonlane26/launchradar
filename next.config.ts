import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * The Clerk Frontend API host is encoded in the publishable key
 * (`pk_(test|live)_<base64("<host>$")>`). Deriving it here means the CSP
 * works for the dev instance *and* a production instance on a custom domain
 * (`clerk.<yourdomain>`) with no hand-editing — just set the key.
 */
function clerkHost(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const b64 = pk.replace(/^pk_(test|live)_/, "");
  if (!b64) return null;
  try {
    const host = Buffer.from(b64, "base64").toString("utf8").replace(/\$+$/, "").trim();
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ? host : null;
  } catch {
    return null;
  }
}

const CLERK_HOST = clerkHost();
const clerkOrigin = CLERK_HOST ? `https://${CLERK_HOST}` : "";
// Clerk also talks to its accounts portal on the same registrable domain.
const clerkAccounts =
  CLERK_HOST && CLERK_HOST.startsWith("clerk.")
    ? `https://${CLERK_HOST.replace(/^clerk\./, "accounts.")}`
    : "";

/**
 * Content-Security-Policy. Allows: same-origin, Clerk (its Frontend API host
 * — dev or custom-domain — plus hosted JS, telemetry, account portal, and
 * the Cloudflare Turnstile bot-check), Google Tag Manager + GA4 (see the
 * `gtm*` consts below — only active once NEXT_PUBLIC_GTM_ID is set) and the
 * Meta Pixel that container fires (`metaPixel*` consts), inline styles
 * (Clerk + Tailwind-in-JS need them), and data/blob images.
 *
 * Known weakening: `script-src` keeps `'unsafe-inline'` because Next injects
 * inline hydration scripts and this app is not yet on nonce-based CSP.
 * Upgrade path: generate a per-request nonce in `proxy.ts`, swap
 * `'unsafe-inline'` for `'nonce-…' 'strict-dynamic'`.
 */
const clerkScript = [clerkOrigin, "https://*.clerk.accounts.dev", "https://*.clerk.com"]
  .filter(Boolean)
  .join(" ");
const clerkConnect = [clerkOrigin, clerkAccounts, "https://*.clerk.accounts.dev", "https://*.clerk.com", "https://clerk-telemetry.com"]
  .filter(Boolean)
  .join(" ");

/**
 * Google Tag Manager (loaded site-wide when NEXT_PUBLIC_GTM_ID is set) plus
 * the origins GA4 — the tag almost every GTM container ends up firing — needs
 * for its collect/beacon requests and pixels. If a container is later set up
 * with Google Ads / Floodlight, add `https://*.googleadservices.com` and
 * `https://www.google.<tld>` here too.
 */
const gtmScript = "https://www.googletagmanager.com";
const gtmImg = "https://www.googletagmanager.com https://*.google-analytics.com https://*.g.doubleclick.net";
const gtmConnect =
  "https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net";

/**
 * Meta (Facebook) Pixel — fired by a tag inside the GTM container, not loaded
 * by this app directly. `fbevents.js` comes from connect.facebook.net; the
 * tracking pixel and CAPI-style beacons hit www.facebook.com. Drop this group
 * if the Meta Pixel tag is ever removed from the container.
 */
const metaPixelScript = "https://connect.facebook.net";
const metaPixelImg = "https://www.facebook.com";
const metaPixelConnect = "https://connect.facebook.net https://www.facebook.com";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `form-action 'self' ${clerkScript}`,
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} ${clerkScript} ${gtmScript} ${metaPixelScript} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://img.clerk.com https://api.producthunt.com ${gtmImg} ${metaPixelImg}`,
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `frame-src 'self' https://challenges.cloudflare.com ${clerkScript} ${gtmScript}`,
  `connect-src 'self' ${clerkConnect} ${gtmConnect} ${metaPixelConnect}${isDev ? " ws: http://localhost:*" : ""}`,
  "manifest-src 'self'",
  "upgrade-insecure-requests",
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
