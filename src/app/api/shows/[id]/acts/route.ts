import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const acts = await prisma.act.findMany({
    where: { showId },
    include: { class: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ data: acts })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const { name, classId, fixedPosition, duration } = await req.json()

  const act = await prisma.act.create({
    data: { name, classId, showId, fixedPosition, duration },
  })

  return NextResponse.json({ data: act }, { status: 201 })
}
