-- CreateEnum
CREATE TYPE "RadarIntentType" AS ENUM ('BUYING', 'RECOMMENDATION', 'PROBLEM', 'COMPETITOR_PAIN');

-- CreateEnum
CREATE TYPE "RadarScanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "OpportunityIntent" AS ENUM ('RECOMMENDATION_REQUEST', 'PROBLEM_FRUSTRATION', 'COMPETITOR_DISSATISFACTION', 'PURCHASE_RESEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'REPLIED', 'DISMISSED');

-- CreateTable
CREATE TABLE "product_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "audiences" JSONB NOT NULL,
    "problems" JSONB NOT NULL,
    "alternatives" JSONB NOT NULL,
    "commercialIntents" JSONB NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_queries" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "intentType" "RadarIntentType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_scans" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "RadarScanStatus" NOT NULL DEFAULT 'PENDING',
    "queriesRun" INTEGER,
    "resultsFound" INTEGER,
    "candidates" INTEGER,
    "saved" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "radar_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "queryMatched" TEXT NOT NULL,
    "intent" "OpportunityIntent" NOT NULL,
    "audienceMatch" INTEGER NOT NULL,
    "problemMatch" INTEGER NOT NULL,
    "purchaseIntent" INTEGER NOT NULL,
    "productFit" INTEGER NOT NULL,
    "urgency" INTEGER NOT NULL,
    "aiReason" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "competitorName" TEXT,
    "advantage" TEXT,
    "opportunityScore" INTEGER NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_feedback" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_profiles_projectId_key" ON "product_profiles"("projectId");

-- CreateIndex
CREATE INDEX "product_profiles_organisationId_idx" ON "product_profiles"("organisationId");

-- CreateIndex
CREATE INDEX "radar_queries_organisationId_idx" ON "radar_queries"("organisationId");

-- CreateIndex
CREATE INDEX "radar_queries_projectId_active_idx" ON "radar_queries"("projectId", "active");

-- CreateIndex
CREATE INDEX "radar_scans_organisationId_idx" ON "radar_scans"("organisationId");

-- CreateIndex
CREATE INDEX "radar_scans_projectId_idx" ON "radar_scans"("projectId");

-- CreateIndex
CREATE INDEX "opportunities_organisationId_idx" ON "opportunities"("organisationId");

-- CreateIndex
CREATE INDEX "opportunities_projectId_status_idx" ON "opportunities"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_projectId_url_key" ON "opportunities"("projectId", "url");

-- CreateIndex
CREATE INDEX "opportunity_feedback_opportunityId_idx" ON "opportunity_feedback"("opportunityId");

-- AddForeignKey
ALTER TABLE "product_profiles" ADD CONSTRAINT "product_profiles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_queries" ADD CONSTRAINT "radar_queries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_scans" ADD CONSTRAINT "radar_scans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "radar_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_feedback" ADD CONSTRAINT "opportunity_feedback_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
