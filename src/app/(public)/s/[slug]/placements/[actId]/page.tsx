import { notFound } from "next/navigation"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import { resolveShowBySlug } from "@/lib/slug-resolver"
import PlacementsPublicClient from "./PlacementsPublicClient"

interface Props {
  params: Promise<{ slug: string; actId: string }>
}

export default async function PublicPlacementsPage({ params }: Props) {
  const { slug, actId } = await params

  const showId = await resolveShowBySlug(slug)
  if (!showId) notFound()

  const [show, act] = await Promise.all([
    prisma.show.findUnique({
      where: { id: showId },
      select: { id: true, name: true },
    }),
    prisma.act.findUnique({
      where: { id: actId },
      select: { showId: true, name: true },
    }),
  ])

  if (!show || !act || act.showId !== show.id) notFound()

  const [scenes, participations] = await Promise.all([
    prisma.scene.findMany({
      where: { actId },
      include: {
        placements: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    }),
    prisma.actParticipation.findMany({
      where: { actId },
      select: { studentId: true, color: true },
    }),
  ])

  const colorMap = new Map(participations.map((p) => [p.studentId, p.color]))

  const scenesData = scenes.map((scene) => ({
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
  }))

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", px: 2, py: 3 }}>
      <Typography
        variant="h4"
        sx={{ fontFamily: "'Cormorant Garamond', serif", color: "primary.main", mb: 0.5 }}
      >
        {act.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {show.name}
      </Typography>

      <PlacementsPublicClient scenes={scenesData} />
    </Box>
  )
}
