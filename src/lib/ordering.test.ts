import { describe, it, expect } from "vitest"
import { generateOrder } from "./ordering"
import type { Act } from "@prisma/client"

function makeAct(id: string, overrides: Partial<Act> = {}): Act {
  return {
    id,
    name: `Act ${id}`,
    classId: "class-1",
    showId: "show-1",
    priority: null,
    fixedPosition: null,
    createdAt: new Date(),
    ...overrides,
  }
}

describe("generateOrder", () => {
  it("returns all acts", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c")]
    const result = generateOrder(acts, [])
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.actId).sort()).toEqual(["a", "b", "c"])
  })

  it("respects fixedPosition", () => {
    const acts = [makeAct("a"), makeAct("b", { fixedPosition: 0 }), makeAct("c")]
    const result = generateOrder(acts, [])
    const fixed = result.find((r) => r.actId === "b")
    expect(fixed?.position).toBe(0)
  })

  it("respects priority order", () => {
    const acts = [
      makeAct("a", { priority: 3 }),
      makeAct("b", { priority: 1 }),
      makeAct("c", { priority: 2 }),
    ]
    const result = generateOrder(acts, [])
    const positions = ["b", "c", "a"].map((id) => result.find((r) => r.actId === id)!.position)
    expect(positions[0]).toBeLessThan(positions[1])
    expect(positions[1]).toBeLessThan(positions[2])
  })
})
