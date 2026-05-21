import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ActParticipantsClient from "./ActParticipantsClient"

interface Props {
  params: Promise<{ id: string; actId: string }>
}

export default async function ActParticipantsPage({ params }: Props) {
  const { id: showId, actId } = await params

  const act = await prisma.act.findUnique({
    where: { id: actId },
    select: { id: true, name: true, showId: true, classId: true },
  })

  if (!act || act.showId !== showId) notFound()

  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { id: true, name: true, seasonId: true },
  })

  if (!show) notFound()

  const [students, actParticipations, showParticipations, classes] = await Promise.all([
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      include: { enrollments: { select: { classId: true } } },
    }),
    prisma.actParticipation.findMany({
      where: { actId },
      select: { studentId: true },
    }),
    prisma.showParticipation.findMany({
      where: { showId },
      select: { studentId: true },
    }),
    prisma.class.findMany({
      where: { seasonId: show.seasonId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  const showParticipatingIds = new Set(showParticipations.map((p) => p.studentId))

  return (
    <ActParticipantsClient
      act={act}
      show={show}
      students={students.filter((s) => showParticipatingIds.has(s.id) && (!act.classId || s.enrollments.some((e) => e.classId === act.classId)))}
      participatingIds={actParticipations.map((p) => p.studentId)}
      classes={classes}
    />
  )
}
