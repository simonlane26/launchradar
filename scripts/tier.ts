/**
 * Manual tier tool — stand-in for the billing webhook that will own
 * `Organisation.tier` later.
 *
 * From the repo root (D:\LaunchRadar):
 *   npx tsx scripts/tier.ts                     # list every org + tier
 *   npx tsx scripts/tier.ts <orgId> BUILDER     # set one org's tier
 *   npx tsx scripts/tier.ts <orgId> FREE
 *
 * Also runs a read-only quota probe for an org:
 *   npx tsx scripts/tier.ts <orgId> --usage
 *
 * NOTE: full admin access is NOT set here — add your Clerk *user* id to
 * `ADMIN_CLERK_USER_IDS` in `.env` instead (see `src/lib/org.ts`). That
 * bypasses every quota on every org you touch, without a tier change.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { limitsForOrg, quota } from "../src/lib/plan";

const prisma = new PrismaClient();

async function main() {
  const [orgId, arg] = process.argv.slice(2);

  if (!orgId) {
    const orgs = await prisma.organisation.findMany({
      select: { id: true, name: true, clerkOrgId: true, tier: true },
      orderBy: { createdAt: "desc" },
    });
    console.table(orgs);
    return;
  }

  if (arg === "--usage") {
    const org = await prisma.organisation.findUniqueOrThrow({ where: { id: orgId } });
    const projects = await prisma.project.count({ where: { organisationId: orgId } });
    console.log(`tier=${org.tier}  projects=${projects}/${limitsForOrg(org).projects}`);
    for (const m of ["RADAR_SCAN", "RADAR_RESULT", "AI_ACTION", "DRAFT_REPLY"] as const) {
      console.log(m, await quota(org, m));
    }
    return;
  }

  const tier = String(arg ?? "").toUpperCase();
  if (!["FREE", "BUILDER", "GROWTH"].includes(tier)) {
    throw new Error(`Bad tier "${arg}". Use FREE, BUILDER or GROWTH.`);
  }
  const updated = await prisma.organisation.update({
    where: { id: orgId },
    data: { tier: tier as "FREE" | "BUILDER" | "GROWTH" },
    select: { id: true, name: true, tier: true },
  });
  console.log("Updated:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
