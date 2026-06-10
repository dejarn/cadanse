import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveShowBySlug } from "@/lib/slug-resolver"
import { onShow, type ShowPayload } from "@/lib/sse-emitter"
import { toPublicAct, publicActInclude } from "@/lib/publicAct"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const showId = await resolveShowBySlug(slug)
  if (!showId) {
    return new Response("Not found", { status: 404 })
  }

  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      actPositions: {
        include: publicActInclude,
        orderBy: { position: "asc" },
      },
    },
  })

  if (!show) {
    return new Response("Not found", { status: 404 })
  }

  const initialPayload: ShowPayload = {
    acts: show.actPositions.map(toPublicAct),
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
