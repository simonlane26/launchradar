import { after } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { logError } from "@/lib/errors";

/** Clerk user ids with an unlimited-access admin bypass on every plan gate.
 *  Comma/space/newline separated in `ADMIN_CLERK_USER_IDS`. This — not the
 *  `Organisation.tier` column — is how the project owner keeps full access
 *  across every org they touch, including ones created later. */
function adminUserIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Backfill `Organisation.email` / `.firstName` from Clerk and fire the
 * one-time welcome email. Runs after the response (`after()`), only when
 * something is actually missing, so the common request pays nothing.
 */
async function syncOrgContact(orgId: string): Promise<void> {
  try {
    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      select: { email: true, firstName: true, welcomeSentAt: true },
    });
    if (!org) return;

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    const firstName = user?.firstName ?? null;
    if (!email) return;

    const data: { email?: string; firstName?: string } = {};
    if (org.email !== email) data.email = email;
    if (firstName && !org.firstName) data.firstName = firstName;
    if (Object.keys(data).length) {
      await prisma.organisation.update({ where: { id: orgId }, data });
    }

    if (!org.welcomeSentAt) {
      const sent = await sendWelcomeEmail({ to: email, firstName: firstName ?? undefined });
      if (sent) {
        await prisma.organisation.update({
          where: { id: orgId },
          data: { welcomeSentAt: new Date() },
        });
      }
    }
  } catch (err) {
    logError("syncOrgContact", err);
  }
}

/**
 * Resolves the tenant row for the current request. Uses the active Clerk
 * organisation if the user has one selected; otherwise falls back to a
 * synthetic per-user "personal" organisation (`user_<clerkUserId>`) so solo
 * founders don't need Clerk Organizations enabled to use LaunchRadar.
 *
 * The returned row carries an extra `isAdmin` flag (not a DB column) — true
 * when the signed-in Clerk user is in `ADMIN_CLERK_USER_IDS`; `src/lib/plan.ts`
 * reads it to waive every quota.
 */
export async function requireOrganisation() {
  const { userId, orgId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated.");
  }

  const clerkOrgId = orgId ?? `user_${userId}`;

  const organisation = await prisma.organisation.upsert({
    where: { clerkOrgId },
    update: {},
    create: { clerkOrgId, name: orgId ? "Organisation" : "My workspace" },
  });

  if (!organisation.email || !organisation.welcomeSentAt) {
    try {
      after(() => syncOrgContact(organisation.id));
    } catch {
      // `after` is unavailable outside a request scope — skip silently.
    }
  }

  return Object.assign(organisation, { isAdmin: adminUserIds().has(userId) });
}
