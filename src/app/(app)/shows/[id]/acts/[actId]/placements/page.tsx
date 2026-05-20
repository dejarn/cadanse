import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"
import PlacementEditorClient from "./PlacementEditorClient"

interface Props {
  params: Promise<{ id: string; actId: string }>
}

export default async function PlacementsPage({ params }: Props) {
  const { id: showId, actId } = await params

  const act = await prisma.act.findUnique({
    where: { id: actId },
    select: { id: true, name: true, showId: true },
  })

  if (!act || act.showId !== showId) notFound()

  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { id: true, name: true, seasonId: true, season: { select: { label: true } } },
  })

  if (!show) notFound()

  const [participations, scenes] = await Promise.all([
    prisma.actParticipation.findMany({
      where: { actId },
      select: { studentId: true, color: true, student: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.scene.findMany({
      where: { actId },
      include: {
        placements: {
          select: { x: true, y: true, studentId: true },
        },
      },
      orderBy: { order: "asc" },
    }),
  ])

  const slug = slugify(show.name, show.season.label)

  return (
    <PlacementEditorClient
      act={act}
      show={{ id: show.id, name: show.name }}
      slug={slug}
      participants={participations.map((p) => ({
        student: p.student,
        color: p.color,
      }))}
      initialScenes={scenes.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        placements: s.placements,
      }))}
    />
  )
}
