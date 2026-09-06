import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { SITE_URL } from "@/lib/seo";
import { logError } from "@/lib/errors";

/**
 * Transactional email via Resend. Optional — with `RESEND_API_KEY` unset
 * every send is a logged no-op (the app still works, addresses are still
 * captured). Set the key + verify a sending domain in Resend to turn it on.
 *
 * Emails: playbook autoresponder (landing), welcome (first sign-in),
 * analysis complete (first Growth Score), Radar high-intent alert (score
 * ≥ 85). The last two carry an unsubscribe link and respect
 * `Organisation.emailOptOut`; welcome + playbook do not (pure transactional).
 */

export const emailEnabled = Boolean(process.env.RESEND_API_KEY);
const resend = emailEnabled ? new Resend(process.env.RESEND_API_KEY as string) : null;

/** e.g. `LaunchRadar <hello@launchradar.app>` — must be a verified domain. */
const FROM = process.env.RESEND_FROM ?? "LaunchRadar <hello@launchradar.app>";

const UNSUB_SECRET = process.env.CLERK_SECRET_KEY ?? "launchradar-email-dev";

export function unsubToken(orgId: string): string {
  return createHmac("sha256", UNSUB_SECRET).update(orgId).digest("base64url").slice(0, 24);
}
export function verifyUnsubToken(orgId: string, token: string): boolean {
  const expected = unsubToken(orgId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
function unsubUrl(orgId: string): string {
  return `${SITE_URL}/api/unsubscribe?o=${encodeURIComponent(orgId)}&t=${unsubToken(orgId)}`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function btn(href: string, label: string): string {
  return `<div style="margin:26px 0 6px;text-align:center"><a href="${href}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px">${esc(label)}</a></div>`;
}

function shell(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  orgId?: string;
}): string {
  const foot = opts.orgId
    ? `<p style="margin:22px 0 0;font-size:12px;color:#a1a1aa;text-align:center">You're getting this because you use LaunchRadar. <a href="${unsubUrl(opts.orgId)}" style="color:#a1a1aa">Unsubscribe from these emails</a>.</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;padding:24px">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:28px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#444">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a">LaunchRadar</p>
  <h1 style="margin:0 0 12px;font-size:20px;color:#111">${esc(opts.heading)}</h1>
  ${opts.bodyHtml}
  <p style="margin:24px 0 0;font-size:13px;color:#71717a">— LaunchRadar<br>Find demand. Fuel growth.</p>
  ${foot}
</div>
</body></html>`;
}

async function send(to: string, subject: string, html: string, tag: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY unset — would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      logError(tag, error);
      return false;
    }
    return true;
  } catch (err) {
    logError(tag, err);
    return false;
  }
}

// --- playbook autoresponder (landing) --------------------------------------

const CTA_URL = `${SITE_URL}/sign-up?utm_source=playbook&utm_medium=email&utm_campaign=first_users`;

const CHECKLIST: { h: string; p: string }[] = [
  {
    h: "1. Write down who has this problem — in their words",
    p: "Not a demographic. The exact situation and the sentence they'd type into a forum: “I have dyslexia and writing work emails takes me forever.” Everything downstream keys off this phrasing.",
  },
  {
    h: "2. Find the 5 places those people already ask for help",
    p: "Subreddits, Discords, Slack groups, Q&A sites, niche forums. You're looking for existing demand, not an audience to build from scratch.",
  },
  {
    h: "3. Reply helpfully to 3 real threads this week",
    p: "Answer the question properly first. Mention your product only if it genuinely fits, and say it's yours. No link-dropping. This is your highest-converting channel at zero users.",
  },
  {
    h: "4. Ship one comparison page",
    p: "“<your product> vs <the obvious alternative>”. People searching that phrase are mid-decision. One honest page — including where the other tool is the better pick — outperforms ten blog posts.",
  },
  {
    h: "5. Submit to the 10–15 directories that matter for your category",
    p: "Not “everywhere”. The category-relevant ones (and the couple of big general ones). Skip Product Hunt unless your audience is actually there.",
  },
  {
    h: "6. Put a plain one-line “what it is” at the top of your site",
    p: "“<Product> is a <category> that helps <who> <do the thing>.” It's what Google, ChatGPT and a skimming visitor all read first.",
  },
  {
    h: "7. Add one piece of proof",
    p: "A real quote, a usage number, a logo, a short demo video. One concrete signal beats a wall of adjectives for a stranger deciding whether to trust a vibe-coded app.",
  },
];

