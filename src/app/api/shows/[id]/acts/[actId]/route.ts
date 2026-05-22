import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; actId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { actId } = await params
  const body = await req.json()

  // Whitelist user-editable fields to prevent mass assignment
  const { name, fixedPosition, classId, duration } = body
  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (fixedPosition !== undefined) data.fixedPosition = fixedPosition
  if (classId !== undefined) data.classId = classId
  if (duration !== undefined) data.duration = duration

  // Wrap act update and participation rebuild in a single transaction
  const act = await prisma.$transaction(async (tx) => {
    const updated = await tx.act.update({ where: { id: actId }, data })

    // Rebuild ActParticipation when classId changes
    if ("classId" in body) {
      await tx.actParticipation.deleteMany({ where: { actId } })

      if (body.classId) {
        const enrollments = await tx.studentClass.findMany({
          where: { classId: body.classId },
          select: { studentId: true },
        })
        if (enrollments.length > 0) {
          await tx.actParticipation.createMany({
            data: enrollments.map((e) => ({ actId, studentId: e.studentId })),
            skipDuplicates: true,
          })
        }
      }
    }

    return updated
  })

  return NextResponse.json({ data: act })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { actId } = await params
  await prisma.act.delete({ where: { id: actId } })
  return new NextResponse(null, { status: 204 })
}
