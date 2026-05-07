import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teachers = await prisma.teacher.findMany({ orderBy: { lastName: "asc" } })
  return NextResponse.json({ data: teachers })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { firstName, lastName } = await req.json()
  const teacher = await prisma.teacher.create({ data: { firstName, lastName } })
  return NextResponse.json({ data: teacher }, { status: 201 })
}
