import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"
import { onShow, type ShowPayload } from "@/lib/sse-emitter"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const shows = await prisma.show.findMany({
    include: {
      season: true,
      actPositions: {
        include: { act: { include: { class: { include: { teacher: true } } } } },
        orderBy: { position: "asc" },
      },
    },
  })

  const show = shows.find((s) => slugify(s.name, s.season.label) === slug)
  if (!show) {
    return new Response("Not found", { status: 404 })
  }

  const initialPayload: ShowPayload = {
    acts: show.actPositions.map((ap) => ({
      id: ap.actId,
      name: ap.act.name,
      position: ap.position,
      className: ap.act.class?.name ?? null,
      teacherName: ap.act.class
        ? ap.act.class.teacher.displayName ?? `${ap.act.class.teacher.firstName} ${ap.act.class.teacher.lastName}`
        : null,
    })),
    currentPosition: show.currentPosition,
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPayload)}\n\n`))

      const unsub = onShow(show.id, (payload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {
          // controller already closed
        }
      })

      req.signal.addEventListener("abort", () => {
        unsub()
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
