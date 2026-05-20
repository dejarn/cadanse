import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; actId: string; sceneId: string }> }

async function verifyScene(showId: string, actId: string, sceneId: string) {
  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) return null

  const scene = await prisma.scene.findUnique({ where: { id: sceneId }, select: { actId: true } })
  if (!scene || scene.actId !== actId) return null

  return scene
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId, sceneId } = await params
  const scene = await verifyScene(showId, actId, sceneId)
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.order !== undefined) {
    if (typeof body.order !== "number" || body.order < 0) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 })
    }
    data.order = body.order
  }

  const updated = await prisma.scene.update({ where: { id: sceneId }, data })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId, sceneId } = await params
  const scene = await verifyScene(showId, actId, sceneId)
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 })

  await prisma.scene.delete({ where: { id: sceneId } })
  return new NextResponse(null, { status: 204 })
}
