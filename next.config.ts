import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy. Allows: same-origin, Clerk (its frontend API,
 * hosted JS, telemetry, and Cloudflare Turnstile bot-check), inline styles
 * (Clerk + Tailwind-in-JS need them), and data/blob images. No external
 * script origins beyond Clerk.
 *
 * Known weakening: `script-src` keeps `'unsafe-inline'` because Next injects
 * inline hydration scripts and this app is not yet on nonce-based CSP.
 * Upgrade path: generate a per-request nonce in `proxy.ts`, swap
 * `'unsafe-inline'` for `'nonce-…' 'strict-dynamic'`.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  `connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com${isDev ? " ws: http://localhost:*" : ""}`,
  "manifest-src 'self'",
  "upgrade-insecure-requests",
]
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
