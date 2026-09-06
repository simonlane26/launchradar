-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'BUILDER', 'GROWTH');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('RADAR_SCAN', 'RADAR_RESULT', 'AI_ACTION', 'DRAFT_REPLY');

-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "usage" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metric" "UsageMetric" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_organisationId_idx" ON "usage"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_organisationId_period_metric_key" ON "usage"("organisationId", "period", "metric");
