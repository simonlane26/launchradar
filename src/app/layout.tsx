import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
        <body className="min-h-full flex flex-col">
          <JsonLd data={[organizationJsonLd(), softwareApplicationJsonLd()]} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
