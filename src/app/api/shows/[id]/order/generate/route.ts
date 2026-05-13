import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateOrder } from "@/lib/ordering"
import type { ParticipantMap } from "@/lib/ordering"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const { actConfigs } = await req.json() as {
    actConfigs: { actId: string; fixedPosition?: number }[]
  }

  const acts = await prisma.act.findMany({
    where: { showId },
    include: { participations: { select: { studentId: true } } },
  })

  const participants: ParticipantMap = {}
  for (const act of acts) {
    participants[act.id] = new Set(act.participations.map((p) => p.studentId))
  }

  const order = generateOrder(acts, actConfigs, participants)
  return NextResponse.json({ data: order })
}
