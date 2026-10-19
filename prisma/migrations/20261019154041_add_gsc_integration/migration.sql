-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "gscConnectedByUserId" TEXT,
ADD COLUMN     "gscSiteUrl" TEXT;

-- AlterTable
ALTER TABLE "visibility_reports" ADD COLUMN     "gscPerformance" JSONB;
