import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const season = await prisma.season.update({
    where: { id },
    data: { label: body.label },
  })

  return NextResponse.json({ data: season })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const season = await prisma.season.findUnique({
    where: { id },
    include: { _count: { select: { classes: true, shows: true } } },
  })

  if ((season?._count.classes ?? 0) > 0 || (season?._count.shows ?? 0) > 0) {
    return NextResponse.json({ error: "Cette saison contient des cours ou spectacles." }, { status: 409 })
  }

  await prisma.season.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
