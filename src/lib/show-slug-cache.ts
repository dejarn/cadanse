import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"

const SLUG_MAP_TAG = "show-slug-map"

const getShowSlugMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const shows = await prisma.show.findMany({
      select: {
        id: true,
        name: true,
        season: { select: { label: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const map: Record<string, string> = {}
    for (const s of shows) {
      map[slugify(s.name, s.season.label)] = s.id
    }
    return map
  },
  ["show-slug-map"],
  { tags: [SLUG_MAP_TAG] },
)

export async function resolveShowBySlug(slug: string): Promise<string | null> {
  const map = await getShowSlugMap()
  return map[slug] ?? null
}

export function invalidateShowSlugCache(): void {
  revalidateTag(SLUG_MAP_TAG, { expire: 0 })
}
