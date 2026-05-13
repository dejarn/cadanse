import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  await prisma.actParticipation.delete({
    where: { actId_studentId: { actId, studentId } },
  })
  return new NextResponse(null, { status: 204 })
}