export async function sendPlaybookEmail(to: string): Promise<boolean> {
  const items = CHECKLIST.map(
    (c) =>
      `<h3 style="margin:22px 0 4px;font-size:15px;color:#111">${esc(c.h)}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#444">${esc(c.p)}</p>`,
  ).join("");
  const html = shell({
    preheader: "Seven concrete moves to get your first users.",
    heading: "Your first-users playbook",
    bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.6">Seven concrete moves to get your first users when you have zero. Do them roughly in order — the early ones compound.</p>${items}${btn(CTA_URL, "Run your Growth Score →")}<p style="margin:8px 0 0;text-align:center;font-size:13px;color:#71717a">When you're ready, LaunchRadar turns this into a plan tailored to your actual product.</p>`,
  });
  return send(to, "Your first-users playbook", html, "sendPlaybookEmail");
}

// --- welcome (first sign-in) ---------------------------------------------------

export async function sendWelcomeEmail(opts: { to: string; firstName?: string }): Promise<boolean> {
  const hi = opts.firstName ? `Hi ${esc(opts.firstName)},` : "Hi,";
  const feature = (h: string, p: string) =>
    `<h3 style="margin:20px 0 2px;font-size:15px;color:#111">${h}</h3><p style="margin:0;font-size:14px;line-height:1.6">${p}</p>`;
  const html = shell({
    preheader: "Your app is built. Now let's find the growth.",
    heading: "Welcome to LaunchRadar",
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6">${hi}</p>
      <p style="margin:0 0 4px;font-size:15px;line-height:1.6">You built the product. LaunchRadar helps you work out what to do next.</p>
      <p style="margin:8px 0 0;font-size:15px;line-height:1.6">Add your app and we'll analyse how ready it is to grow — from positioning and conversion to search visibility, trust and distribution.</p>
      <p style="margin:16px 0 0;font-size:14px;color:#71717a">You'll get:</p>
      ${feature("A Growth Score", "See where your app is strong and what's holding it back.")}
      ${feature("A prioritised Growth Backlog", "Know what to work on next, ranked by potential impact.")}
      ${feature("Opportunity Radar", "Find real conversations, problems and buying signals relevant to your product.")}
      ${feature("Tools to execute", "Create the content, campaigns and growth assets needed to act on what LaunchRadar finds.")}
      ${btn(`${SITE_URL}/dashboard`, "Analyse your app →")}
      <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#71717a">No generic 50-point marketing checklist. LaunchRadar learns what you've built and recommends what matters for your product.</p>`,
  });
  return send(opts.to, "Welcome to LaunchRadar", html, "sendWelcomeEmail");
}

// --- analysis complete (first Growth Score) ----------------------------------

