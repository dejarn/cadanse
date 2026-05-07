import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

function slugify(name: string, seasonLabel: string): string {
  const raw = `${name}-${seasonLabel}`
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// Simple SSE stub: polls DB every 5s and pushes current state.
// Replace with event-driven broadcast in production.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      async function push() {
        const shows = await prisma.show.findMany({
          include: {
            season: true,
            actPositions: {
              include: { act: true },
              orderBy: { position: "asc" },
            },
          },
        })

        const show = shows.find((s) => slugify(s.name, s.season.label) === slug)
        if (!show) return

        const payload = {
          acts: show.actPositions.map((ap) => ({
            id: ap.actId,
            name: ap.act.name,
            position: ap.position,
          })),
          currentPosition: show.currentPosition,
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      await push()
      const interval = setInterval(push, 5000)

      // Cleanup when client disconnects — interval cleared by GC in stub
      // In production, wire to AbortSignal from req.signal
      void interval
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
