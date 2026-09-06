-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('IDEA', 'NEW_LAUNCH', 'EARLY_TRACTION', 'GROWING', 'ESTABLISHED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "LaunchPlanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "icp" TEXT,
    "pricing" TEXT,
    "stage" "ProjectStage" NOT NULL DEFAULT 'NEW_LAUNCH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "growthScore" INTEGER,
    "issues" JSONB,
    "readinessChecklist" JSONB,
    "actionPlan" JSONB,
    "rawExtraction" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "launch_plans" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "analysisId" TEXT,
    "status" "LaunchPlanStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT,
    "channels" JSONB,
    "schedule" JSONB,
    "assets" JSONB,
    "directories" JSONB,
    "rawOutput" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "launch_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisations_clerkOrgId_key" ON "organisations"("clerkOrgId");

-- CreateIndex
CREATE INDEX "projects_organisationId_idx" ON "projects"("organisationId");

-- CreateIndex
CREATE INDEX "analyses_organisationId_idx" ON "analyses"("organisationId");

-- CreateIndex
CREATE INDEX "analyses_projectId_idx" ON "analyses"("projectId");

-- CreateIndex
CREATE INDEX "launch_plans_organisationId_idx" ON "launch_plans"("organisationId");

-- CreateIndex
CREATE INDEX "launch_plans_projectId_idx" ON "launch_plans"("projectId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "launch_plans" ADD CONSTRAINT "launch_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
