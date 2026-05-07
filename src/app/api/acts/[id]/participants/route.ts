import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: actId } = await params
  const participations = await prisma.participation.findMany({
    where: { actId },
    include: { student: true },
  })

  return NextResponse.json({ data: participations.map((p) => p.student) })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: actId } = await params
  const { studentId } = await req.json()

  await prisma.participation.create({ data: { studentId, actId } })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: actId } = await params
  const { studentId } = await req.json()

  await prisma.participation.delete({ where: { studentId_actId: { studentId, actId } } })
  return new NextResponse(null, { status: 204 })
}
