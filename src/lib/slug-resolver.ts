import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"

export async function resolveShowBySlug(slug: string): Promise<string | null> {
  const shows = await prisma.show.findMany({
    select: {
      id: true,
      name: true,
      season: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const match = shows.find((s) => slugify(s.name, s.season.label) === slug)
  return match?.id ?? null
}
