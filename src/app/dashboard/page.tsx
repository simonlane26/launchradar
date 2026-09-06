import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { limitsForOrg, planLabel, formatLimit } from "@/lib/plan";
import { openBillingPortal } from "@/app/billing/actions";
import { AnalyzeForm } from "./analyze-form";

const SCORE_COLOR = (score: number | null) => {
  if (score === null) return "text-zinc-400";
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export default async function DashboardPage() {
  const organisation = await requireOrganisation();

  const projectLimit = limitsForOrg(organisation).projects;

  const projects = await prisma.project.findMany({
    where: { organisationId: organisation.id },
    orderBy: { createdAt: "desc" },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      actions: {
        where: { status: "TODO" },
        select: { id: true },
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            LaunchRadar
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Plan: {planLabel(organisation)} ·{" "}
            {organisation.stripeCustomerId ? (
              <form action={openBillingPortal} className="inline">
                <button type="submit" className="underline hover:text-black dark:hover:text-zinc-100">
                  Manage billing
                </button>
              </form>
            ) : (
              <Link href="/pricing" className="underline">
                See plans
              </Link>
            )}
          </p>
        </div>
        <UserButton />
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-medium">Add a project</h2>
          <span className="text-sm text-zinc-500">
            {projects.length} / {formatLimit(projectLimit)} projects
          </span>
        </div>
        <AnalyzeForm atCap={projects.length >= projectLimit} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Your projects</h2>
        {projects.length === 0 && (
          <p className="text-zinc-500">
            No projects yet — analyze your first URL above.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {projects.map((project) => {
            const latest = project.analyses[0];
            return (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                >
                  <div>
                    <p className="font-medium">{project.name ?? project.url}</p>
                    <p className="text-sm text-zinc-500">
                      {project.url}
                      {project.actions.length > 0 && (
                        <span> · {project.actions.length} action{project.actions.length === 1 ? "" : "s"} open</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-semibold ${SCORE_COLOR(latest?.growthScore ?? null)}`}>
                      {latest?.status === "COMPLETE"
                        ? `${latest.growthScore}`
                        : latest?.status === "FAILED"
                          ? "—"
                          : "…"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {latest?.status === "FAILED" ? "analysis failed" : "growth score"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
