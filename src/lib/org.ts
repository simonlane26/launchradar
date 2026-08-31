import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the tenant row for the current request. Uses the active Clerk
 * organisation if the user has one selected; otherwise falls back to a
 * synthetic per-user "personal" organisation (`user_<clerkUserId>`) so solo
 * founders don't need Clerk Organizations enabled to use LaunchRadar.
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

  return organisation;
}
