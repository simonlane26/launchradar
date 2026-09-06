import { Resend } from "resend";
import { SITE_URL } from "@/lib/seo";
import { logError } from "@/lib/errors";

/**
 * Transactional email via Resend. Optional — if `RESEND_API_KEY` is unset
 * the landing-page signup still captures the address to the DB, it just
 * doesn't send (and says so in the logs). Set the key + verify a sending
 * domain in Resend to switch the autoresponder on.
 */

export const emailEnabled = Boolean(process.env.RESEND_API_KEY);

const resend = emailEnabled ? new Resend(process.env.RESEND_API_KEY as string) : null;

/** e.g. `LaunchRadar <hello@launchradar.app>` — must be on a domain you've
 *  verified in Resend. */
const FROM = process.env.RESEND_FROM ?? "LaunchRadar <hello@launchradar.app>";

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

function playbookHtml(): string {
  const items = CHECKLIST.map(
    (c) =>
      `<h3 style="margin:24px 0 4px;font-size:16px;color:#111">${c.h}</h3><p style="margin:0;font-size:15px;line-height:1.6;color:#444">${c.p}</p>`,
  ).join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:28px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a">LaunchRadar</p>
  <h1 style="margin:0 0 8px;font-size:20px;color:#111">Your first-users playbook</h1>
  <p style="margin:0;font-size:15px;line-height:1.6;color:#444">Seven concrete moves to get your first users when you have zero. Do them roughly in order — the early ones compound.</p>
  ${items}
  <div style="margin:28px 0 8px;text-align:center">
    <a href="${CTA_URL}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px">Run your Growth Score →</a>
  </div>
  <p style="margin:8px 0 0;text-align:center;font-size:13px;color:#71717a">When you're ready, LaunchRadar turns this into a plan tailored to your actual product.</p>
</div>
</body></html>`;
}

/**
 * Send the one-time playbook email. Returns true if a send was attempted
 * successfully, false if email isn't configured or the send failed (the
 * caller still keeps the subscriber row either way).
 */
export async function sendPlaybookEmail(to: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY unset — would send playbook to ${to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Your first-users playbook",
      html: playbookHtml(),
    });
    if (error) {
      logError("sendPlaybookEmail", error);
      return false;
    }
    return true;
  } catch (err) {
    logError("sendPlaybookEmail", err);
    return false;
  }
}
