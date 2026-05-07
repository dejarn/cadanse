import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: classId } = await params
  const enrollments = await prisma.studentClass.findMany({
    where: { classId },
    include: { student: true },
    orderBy: { student: { lastName: "asc" } },
  })

  return NextResponse.json({ data: enrollments.map((e) => e.student) })
}
