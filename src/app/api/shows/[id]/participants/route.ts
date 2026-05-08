import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const rows = await prisma.showParticipation.findMany({
    where: { showId },
    select: { studentId: true },
  })

  return NextResponse.json({ data: rows.map((r) => r.studentId) })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const { studentId } = await req.json()

  await prisma.showParticipation.create({ data: { showId, studentId } })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const { studentId } = await req.json()

  await prisma.showParticipation.delete({
    where: { showId_studentId: { showId, studentId } },
  })
  return new NextResponse(null, { status: 204 })
}
