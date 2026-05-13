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

  const [enrollments] = await Promise.all([
    prisma.studentClass.findMany({ where: { studentId }, select: { classId: true } }),
  ])
  const enrolledClassIds = enrollments.map((e) => e.classId)

  const matchingActs = enrolledClassIds.length > 0
    ? await prisma.act.findMany({ where: { showId, classId: { in: enrolledClassIds } }, select: { id: true } })
    : []

  await prisma.$transaction([
    prisma.showParticipation.create({ data: { showId, studentId } }),
    ...(matchingActs.length > 0
      ? [prisma.actParticipation.createMany({
          data: matchingActs.map((a) => ({ actId: a.id, studentId })),
          skipDuplicates: true,
        })]
      : []),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId } = await params
  const { studentId } = await req.json()

  const actIds = await prisma.act.findMany({ where: { showId }, select: { id: true } }).then((acts) => acts.map((a) => a.id))

  await prisma.$transaction([
    prisma.actParticipation.deleteMany({ where: { actId: { in: actIds }, studentId } }),
    prisma.showParticipation.delete({ where: { showId_studentId: { showId, studentId } } }),
  ])
  return new NextResponse(null, { status: 204 })
}
