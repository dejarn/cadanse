import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        include: { act: true },
        orderBy: { position: "asc" },
      },
    },
  })

  // SSE broadcast handled by the stream route — emit event here in future
  return NextResponse.json({ data: show })
}
