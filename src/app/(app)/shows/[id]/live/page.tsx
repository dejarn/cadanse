import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"
import LiveClient from "./LiveClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function LivePage({ params }: Props) {
  const { id } = await params

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      season: true,
      actPositions: {
        include: { act: { include: { class: { include: { teacher: true } } } } },
        orderBy: { position: "asc" },
      },
    },
  })

  if (!show) notFound()

  const slug = slugify(show.name, show.season.label)
  const acts = show.actPositions.map((ap) => ({
    id: ap.actId,
    name: ap.act.name,
    position: ap.position,
    className: ap.act.class?.name ?? null,
    teacherName: ap.act.class
      ? ap.act.class.teacher.displayName ?? `${ap.act.class.teacher.firstName} ${ap.act.class.teacher.lastName}`
      : null,
  }))

  return (
    <LiveClient
      showId={show.id}
      showName={show.name}
      currentPosition={show.currentPosition}
      acts={acts}
      slug={slug}
    />
  )
}
