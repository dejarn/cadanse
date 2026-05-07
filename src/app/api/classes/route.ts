import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const seasonId = req.nextUrl.searchParams.get("seasonId") ?? undefined
  const classes = await prisma.class.findMany({
    where: seasonId ? { seasonId } : undefined,
    include: { teacher: true, season: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ data: classes })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, schedule, teacherId, seasonId } = await req.json()
  const cls = await prisma.class.create({
    data: { name, schedule, teacherId, seasonId },
    include: { teacher: true },
  })

  return NextResponse.json({ data: cls }, { status: 201 })
}
