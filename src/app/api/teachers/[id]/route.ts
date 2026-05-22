import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { firstName, lastName, displayName } = body
  const data: Record<string, unknown> = {}
  if (firstName !== undefined) data.firstName = firstName
  if (lastName !== undefined) data.lastName = lastName
  if (displayName !== undefined) data.displayName = displayName
  const teacher = await prisma.teacher.update({ where: { id }, data })
  return NextResponse.json({ data: teacher })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: { _count: { select: { classes: true } } },
  })

  if ((teacher?._count.classes ?? 0) > 0) {
    return NextResponse.json({ error: "Ce professeur est assigné à des cours." }, { status: 409 })
  }

  await prisma.teacher.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
