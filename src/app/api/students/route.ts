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
  const student = await prisma.student.create({ data: { firstName, lastName } })
  return NextResponse.json({ data: student }, { status: 201 })
}
