import { EventEmitter } from "events"

const g = globalThis as unknown as { showEmitter: EventEmitter }

export const showEmitter = g.showEmitter ?? new EventEmitter()
showEmitter.setMaxListeners(200)

if (process.env.NODE_ENV !== "production") g.showEmitter = showEmitter

export type ShowPayload = {
  acts: { id: string; name: string; position: number; className: string | null; teacherName: string | null }[]
  currentPosition: number | null
}

export function broadcastShow(showId: string, payload: ShowPayload) {
  showEmitter.emit(`show:${showId}`, payload)
}

export function onShow(showId: string, cb: (p: ShowPayload) => void) {
  showEmitter.on(`show:${showId}`, cb)
  return () => showEmitter.off(`show:${showId}`, cb)
}
