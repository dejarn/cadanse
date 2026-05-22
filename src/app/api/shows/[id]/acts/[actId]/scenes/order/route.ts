import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; actId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId } = await params

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  const body = await req.json()
  const { ids } = body

  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "ids must be a non-empty array of strings" }, { status: 400 })
  }

  // Verify all ids belong to this act
  const scenes = await prisma.scene.findMany({
    where: { id: { in: ids }, actId },
    select: { id: true },
  })

  if (scenes.length !== ids.length) {
    return NextResponse.json({ error: "Some scene ids are invalid" }, { status: 400 })
  }

  await prisma.$transaction(
    ids.map((sceneId, index) =>
      prisma.scene.update({ where: { id: sceneId }, data: { order: index } }),
    ),
  )

  return NextResponse.json({ ok: true })
}
