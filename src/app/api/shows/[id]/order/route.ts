import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  await prisma.$transaction([
    prisma.actPosition.deleteMany({ where: { showId } }),
    prisma.actPosition.createMany({
      data: positions.map((p) => ({ showId, actId: p.actId, position: p.position })),
    }),
  ])

  // SSE broadcast: to be implemented via global event emitter or DB polling
  return NextResponse.json({ ok: true })
}
