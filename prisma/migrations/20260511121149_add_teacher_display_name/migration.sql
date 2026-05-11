-- DropForeignKey
ALTER TABLE "acts" DROP CONSTRAINT "acts_classId_fkey";

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "displayName" TEXT;

-- AddForeignKey
ALTER TABLE "acts" ADD CONSTRAINT "acts_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
