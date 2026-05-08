import type { Act } from "@prisma/client"

interface ActConfig {
  actId: string
  fixedPosition?: number
}

interface OrderedAct {
  actId: string
  position: number
}

/**
 * Generate a performance order respecting:
 * 1. fixedPosition — pins act to a specific slot
 */
export function generateOrder(
  acts: Act[],
  configs: ActConfig[],
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

  // Build result array
  const totalSlots = acts.length
  const result: Array<OrderedAct | null> = Array(totalSlots).fill(null)

  // Place fixed first (clamp out-of-range positions)
  for (const { act, position } of fixed) {
    const clamped = Math.min(position, totalSlots - 1)
    if (result[clamped] === null) {
      result[clamped] = { actId: act.id, position: clamped }
    } else {
      // Collision — find next free slot
      const freeIdx = result.indexOf(null)
      if (freeIdx !== -1) result[freeIdx] = { actId: act.id, position: freeIdx }
    }
  }

  // Fill remaining slots with flexible acts (in input order)
  let flexIdx = 0
  for (let i = 0; i < totalSlots; i++) {
    if (result[i] === null && flexIdx < flexible.length) {
      result[i] = { actId: flexible[flexIdx].id, position: i }
      flexIdx++
    }
  }

  return (result.filter(Boolean) as OrderedAct[])
}
