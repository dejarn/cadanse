import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const students = await prisma.student.findMany({ orderBy: { lastName: "asc" } })
  return NextResponse.json({ data: students })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { firstName, lastName } = await req.json()

  const activeSeason = await prisma.season.findFirst({ where: { isActive: true } })
  const shows = activeSeason
    ? await prisma.show.findMany({ where: { seasonId: activeSeason.id }, select: { id: true } })
    : []

  const student = await prisma.$transaction(async (tx) => {
    const newStudent = await tx.student.create({ data: { firstName, lastName } })
    await tx.showParticipation.createMany({
      data: shows.map((s) => ({ showId: s.id, studentId: newStudent.id })),
    })
    return newStudent
  })

  return NextResponse.json({ data: student }, { status: 201 })
}
