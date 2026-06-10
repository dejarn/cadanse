import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { broadcastShow } from "@/lib/sse-emitter"
import { toPublicAct, publicActInclude } from "@/lib/publicAct"

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
        include: publicActInclude,
        orderBy: { position: "asc" },
      },
    },
  })

  broadcastShow(id, {
    acts: show.actPositions.map(toPublicAct),
    currentPosition: show.currentPosition,
  })

  return NextResponse.json({ data: show })
}
