import { cache } from "react"
import { prisma } from "@/lib/prisma"

export const getActiveSeason = cache(() =>
  prisma.season.findFirst({ where: { isActive: true } }),
)

export const getStudentCount = cache(() => prisma.student.count())

export const getTeacherCount = cache(() => prisma.teacher.count())
