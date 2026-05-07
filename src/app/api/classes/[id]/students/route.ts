import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: classId } = await params
  const enrollments = await prisma.studentClass.findMany({
    where: { classId },
    include: { student: true },
  })

  return NextResponse.json({ data: enrollments.map((e) => e.student) })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: classId } = await params
  const { studentId } = await req.json()

  await prisma.studentClass.create({ data: { studentId, classId } })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: classId } = await params
  const { studentId } = await req.json()

  await prisma.studentClass.delete({ where: { studentId_classId: { studentId, classId } } })
  return new NextResponse(null, { status: 204 })
}
