-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "welcomeSentAt" TIMESTAMP(3),
ADD COLUMN     "emailOptOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "alertedAt" TIMESTAMP(3);
