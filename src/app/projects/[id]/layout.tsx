import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { ProjectNav } from "./project-nav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organisation = await requireOrganisation();

  const project = await prisma.project.findFirst({
    where: { id, organisationId: organisation.id },
    select: { id: true, name: true, url: true },
  });
  if (!project) notFound();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <ProjectNav projectId={project.id} projectName={project.name ?? project.url} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