export async function sendAnalysisCompleteEmail(opts: {
  to: string;
  orgId: string;
  firstName?: string;
  projectName: string;
  growthScore: number;
  topIssueTitle?: string;
  topIssueReason?: string;
  nextAction: string;
  estimatedEffort: string;
  impact: string;
  projectUrl: string;
}): Promise<boolean> {
  const hi = opts.firstName ? `Hi ${esc(opts.firstName)},` : "Hi,";
  const name = esc(opts.projectName);
  const topIssue =
    opts.topIssueTitle && opts.topIssueReason
      ? `<p style="margin:22px 0 2px;font-size:14px;color:#71717a">Your biggest opportunity</p>
         <p style="margin:0 0 2px;font-size:16px;font-weight:600;color:#111">${esc(opts.topIssueTitle)}</p>
         <p style="margin:0;font-size:14px;line-height:1.6">${esc(opts.topIssueReason)}</p>`
      : "";
  const html = shell({
    preheader: `Here's what's holding ${opts.projectName} back — and what to do next.`,
    heading: "Your first growth analysis is ready",
    orgId: opts.orgId,
    bodyHtml: `
      <p style="margin:0 0 10px;font-size:15px;line-height:1.6">${hi}</p>
      <p style="margin:0;font-size:15px;line-height:1.6">LaunchRadar has finished analysing <strong>${name}</strong>.</p>
      <p style="margin:20px 0 2px;font-size:14px;color:#71717a">Growth Score</p>
      <p style="margin:0;font-size:34px;font-weight:700;color:#111">${opts.growthScore} <span style="font-size:18px;color:#a1a1aa">/ 100</span></p>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.6">We analysed your positioning, conversion, search visibility, trust, distribution and analytics to identify the biggest opportunities for growth.</p>
      ${topIssue}
      <p style="margin:22px 0 2px;font-size:14px;color:#71717a">Recommended next action</p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111">${esc(opts.nextAction)}</p>
      <p style="margin:0;font-size:13px;color:#71717a">Estimated effort: ${esc(opts.estimatedEffort)} · Potential impact: ${esc(opts.impact)}</p>
      ${btn(opts.projectUrl, "View your Growth Plan →")}
      <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#71717a">We've already prioritised the rest of your findings into your Growth Backlog, so you don't need to decide where to start.</p>`,
  });
  return send(
    opts.to,
    `Your LaunchRadar analysis is ready — ${opts.growthScore}/100`,
    html,
    "sendAnalysisCompleteEmail",
  );
}

// --- Radar high-intent alert (score ≥ 85) ----------------------------------

export async function sendRadarAlertEmail(opts: {
  to: string;
  orgId: string;
  projectName: string;
  opportunityScore: number;
  intentLabel: string;
  sourceName: string;
  timeAgo: string;
  excerpt: string;
  aiReason: string;
  productFit: number;
  purchaseIntent: number;
  audienceMatch: number;
  suggestedAction: string;
  radarUrl: string;
}): Promise<boolean> {
  const name = esc(opts.projectName);
  const subject =
    opts.opportunityScore >= 90
      ? `${opts.opportunityScore}/100 opportunity found for ${opts.projectName}`
      : `High-intent opportunity found for ${opts.projectName}`;
  const html = shell({
    preheader: "LaunchRadar found a strong match worth reviewing.",
    heading: "High-intent opportunity found",
    orgId: opts.orgId,
    bodyHtml: `
      <p style="margin:0;font-size:15px;line-height:1.6">LaunchRadar has found a new opportunity for <strong>${name}</strong>.</p>
      <p style="margin:18px 0 2px;font-size:34px;font-weight:700;color:#111">${opts.opportunityScore} <span style="font-size:18px;color:#a1a1aa">/ 100</span></p>
      <p style="margin:0;font-size:14px;font-weight:600;color:#111">${esc(opts.intentLabel)}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#71717a">${esc(opts.sourceName)} · ${esc(opts.timeAgo)}</p>
      <p style="margin:16px 0 0;font-size:15px;line-height:1.6;font-style:italic;color:#333">“${esc(opts.excerpt)}”</p>
      <p style="margin:20px 0 2px;font-size:14px;color:#71717a">Why LaunchRadar flagged it</p>
      <p style="margin:0;font-size:14px;line-height:1.6">${esc(opts.aiReason)}</p>
      <p style="margin:12px 0 0;font-size:13px;color:#71717a">Product fit ${opts.productFit}% · Purchase intent ${opts.purchaseIntent}% · Audience match ${opts.audienceMatch}%</p>
      <p style="margin:20px 0 2px;font-size:14px;color:#71717a">Recommended action</p>
      <p style="margin:0;font-size:14px;line-height:1.6">${esc(opts.suggestedAction)}</p>
      ${btn(opts.radarUrl, "Review opportunity →")}
      <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#71717a">LaunchRadar only sends immediate alerts for your strongest opportunities. Lower-scoring findings remain available in your Radar.</p>`,
  });
  return send(opts.to, subject, html, "sendRadarAlertEmail");
}
