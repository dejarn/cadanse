import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const seasons = await prisma.season.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ data: seasons })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { label } = await req.json()
  const season = await prisma.season.create({ data: { label } })
  return NextResponse.json({ data: season }, { status: 201 })
}
