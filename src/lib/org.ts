import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

  return Object.assign(organisation, { isAdmin: adminUserIds().has(userId) });
}
