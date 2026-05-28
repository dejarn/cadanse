import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateShowSlugCache } from "@/lib/show-slug-cache"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const seasonId = req.nextUrl.searchParams.get("seasonId") ?? undefined
  const shows = await prisma.show.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { date: "asc" },
  })

  return NextResponse.json({ data: shows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, date, seasonId, duplicateFromId } = await req.json()

  const seasonStudents = await prisma.studentClass.findMany({
    where: { class: { seasonId } },
    select: { studentId: true },
    distinct: ["studentId"],
  })

  const sourceShow = duplicateFromId
    ? await prisma.show.findUnique({
        where: { id: duplicateFromId },
        include: {
          acts: {
            include: {
              participations: true,
              actPositions: true,
              scenes: { include: { placements: true } },
            },
          },
        },
      })
    : null

  const show = await prisma.$transaction(async (tx) => {
    const newShow = await tx.show.create({ data: { name, date: new Date(date), seasonId } })
    await tx.showParticipation.createMany({
      data: seasonStudents.map((s) => ({ showId: newShow.id, studentId: s.studentId })),
    })

    if (sourceShow) {
      for (const act of sourceShow.acts) {
        const newAct = await tx.act.create({
          data: {
            name: act.name,
            classId: act.classId,
            showId: newShow.id,
            fixedPosition: act.fixedPosition,
            duration: act.duration,
          },
        })
        if (act.participations.length > 0) {
          await tx.actParticipation.createMany({
            data: act.participations.map((p) => ({
              actId: newAct.id,
              studentId: p.studentId,
              color: p.color,
            })),
          })
        }
        if (act.actPositions.length > 0) {
          await tx.actPosition.createMany({
            data: act.actPositions.map((ap) => ({
              showId: newShow.id,
              actId: newAct.id,
              position: ap.position,
            })),
          })
        }
        for (const scene of act.scenes) {
          const newScene = await tx.scene.create({
            data: { name: scene.name, order: scene.order, actId: newAct.id },
          })
          if (scene.placements.length > 0) {
            await tx.placement.createMany({
              data: scene.placements.map((p) => ({
                x: p.x,
                y: p.y,
                sceneId: newScene.id,
                studentId: p.studentId,
              })),
            })
          }
        }
      }
    }

    return newShow
  })

  invalidateShowSlugCache()
  return NextResponse.json({ data: show }, { status: 201 })
}
