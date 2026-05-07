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
  const { name, classId, priority, fixedPosition } = await req.json()

  // Create act + auto-create participation rows for all enrolled students
  const enrollments = await prisma.studentClass.findMany({ where: { classId } })

  const act = await prisma.$transaction(async (tx) => {
    const newAct = await tx.act.create({
      data: { name, classId, showId, priority, fixedPosition },
    })
    await tx.participation.createMany({
      data: enrollments.map((e) => ({ studentId: e.studentId, actId: newAct.id })),
    })
    return newAct
  })

  return NextResponse.json({ data: act }, { status: 201 })
}
