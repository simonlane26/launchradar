-- CreateEnum
CREATE TYPE "VisibilityReportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- AlterEnum
ALTER TYPE "ActionSource" ADD VALUE 'VISIBILITY';

-- CreateTable
CREATE TABLE "visibility_reports" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "analysisId" TEXT,
    "status" "VisibilityReportStatus" NOT NULL DEFAULT 'PENDING',
    "overallScore" INTEGER,
    "dimensions" JSONB,
    "onSiteChecks" JSONB,
    "queries" JSONB,
    "aiSummary" JSONB,
    "findings" JSONB,
    "rawOutput" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "visibility_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visibility_reports_organisationId_idx" ON "visibility_reports"("organisationId");

-- CreateIndex
CREATE INDEX "visibility_reports_projectId_idx" ON "visibility_reports"("projectId");

-- AddForeignKey
ALTER TABLE "visibility_reports" ADD CONSTRAINT "visibility_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
