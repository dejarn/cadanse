import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"

export const getActiveSeason = cache(() =>
  prisma.season.findFirst({ where: { isActive: true } }),
)

export const getUpcomingShow = cache(async (seasonId: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const show = await prisma.show.findFirst({
    where: { seasonId, date: { gte: today } },
    orderBy: { date: "asc" },
    include: {
      season: { select: { label: true } },
      acts: { select: { duration: true } },
    },
  })
  if (!show) return null

  return {
    id: show.id,
    name: show.name,
    date: show.date,
    seasonLabel: show.season.label,
    totalActs: show.acts.length,
    totalDuration: show.acts.reduce((sum, a) => sum + (a.duration ?? 0), 0),
    missingDuration: show.acts.filter((a) => a.duration == null).length,
    slug: slugify(show.name, show.season.label),
  }
})
