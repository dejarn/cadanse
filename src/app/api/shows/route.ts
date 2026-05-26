import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateShowSlugCache } from "@/lib/show-slug-cache"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const seasonId = req.nextUrl.searchParams.get("seasonId") ?? undefined
  const shows = await prisma.show.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { date: "asc" },
  })

  return NextResponse.json({ data: shows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, date, seasonId } = await req.json()

  const seasonStudents = await prisma.studentClass.findMany({
    where: { class: { seasonId } },
    select: { studentId: true },
    distinct: ["studentId"],
  })

  const show = await prisma.$transaction(async (tx) => {
    const newShow = await tx.show.create({ data: { name, date: new Date(date), seasonId } })
    await tx.showParticipation.createMany({
      data: seasonStudents.map((s) => ({ showId: newShow.id, studentId: s.studentId })),
    })
    return newShow
  })

  invalidateShowSlugCache()
  return NextResponse.json({ data: show }, { status: 201 })
}
