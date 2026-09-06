import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { COMPARISONS } from "./compare/compare-data";

/** Public, indexable routes only. App routes (/dashboard, /projects/*) are
 *  auth-gated and deliberately excluded — see robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const weeklyPaths = ["/", "/pricing", "/faq", "/compare"];
  const yearlyPaths = ["/privacy", "/terms", "/cookies"];

  return [
    ...weeklyPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...COMPARISONS.map((c) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...yearlyPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
