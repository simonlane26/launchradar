-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "organisations_stripeCustomerId_key" ON "organisations"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_stripeSubscriptionId_key" ON "organisations"("stripeSubscriptionId");
