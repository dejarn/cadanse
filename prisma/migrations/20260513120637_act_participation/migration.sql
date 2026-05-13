-- CreateTable
CREATE TABLE "act_participations" (
    "actId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "act_participations_pkey" PRIMARY KEY ("actId","studentId")
);

-- AddForeignKey
ALTER TABLE "act_participations" ADD CONSTRAINT "act_participations_actId_fkey" FOREIGN KEY ("actId") REFERENCES "acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "act_participations" ADD CONSTRAINT "act_participations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
