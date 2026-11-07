-- CreateEnum
CREATE TYPE "QueueChannel" AS ENUM ('PRODUCT_HUNT', 'INDIE_HACKERS', 'REDDIT', 'LINKEDIN', 'X_TWITTER', 'BLOG');

-- CreateEnum
CREATE TYPE "QueueItemStatus" AS ENUM ('PLANNED', 'POSTED', 'SKIPPED');

-- CreateTable
CREATE TABLE "queue_items" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actionId" TEXT,
    "opportunityId" TEXT,
    "channel" "QueueChannel" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "QueueItemStatus" NOT NULL DEFAULT 'PLANNED',
    "postedUrl" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "channel" "QueueChannel" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxPerWeek" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_items_organisationId_idx" ON "queue_items"("organisationId");

-- CreateIndex
CREATE INDEX "queue_items_projectId_status_idx" ON "queue_items"("projectId", "status");

-- CreateIndex
CREATE INDEX "queue_items_organisationId_scheduledFor_idx" ON "queue_items"("organisationId", "scheduledFor");

-- CreateIndex
CREATE INDEX "channel_profiles_organisationId_idx" ON "channel_profiles"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_profiles_projectId_channel_key" ON "channel_profiles"("projectId", "channel");

-- AddForeignKey
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_profiles" ADD CONSTRAINT "channel_profiles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
