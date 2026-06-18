import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import OrderClient from "./OrderClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      acts: {
        include: {
          class: { include: { teacher: true } },
          participations: {
            select: { student: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      actPositions: { orderBy: { position: "asc" } },
    },
  })

  if (!show) notFound()

  const classes = await prisma.class.findMany({
    where: { seasonId: show.seasonId },
    orderBy: { name: "asc" },
  })

  const participants: Record<string, string[]> = {}
  const studentNames: Record<string, string> = {}
  for (const act of show.acts) {
    participants[act.id] = act.participations.map((p) => p.student.id)
    for (const { student } of act.participations) {
      studentNames[student.id] = `${student.firstName} ${student.lastName}`
    }
  }

  // Strip participations from acts before passing to the client component —
  // OrderClient receives the data it needs via the participants/studentNames maps.
  const acts = show.acts.map((act) => {
    const { participations, ...rest } = act
    void participations
    return rest
  })

  return (
    <OrderClient
      show={{ ...show, acts }}
      classes={classes}
      participants={participants}
      studentNames={studentNames}
    />
  )
}
