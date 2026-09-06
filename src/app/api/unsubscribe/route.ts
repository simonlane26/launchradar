import { prisma } from "@/lib/prisma";
import { verifyUnsubToken } from "@/lib/email";
import { logError } from "@/lib/errors";

/**
 * One-click unsubscribe for the non-transactional emails (analysis complete,
 * Radar alert). Linked from those emails' footer with an HMAC token over the
 * org id — no login required. Sets `Organisation.emailOptOut`; the welcome
 * and playbook emails ignore it (pure transactional). Public route — see
 * `src/proxy.ts`.
 */

export const dynamic = "force-dynamic";

function page(title: string, body: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · LaunchRadar</title>
<style>body{margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#444}
.card{max-width:460px;margin:12vh auto 0;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;text-align:center}
h1{font-size:20px;color:#111;margin:0 0 10px}p{font-size:14px;line-height:1.6;margin:0}
a{display:inline-block;margin-top:22px;font-size:14px;font-weight:600;color:#111}</style></head>
<body><div class="card"><p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;margin:0 0 12px">LaunchRadar</p>
<h1>${title}</h1><p>${body}</p><a href="/">Back to LaunchRadar</a></div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("o");
  const token = searchParams.get("t");

  if (!orgId || !token || !verifyUnsubToken(orgId, token)) {
    return page("Link not valid", "This unsubscribe link is invalid or has expired. You can manage email preferences from your account settings.");
  }

  try {
    await prisma.organisation.update({
      where: { id: orgId },
      data: { emailOptOut: true },
    });
  } catch (err) {
    logError("unsubscribe", err);
    return page("Something went wrong", "We couldn't update your preferences just now. Please try again in a moment.");
  }

  return page(
    "You're unsubscribed",
    "You won't get any more analysis or opportunity alert emails from LaunchRadar. Account and security emails will still be sent. You can re-enable alerts anytime from your account settings.",
  );
}
