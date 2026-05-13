import type { Act } from "@prisma/client"

export interface ActConfig {
  actId: string
  fixedPosition?: number
}

export interface OrderedAct {
  actId: string
  position: number
}

export interface ParticipantMap {
  [actId: string]: Set<string>
}

/**
 * Penalty for placing two acts with shared students `gap` positions apart.
 * gap 1 (back-to-back) → 4, gap 2 → 3, gap 3 → 2, gap 4 → 1, gap 5+ → 0
 */
function gapPenalty(gap: number): number {
  return Math.max(0, 5 - gap)
}

/** Score an entire ordering — sum of penalties for all student-adjacent acts. Lower = better. */
export function scoreOrder(
  order: OrderedAct[],
  participants: ParticipantMap,
): number {
  let total = 0
  for (const act of order) {
    const students = participants[act.actId]
    if (!students || students.size === 0) continue
    for (const studentId of students) {
      for (const other of order) {
        if (other.actId === act.actId) continue
        const otherStudents = participants[other.actId]
        if (!otherStudents || !otherStudents.has(studentId)) continue
        const gap = Math.abs(act.position - other.position)
        total += gapPenalty(gap)
      }
    }
  }
  // Each pair counted twice (act↔other), divide by 2
  return total / 2
}

/**
 * Generate a performance order respecting:
 * 1. fixedPosition — pins act to a specific slot (invariant)
 * 2. Student spacing — maximises gaps between acts sharing students (soft, best-effort)
 */
export function generateOrder(
  acts: Act[],
  configs: ActConfig[],
  participants: ParticipantMap = {},
): OrderedAct[] {
  const configMap = new Map(configs.map((c) => [c.actId, c]))

  const fixed: Array<{ act: Act; position: number }> = []
  const flexible: Act[] = []

  for (const act of acts) {
    const config = configMap.get(act.id)
    const fp = config?.fixedPosition ?? act.fixedPosition
    if (fp != null) {
      fixed.push({ act, position: fp })
    } else {
      flexible.push(act)
    }
  }

  const totalSlots = acts.length
  const slots: Array<string | null> = Array(totalSlots).fill(null)

  // Place fixed acts (invariant)
  for (const { act, position } of fixed) {
    const clamped = Math.min(position, totalSlots - 1)
    if (slots[clamped] === null) {
      slots[clamped] = act.id
    } else {
      const freeIdx = slots.indexOf(null)
      if (freeIdx !== -1) slots[freeIdx] = act.id
    }
  }

  // No flexible acts → return fixed only
  if (flexible.length === 0) {
    return slots.map((actId, i) => actId ? { actId, position: i } : null).filter(Boolean) as OrderedAct[]
  }

  // --- Greedy phase: place most-constrained flexible acts first ---

  const available = slots.map((v, i) => v === null ? i : -1).filter((i) => i !== -1)

  // Sort flexible acts by constraint score (most shared students with fixed acts → first)
  const fixedIds = new Set(fixed.map((f) => f.act.id))
  const flexibleSorted = [...flexible].sort((a, b) => {
    const scoreA = constraintScore(a.id, fixedIds, participants)
    const scoreB = constraintScore(b.id, fixedIds, participants)
    return scoreB - scoreA
  })

  const placed = new Map<string, number>() // actId → position (includes fixed)

  for (const f of fixed) {
    const slotIdx = slots.indexOf(f.act.id)
    if (slotIdx !== -1) placed.set(f.act.id, slotIdx)
  }

  for (const act of flexibleSorted) {
    const freeSlots = slots.map((v, i) => v === null ? i : -1).filter((i) => i !== -1)
    if (freeSlots.length === 0) break

    let bestSlot = freeSlots[0]
    let bestPenalty = Infinity

    for (const slot of freeSlots) {
      const penalty = placementPenalty(act.id, slot, placed, participants)
      if (penalty < bestPenalty) {
        bestPenalty = penalty
        bestSlot = slot
      }
    }

    slots[bestSlot] = act.id
    placed.set(act.id, bestSlot)
  }

  // --- Local search phase: swap pairs to improve score ---

  const flexibleIds = new Set(flexible.map((a) => a.id))
  const maxIter = flexible.length * 100
  const noImproveLimit = flexible.length * 20
  let noImprove = 0

  for (let iter = 0; iter < maxIter && noImprove < noImproveLimit; iter++) {
    const flexSlots = [...placed.entries()]
      .filter(([id]) => flexibleIds.has(id))
      .map(([, pos]) => pos)

    if (flexSlots.length < 2) break

    const i = flexSlots[Math.floor(Math.random() * flexSlots.length)]
    const j = flexSlots[Math.floor(Math.random() * flexSlots.length)]
    if (i === j) { noImprove++; continue }

    const actI = slots[i]!
    const actJ = slots[j]!

    const before = placementPenalty(actI, i, placed, participants) +
                   placementPenalty(actJ, j, placed, participants)

    // Simulate swap
    placed.set(actI, j)
    placed.set(actJ, i)

    const after = placementPenalty(actI, j, placed, participants) +
                  placementPenalty(actJ, i, placed, participants)

    if (after < before) {
      // Keep swap
      slots[i] = actJ
      slots[j] = actI
      noImprove = 0
    } else {
      // Revert
      placed.set(actI, i)
      placed.set(actJ, j)
      noImprove++
    }
  }

  return slots
    .map((actId, i) => actId ? { actId, position: i } : null)
    .filter(Boolean) as OrderedAct[]
}

/** Number of shared students between this act and a set of already-placed act IDs. */
function constraintScore(
  actId: string,
  placedIds: Set<string>,
  participants: ParticipantMap,
): number {
  const students = participants[actId]
  if (!students || students.size === 0) return 0

  let score = 0
  for (const otherId of placedIds) {
    const otherStudents = participants[otherId]
    if (!otherStudents) continue
    for (const s of students) {
      if (otherStudents.has(s)) score++
    }
  }
  return score
}

/** Penalty for placing actId at slot, considering all already-placed acts. */
function placementPenalty(
  actId: string,
  slot: number,
  placed: Map<string, number>,
  participants: ParticipantMap,
): number {
  const students = participants[actId]
  if (!students || students.size === 0) return 0

  let penalty = 0
  for (const [otherId, otherSlot] of placed) {
    if (otherId === actId) continue
    const otherStudents = participants[otherId]
    if (!otherStudents) continue
    for (const s of students) {
      if (otherStudents.has(s)) {
        penalty += gapPenalty(Math.abs(slot - otherSlot))
      }
    }
  }
  return penalty
}
