-- AlterTable
ALTER TABLE "acts" ALTER COLUMN "classId" DROP NOT NULL;

-- DropColumn
ALTER TABLE "acts" DROP COLUMN IF EXISTS "priority";
