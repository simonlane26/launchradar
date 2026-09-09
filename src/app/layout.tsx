import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleTagManager } from "@next/third-parties/google";
import { JsonLd } from "@/components/json-ld";
import { BRAND, SITE_URL, organizationJsonLd, softwareApplicationJsonLd } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "LaunchRadar — Now get people using it";

/**
 * Google Tag Manager container id (`GTM-XXXXXXX`). Public by design — it ships
 * in the page HTML. When set, GTM loads site-wide and downstream analytics /
 * marketing tags are managed in the GTM dashboard, not in this repo. Unset →
 * no GTM at all (keeps dev traffic out of analytics unless you opt in).
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s · LaunchRadar",
  },
  description:
    "You vibe coded the app. LaunchRadar tells you who needs it, where they are, and what to do this week to get your first customers.",
  applicationName: BRAND.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: BRAND.description,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: BRAND.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        {GTM_ID ? <GoogleTagManager gtmId={GTM_ID} /> : null}
        <body className="min-h-full flex flex-col">
          {GTM_ID ? (
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                title="Google Tag Manager"
              />
            </noscript>
          ) : null}
          <JsonLd data={[organizationJsonLd(), softwareApplicationJsonLd()]} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
