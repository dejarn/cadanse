import { describe, it, expect } from "vitest"
import { generateOrder } from "./ordering"
import type { Act } from "@prisma/client"

function makeAct(id: string, overrides: Partial<Act> = {}): Act {
  return {
    id,
    name: `Act ${id}`,
    classId: "class-1",
    showId: "show-1",
    createdAt: new Date(),
    fixedPosition: null,
    ...overrides,
  } as Act
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
})
