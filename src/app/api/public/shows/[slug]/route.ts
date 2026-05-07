import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function slugify(name: string, seasonLabel: string): string {
  const raw = `${name}-${seasonLabel}`
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const shows = await prisma.show.findMany({
    include: {
      season: true,
      actPositions: {
        include: { act: true },
        orderBy: { position: "asc" },
      },
    },
  })

  const show = shows.find((s) => slugify(s.name, s.season.label) === slug)
  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    data: {
      id: show.id,
      name: show.name,
      date: show.date,
      currentPosition: show.currentPosition,
      acts: show.actPositions.map((ap) => ({
        id: ap.actId,
        name: ap.act.name,
        position: ap.position,
      })),
    },
  })
}
