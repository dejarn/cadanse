/*
  Warnings:

  - You are about to drop the `participations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "participations" DROP CONSTRAINT "participations_actId_fkey";

-- DropForeignKey
ALTER TABLE "participations" DROP CONSTRAINT "participations_studentId_fkey";

-- DropTable
DROP TABLE "participations";
