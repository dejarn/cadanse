import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const cls = await prisma.class.update({ where: { id }, data: body })
  return NextResponse.json({ data: cls })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const cls = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { acts: true } } },
  })

  if ((cls?._count.acts ?? 0) > 0) {
    return NextResponse.json({ error: "Ce cours est associé à des numéros de spectacle." }, { status: 409 })
  }

  await prisma.class.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
