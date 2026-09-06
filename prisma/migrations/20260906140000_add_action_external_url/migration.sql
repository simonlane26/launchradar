-- AlterEnum
ALTER TYPE "ActionSource" ADD VALUE 'SECURITY';

-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "externalUrl" TEXT;
