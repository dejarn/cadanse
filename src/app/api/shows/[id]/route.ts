import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateShowSlugCache } from "@/lib/show-slug-cache"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const show = await prisma.show.update({
    where: { id },
    data: { name: body.name, date: body.date ? new Date(body.date) : undefined },
  })

  invalidateShowSlugCache()
  return NextResponse.json({ data: show })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.show.delete({ where: { id } })
  invalidateShowSlugCache()
  return new NextResponse(null, { status: 204 })
}
