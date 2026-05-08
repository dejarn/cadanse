import type { Act } from "@prisma/client"

interface ActConfig {
  actId: string
  priority?: number
  fixedPosition?: number
}

interface OrderedAct {
  actId: string
  position: number
}

/**
 * Generate a performance order respecting:
 * 1. fixedPosition — overrides everything
 * 2. priority (1 = earliest) — lower number plays first
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

  // Sort flexible by priority (ascending, nulls last)
  flexible.sort((a, b) => {
    const pa = configMap.get(a.id)?.priority ?? a.priority ?? Infinity
    const pb = configMap.get(b.id)?.priority ?? b.priority ?? Infinity
    return pa - pb
  })

  // Build result array
  const totalSlots = acts.length
  const result: Array<OrderedAct | null> = Array(totalSlots).fill(null)

  // Place fixed first
  for (const { act, position } of fixed) {
    if (position < totalSlots) {
      result[position] = { actId: act.id, position }
    }
  }

  // Fill remaining slots with flexible acts (in priority order)
  let flexIdx = 0
  for (let i = 0; i < totalSlots; i++) {
    if (result[i] === null && flexIdx < flexible.length) {
      result[i] = { actId: flexible[flexIdx].id, position: i }
      flexIdx++
    }
  }

  return (result.filter(Boolean) as OrderedAct[])
}
