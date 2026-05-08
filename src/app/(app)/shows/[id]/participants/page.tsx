import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ParticipantsClient from "./ParticipantsClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ParticipantsPage({ params }: Props) {
  const { id } = await params

  const show = await prisma.show.findUnique({
    where: { id },
    select: { id: true, name: true, seasonId: true },
  })

  if (!show) notFound()

  const [students, participations, classes] = await Promise.all([
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      include: { enrollments: { select: { classId: true } } },
    }),
    prisma.showParticipation.findMany({
      where: { showId: id },
      select: { studentId: true },
    }),
    prisma.class.findMany({
      where: { seasonId: show.seasonId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <ParticipantsClient
      show={show}
      students={students}
      participatingIds={participations.map((p) => p.studentId)}
      classes={classes}
    />
  )
}
