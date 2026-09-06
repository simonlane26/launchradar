-- CreateEnum
CREATE TYPE "ActionSource" AS ENUM ('ANALYSIS', 'LAUNCH', 'MANUAL');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('TODO', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ActionImpact" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "analysisId" TEXT,
    "source" "ActionSource" NOT NULL DEFAULT 'ANALYSIS',
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "impact" "ActionImpact" NOT NULL DEFAULT 'MEDIUM',
    "effortMinutes" INTEGER NOT NULL DEFAULT 30,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
    "guide" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actions_organisationId_idx" ON "actions"("organisationId");

-- CreateIndex
CREATE INDEX "actions_projectId_status_idx" ON "actions"("projectId", "status");

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
