import type { Prisma } from "@prisma/client"
import { teacherName } from "@/lib/teacherName"

export interface PublicAct {
  id: string
  name: string
  position: number
  className: string | null
  teacherName: string | null
  description: string | null
  schedule: string | null
}

export const publicActInclude = {
  act: { include: { class: { include: { teacher: true } } } },
} satisfies Prisma.ActPositionInclude

type ActPositionWithInclude = Prisma.ActPositionGetPayload<{
  include: typeof publicActInclude
}>

export function toPublicAct(ap: ActPositionWithInclude): PublicAct {
  return {
    id: ap.actId,
    name: ap.act.name,
    position: ap.position,
    className: ap.act.class?.name ?? null,
    teacherName: ap.act.class ? teacherName(ap.act.class.teacher) : null,
    description: ap.act.description ?? null,
    schedule: ap.act.class?.schedule ?? null,
  }
}
