/**
 * Shared SEO / AEO / GEO helpers for the public marketing pages.
 *
 * - `SITE_URL` / `absoluteUrl` give every page a real canonical + OG URL so
 *   search engines and AI crawlers resolve one address per page.
 * - The JSON-LD builders emit schema.org structured data (Organization,
 *   SoftwareApplication, FAQPage, BreadcrumbList) — the machine-readable
 *   "what is this / what does it answer" that answer engines and AI
 *   assistants read before they'll cite you.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const BRAND = {
  name: "LaunchRadar",
  tagline: "You vibe coded the app. Now vibe market it.",
  /**
   * One plain declarative sentence — the line an answer engine can lift
   * verbatim. Kept identical to the homepage hero subheadline (rendered from
   * this same constant) and used as the `description` in both the
   * Organization and SoftwareApplication JSON-LD, so the visible definition
   * and the structured-data definition are word-for-word the same string.
   */
  oneLiner:
    "LaunchRadar is a growth tool that helps indie and no-code founders find their first users after launching a product.",
  description:
    "LaunchRadar turns a URL into a Growth Score, a prioritised Growth Backlog, and an Opportunity Radar that finds people already asking for what you built — tailored to your product, not a generic 50-item checklist.",
} as const;

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: "IGNISTECH LTD",
    url: SITE_URL,
    description: BRAND.oneLiner,
    logo: absoluteUrl("/favicon.ico"),
    email: "launchradar@outlook.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "21 Winterberry Way",
      addressLocality: "Nantwich",
      addressRegion: "Cheshire",
      addressCountry: "GB",
    },
  };
}

export function softwareApplicationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Growth marketing",
    operatingSystem: "Web",
    url: SITE_URL,
    description: BRAND.oneLiner,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      description: "Free plan — one project, full analysis and Growth Score.",
      url: absoluteUrl("/pricing"),
    },
  };
}

export function faqPageJsonLd(items: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
