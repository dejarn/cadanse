import { cache } from "react"
import { prisma } from "@/lib/prisma"

export const getActiveSeason = cache(() =>
  prisma.season.findFirst({ where: { isActive: true } }),
)

export const getStudentCount = cache(() => prisma.student.count())

export const getTeacherCount = cache(() => prisma.teacher.count())

export const getClassCountBySeason = cache((seasonId: string) =>
  prisma.class.count({ where: { seasonId } }),
)

export const getShowCountBySeason = cache((seasonId: string) =>
  prisma.show.count({ where: { seasonId } }),
)
