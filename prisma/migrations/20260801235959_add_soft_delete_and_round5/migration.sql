-- AlterTable
ALTER TABLE "societies" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "independent_bottle_entries" ADD COLUMN "round5" INTEGER NOT NULL DEFAULT 0;
