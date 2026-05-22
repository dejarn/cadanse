import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { broadcastShow } from "@/lib/sse-emitter"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const positions = await prisma.actPosition.findMany({
    where: { showId },
    include: { act: true },
    orderBy: { position: "asc" },
  })

  return NextResponse.json({ data: positions })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const { positions } = await req.json() as {
    positions: { actId: string; position: number }[]
  }

  const { rows, show } = await prisma.$transaction(async (tx) => {
    await tx.actPosition.deleteMany({ where: { showId } })
    await tx.actPosition.createMany({
      data: positions.map((p) => ({ showId, actId: p.actId, position: p.position })),
    })
    const rows = await tx.actPosition.findMany({
      where: { showId },
      include: { act: { include: { class: { include: { teacher: true } } } } },
      orderBy: { position: "asc" },
    })
    const show = await tx.show.findUnique({ where: { id: showId } })
    return { rows, show }
  })

  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 })

  broadcastShow(showId, {
    acts: rows.map((p) => ({
      id: p.actId,
      name: p.act.name,
      position: p.position,
      className: p.act.class?.name ?? null,
      teacherName: p.act.class
        ? p.act.class.teacher.displayName ?? `${p.act.class.teacher.firstName} ${p.act.class.teacher.lastName}`
        : null,
    })),
    currentPosition: show?.currentPosition ?? null,
  })

  return NextResponse.json({ ok: true })
}
