import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { logError } from "@/lib/errors";
import { currentWeekRange, CHANNEL_LABEL } from "@/lib/queue";
import { SITE_URL } from "@/lib/seo";

/**
 * Monday posting-queue reminder. Public route (see proxy.ts) — self
 * authenticates via a shared secret rather than a Clerk session, same
 * pattern as /api/unsubscribe's HMAC token. No in-process scheduler exists
 * (single Next.js web service, nothing comparable to VibeCheck's separate
 * worker) — this needs an external trigger (a Railway Cron Job service)
 * hitting it weekly with the secret; this route is the receiving end only.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if unset, never fall open

  const url = new URL(request.url);
  const provided = request.headers.get("x-cron-secret") ?? url.searchParams.get("secret") ?? "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(provided);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { start, end } = currentWeekRange();
  const lastWeekStart = new Date(start);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const items = await prisma.queueItem.findMany({
    where: {
      status: "PLANNED",
      scheduledFor: { gte: lastWeekStart, lt: end },
    },
    select: {
      organisationId: true,
      channel: true,
      scheduledFor: true,
      project: { select: { name: true, url: true } },
      action: { select: { title: true } },
      opportunity: { select: { title: true } },
    },
  });

  const byOrg = new Map<string, typeof items>();
  for (const item of items) {
    const list = byOrg.get(item.organisationId) ?? [];
    list.push(item);
    byOrg.set(item.organisationId, list);
  }

  let sent = 0;
  for (const [organisationId, orgItems] of byOrg) {
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { email: true, firstName: true, emailOptOut: true },
    });
    if (!org?.email || org.emailOptOut) continue;

    const thisWeek = orgItems.filter((i) => i.scheduledFor >= start);
    const overdue = orgItems.filter((i) => i.scheduledFor < start);
    if (thisWeek.length === 0 && overdue.length === 0) continue;

    try {
      const ok = await sendWeeklyDigestEmail({
        to: org.email,
        orgId: organisationId,
        firstName: org.firstName ?? undefined,
        items: thisWeek.map((i) => ({
          projectName: i.project.name ?? i.project.url,
          channel: CHANNEL_LABEL[i.channel],
          title: i.action?.title ?? i.opportunity?.title ?? "",
        })),
        overdueCount: overdue.length,
        queueUrl: `${SITE_URL}/queue`,
      });
      if (ok) sent++;
    } catch (error) {
      logError("cron:weekly-digest", error);
    }
  }

  return Response.json({ orgsConsidered: byOrg.size, sent });
}
