import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import type { Extraction } from "@/lib/analysis";
import type { ReadinessCheck } from "@/lib/website";
import { RerunButton } from "./rerun-button";

type Issue = Extraction["issues"][number];
type ActionItem = Extraction["actionPlan"][number];

const SEVERITY_DOT: Record<Issue["severity"], string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
};

const AREA_LABEL: Record<Issue["area"], string> = {
  positioning: "Positioning",
  comparison_pages: "Comparison pages",
  demo_video: "Demo video",
  seo_coverage: "SEO coverage",
  directory_presence: "Directory presence",
  social_proof: "Social proof",
  signup_flow: "Signup flow",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id, organisationId: organisation.id },
    include: { analyses: { orderBy: { createdAt: "desc" } } },
  });

  if (!project) notFound();

  const latest = project.analyses[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {project.name ?? project.url}
          </h1>
          <p className="text-zinc-500">{project.url}</p>
        </div>
        <RerunButton projectId={project.id} url={project.url} />
      </header>

      {!latest && <p className="text-zinc-500">No analysis yet.</p>}

      {latest?.status === "RUNNING" || latest?.status === "PENDING" ? (
        <p className="text-zinc-500">Analysis in progress — refresh in a moment.</p>
      ) : null}

      {latest?.status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Analysis failed: {latest.errorMessage}
        </div>
      )}

      {latest?.status === "COMPLETE" && (
        <>
          <section className="flex items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
            <div>
              <p className="text-6xl font-semibold tracking-tight">{latest.growthScore}</p>
              <p className="text-zinc-500">/ 100 Growth Score</p>
            </div>
            <div className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              <p><span className="font-medium">Category:</span> {project.category ?? "—"}</p>
              <p><span className="font-medium">ICP:</span> {project.icp ?? "—"}</p>
              <p><span className="font-medium">Pricing:</span> {project.pricing ?? "—"}</p>
              <p><span className="font-medium">Stage:</span> {project.stage}</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Your biggest growth problems</h2>
            <ul className="flex flex-col gap-2">
              {(latest.issues as Issue[]).map((issue) => (
                <li
                  key={issue.area}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${SEVERITY_DOT[issue.severity]}`} />
                  <div>
                    <p className="font-medium">{AREA_LABEL[issue.area]}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{issue.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Your Growth Plan — this week</h2>
            <ol className="flex flex-col gap-2">
              {(latest.actionPlan as ActionItem[]).map((item) => (
                <li
                  key={item.day}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {item.day}
                  </p>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Marketing Readiness Checklist</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(latest.readinessChecklist as unknown as ReadinessCheck[]).map((check) => (
                <li
                  key={check.key}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span>{check.status === "pass" ? "✅" : "❌"}</span>
                  <span>{check.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {project.analyses.length > 1 && (
            <section>
              <h2 className="mb-3 text-lg font-medium">Score history</h2>
              <ul className="flex flex-col gap-1 text-sm text-zinc-500">
                {project.analyses
                  .filter((a) => a.status === "COMPLETE")
                  .map((a) => (
                    <li key={a.id}>
                      {a.createdAt.toLocaleString()} — {a.growthScore}/100
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
