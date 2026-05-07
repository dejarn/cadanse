import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; actId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { actId } = await params
  const body = await req.json()

  const act = await prisma.act.update({ where: { id: actId }, data: body })
  return NextResponse.json({ data: act })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { actId } = await params
  await prisma.act.delete({ where: { id: actId } })
  return new NextResponse(null, { status: 204 })
}
