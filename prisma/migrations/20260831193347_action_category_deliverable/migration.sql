-- CreateEnum
CREATE TYPE "ActionDeliverable" AS ENUM ('TASK', 'ASSET');

-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Growth',
ADD COLUMN     "deliverable" "ActionDeliverable" NOT NULL DEFAULT 'TASK';
