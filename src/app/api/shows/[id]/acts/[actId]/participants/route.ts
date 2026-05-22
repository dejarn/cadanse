import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DOT_COLORS } from "@/lib/colors"

type Params = { params: Promise<{ id: string; actId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId } = await params
  const { studentId } = await req.json()

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  await prisma.actParticipation.create({ data: { actId, studentId } })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId } = await params
  const { studentId } = await req.json()

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    const scenes = await tx.scene.findMany({ where: { actId }, select: { id: true } })
    await tx.placement.deleteMany({
      where: { sceneId: { in: scenes.map((s) => s.id) }, studentId },
    })
    await tx.actParticipation.delete({
      where: { actId_studentId: { actId, studentId } },
    })
  })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId } = await params
  const { studentId, color } = await req.json()

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  if (studentId == null || color == null) {
    return NextResponse.json({ error: "studentId and color are required" }, { status: 400 })
  }

  if (typeof color !== "number" || color < 0 || color >= DOT_COLORS.length) {
    return NextResponse.json({ error: "Invalid color index" }, { status: 400 })
  }

  await prisma.actParticipation.update({
    where: { actId_studentId: { actId, studentId } },
    data: { color },
  })

  return NextResponse.json({ ok: true })
}
