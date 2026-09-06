-- AlterTable
ALTER TABLE "analyses" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "analyses_projectId_contentHash_idx" ON "analyses"("projectId", "contentHash");
