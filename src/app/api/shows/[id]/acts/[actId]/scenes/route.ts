import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; actId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId } = await params

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  const scenes = await prisma.scene.findMany({
    where: { actId },
    include: {
      placements: {
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { order: "asc" },
  })

  return NextResponse.json({ data: scenes })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId } = await params
  const { name, order } = await req.json()

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  if (order !== undefined && (typeof order !== "number" || order < 0)) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 })
  }

  const sceneCount = await prisma.scene.count({ where: { actId } })

  const scene = await prisma.scene.create({
    data: {
      name: name.trim(),
      order: order ?? sceneCount,
      actId,
    },
  })

  return NextResponse.json({ data: scene }, { status: 201 })
}
