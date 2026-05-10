import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { broadcastShow } from "@/lib/sse-emitter"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { currentPosition } = await req.json()

  const show = await prisma.show.update({
    where: { id },
    data: { currentPosition },
    include: {
      actPositions: {
        include: { act: { include: { class: { include: { teacher: true } } } } },
        orderBy: { position: "asc" },
      },
    },
  })

  broadcastShow(id, {
    acts: show.actPositions.map((ap) => ({
      id: ap.actId,
      name: ap.act.name,
      position: ap.position,
      className: ap.act.class?.name ?? null,
      teacherName: ap.act.class
        ? `${ap.act.class.teacher.firstName} ${ap.act.class.teacher.lastName}`
        : null,
    })),
    currentPosition: show.currentPosition,
  })

  return NextResponse.json({ data: show })
}
