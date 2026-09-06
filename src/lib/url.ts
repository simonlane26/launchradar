import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { SafeError } from "@/lib/errors";

/**
 * URL hygiene for the one place LaunchRadar fetches attacker-controlled
 * input: the founder-supplied site URL. Two layers —
 *
 *  - `normalizeSiteUrl` (sync): syntax + scheme + obvious-bad-host checks,
 *    cheap enough to run in a server action for instant form feedback.
 *  - `assertHostReachable` (async): resolves DNS and rejects any host that
 *    maps to a private / loopback / link-local address. Run this again on
 *    every redirect hop, since a public hostname can 3xx to an internal one
 *    (basic SSRF hardening — see `safeFetch` in website.ts).
 */

export function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new SafeError("Enter a URL.");

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new SafeError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeError("Only http and https URLs are supported.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new SafeError("That host isn't reachable from LaunchRadar.");
  }
  if (isIP(host) && isPrivateAddress(host)) {
    throw new SafeError("That host isn't reachable from LaunchRadar.");
  }

  return url.toString();
}

export async function assertHostReachable(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new SafeError("That host isn't reachable from LaunchRadar.");
    }
    return;
  }

  let results: { address: string }[];
  try {
    results = await lookup(host, { all: true });
  } catch {
    throw new SafeError(`Could not resolve ${hostname}.`);
  }
  if (results.some((r) => isPrivateAddress(r.address))) {
    throw new SafeError("That host isn't reachable from LaunchRadar.");
  }
}

/** Bare registrable-ish hostname (no scheme, no `www.`), or null if unparseable. */
export function domainOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return null;
  }
}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice("::ffff:".length));
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
  if (v.startsWith("fe80")) return true; // link-local
  return false;
}
