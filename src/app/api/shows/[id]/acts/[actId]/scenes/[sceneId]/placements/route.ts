import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; actId: string; sceneId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: showId, actId, sceneId } = await params

  const act = await prisma.act.findUnique({ where: { id: actId }, select: { showId: true } })
  if (!act || act.showId !== showId) {
    return NextResponse.json({ error: "Act not found" }, { status: 404 })
  }

  const scene = await prisma.scene.findUnique({ where: { id: sceneId }, select: { actId: true } })
  if (!scene || scene.actId !== actId) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 })
  }

  const { placements } = await req.json() as {
    placements: { studentId: string; x: number; y: number }[]
  }

  await prisma.$transaction([
    prisma.placement.deleteMany({ where: { sceneId } }),
    prisma.placement.createMany({
      data: placements.map((p) => ({
        x: Math.max(0, Math.min(100, p.x)),
        y: Math.max(0, Math.min(100, p.y)),
        sceneId,
        studentId: p.studentId,
      })),
    }),
  ])

  return NextResponse.json({ ok: true })
}
