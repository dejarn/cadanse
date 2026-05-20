import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"

type Params = { params: Promise<{ slug: string; actId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug, actId } = await params

  const shows = await prisma.show.findMany({
    include: { season: true },
  })

  const show = shows.find((s) => slugify(s.name, s.season.label) === slug)
  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 })

  const act = await prisma.act.findUnique({
    where: { id: actId },
    select: { showId: true, name: true },
  })
  if (!act || act.showId !== show.id) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  const scenes = await prisma.scene.findMany({
    where: { actId },
    include: {
      placements: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  })

  const participations = await prisma.actParticipation.findMany({
    where: { actId },
    select: { studentId: true, color: true },
  })

  const colorMap = new Map(participations.map((p) => [p.studentId, p.color]))

  const data = {
    actName: act.name,
    showName: show.name,
    scenes: scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      order: scene.order,
      placements: scene.placements.map((p) => ({
        x: p.x,
        y: p.y,
        student: {
          id: p.student.id,
          firstName: p.student.firstName,
          lastName: p.student.lastName,
          color: colorMap.get(p.studentId) ?? 0,
        },
      })),
    })),
  }

  return NextResponse.json({ data })
}
