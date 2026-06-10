import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveShowBySlug } from "@/lib/slug-resolver"
import { toPublicAct, publicActInclude } from "@/lib/publicAct"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const showId = await resolveShowBySlug(slug)
  if (!showId) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      actPositions: {
        include: publicActInclude,
        orderBy: { position: "asc" },
      },
    },
  })

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    data: {
      id: show.id,
      name: show.name,
      date: show.date,
      currentPosition: show.currentPosition,
      acts: show.actPositions.map(toPublicAct),
    },
  })
}
