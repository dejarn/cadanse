import { describe, it, expect } from "vitest"
import { generateOrder, scoreOrder } from "./ordering"
import type { Act } from "@prisma/client"
import type { ParticipantMap } from "./ordering"

function makeAct(id: string, overrides: Partial<Act> = {}): Act {
  return {
    id,
    name: `Act ${id}`,
    classId: "class-1",
    showId: "show-1",
    createdAt: new Date(),
    fixedPosition: null,
    duration: null,
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

  it("spaces acts sharing students — partial overlap", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c"), makeAct("d"), makeAct("e")]
    // Students: a and c share student "s1", rest are disjoint
    const participants: ParticipantMap = {
      a: new Set(["s1"]),
      b: new Set(["s2"]),
      c: new Set(["s1"]),
      d: new Set(["s3"]),
      e: new Set(["s4"]),
    }

    const result = generateOrder(acts, [], participants)

    const posA = result.find((r) => r.actId === "a")!.position
    const posC = result.find((r) => r.actId === "c")!.position
    const gap = Math.abs(posA - posC)

    // With 5 slots, optimal gap for a↔c is at least 2
    expect(gap).toBeGreaterThanOrEqual(2)
  })

  it("places all acts even with full student overlap", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c"), makeAct("d")]
    const participants: ParticipantMap = {
      a: new Set(["s1"]),
      b: new Set(["s1"]),
      c: new Set(["s1"]),
      d: new Set(["s1"]),
    }

    const result = generateOrder(acts, [], participants)
    expect(result).toHaveLength(4)
    expect(result.map((r) => r.actId).sort()).toEqual(["a", "b", "c", "d"])
  })

  it("respects fixedPosition while spacing flexible acts", () => {
    const acts = [
      makeAct("fixed", { fixedPosition: 0 }),
      makeAct("x"),
      makeAct("y"),
      makeAct("z"),
    ]
    // x and y share student, fixed is locked at 0
    const participants: ParticipantMap = {
      fixed: new Set(["s0"]),
      x: new Set(["s1"]),
      y: new Set(["s1"]),
      z: new Set(["s2"]),
    }

    const result = generateOrder(acts, [], participants)

    const fixedAct = result.find((r) => r.actId === "fixed")!
    expect(fixedAct.position).toBe(0)

    const posX = result.find((r) => r.actId === "x")!.position
    const posY = result.find((r) => r.actId === "y")!.position
    expect(Math.abs(posX - posY)).toBeGreaterThanOrEqual(2)
  })

  it("handles acts with no participants (neutral)", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c")]
    const participants: ParticipantMap = {
      a: new Set(["s1"]),
      b: new Set(),  // no participants
      c: new Set(["s1"]),
    }

    const result = generateOrder(acts, [], participants)
    expect(result).toHaveLength(3)

    const posA = result.find((r) => r.actId === "a")!.position
    const posC = result.find((r) => r.actId === "c")!.position
    // a and c should still be spaced apart despite b being neutral
    expect(Math.abs(posA - posC)).toBeGreaterThanOrEqual(2)
  })

  it("improves score over naive sequential order", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c"), makeAct("d"), makeAct("e"), makeAct("f")]
    // Multiple overlapping groups
    const participants: ParticipantMap = {
      a: new Set(["s1", "s2"]),
      b: new Set(["s2", "s3"]),
      c: new Set(["s1", "s3"]),
      d: new Set(["s4"]),
      e: new Set(["s5"]),
      f: new Set(["s6"]),
    }

    const result = generateOrder(acts, [], participants)

    // Build naive order for comparison
    const naive: { actId: string; position: number }[] = acts.map((a, i) => ({
      actId: a.id,
      position: i,
    }))

    const naiveScore = scoreOrder(naive, participants)
    const resultScore = scoreOrder(result, participants)

    expect(resultScore).toBeLessThanOrEqual(naiveScore)
  })

  it("works with empty ParticipantMap (backward compat)", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c")]
    const result = generateOrder(acts, [])
    expect(result).toHaveLength(3)
  })

  it("clamps fixedPosition out of bounds to last slot", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c")]
    const configs = [{ actId: "b", fixedPosition: 99 }]
    const result = generateOrder(acts, configs, {}, 42)
    const fixed = result.find((r) => r.actId === "b")!
    expect(fixed.position).toBe(2) // clamped to last slot
    expect(result).toHaveLength(3)
  })

  it("resolves fixedPosition conflict — both acts appear in output", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c")]
    const configs = [
      { actId: "a", fixedPosition: 0 },
      { actId: "b", fixedPosition: 0 },
    ]
    const result = generateOrder(acts, configs, {}, 42)
    expect(result).toHaveLength(3)
    const ids = result.map((r) => r.actId).sort()
    expect(ids).toEqual(["a", "b", "c"])
    // Exactly one of a/b at position 0
    const atZero = result.filter((r) => r.position === 0)
    expect(atZero).toHaveLength(1)
  })

  it("returns empty array for empty acts input", () => {
    expect(generateOrder([], [], {}, 42)).toEqual([])
  })

  it("all acts fixed — places each at correct position", () => {
    const acts = [
      makeAct("a"),
      makeAct("b"),
      makeAct("c"),
    ]
    const configs = [
      { actId: "a", fixedPosition: 2 },
      { actId: "b", fixedPosition: 0 },
      { actId: "c", fixedPosition: 1 },
    ]
    const result = generateOrder(acts, configs, {}, 42)
    expect(result).toHaveLength(3)
    expect(result.find((r) => r.actId === "b")!.position).toBe(0)
    expect(result.find((r) => r.actId === "c")!.position).toBe(1)
    expect(result.find((r) => r.actId === "a")!.position).toBe(2)
  })

  it("handles single act with no config", () => {
    const acts = [makeAct("a")]
    const result = generateOrder(acts, [], {}, 42)
    expect(result).toHaveLength(1)
    expect(result[0].actId).toBe("a")
    expect(result[0].position).toBe(0)
  })

  it("respects fixedPosition passed via ActConfig rather than Act model", () => {
    const acts = [makeAct("a"), makeAct("b"), makeAct("c")]
    const configs = [{ actId: "b", fixedPosition: 2 }]
    const result = generateOrder(acts, configs, {}, 42)
    expect(result.find((r) => r.actId === "b")!.position).toBe(2)
  })
})

describe("scoreOrder", () => {
  it("returns 0 for empty order", () => {
    expect(scoreOrder([], {})).toBe(0)
  })

  it("returns 0 for single act", () => {
    expect(scoreOrder([{ actId: "a", position: 0 }], { a: new Set(["s1"]) })).toBe(0)
  })

  it("penalises back-to-back acts sharing a student (gap 1 → penalty 4)", () => {
    const order = [
      { actId: "a", position: 0 },
      { actId: "b", position: 1 },
    ]
    const p: ParticipantMap = { a: new Set(["s1"]), b: new Set(["s1"]) }
    // gap=1, penalty=4, pair counted twice then /2 = 4
    expect(scoreOrder(order, p)).toBe(4)
  })

  it("no penalty when gap >= 5", () => {
    const order = [
      { actId: "a", position: 0 },
      { actId: "b", position: 5 },
    ]
    const p: ParticipantMap = { a: new Set(["s1"]), b: new Set(["s1"]) }
    expect(scoreOrder(order, p)).toBe(0)
  })

  it("no penalty for acts with no shared students", () => {
    const order = [
      { actId: "a", position: 0 },
      { actId: "b", position: 1 },
    ]
    const p: ParticipantMap = { a: new Set(["s1"]), b: new Set(["s2"]) }
    expect(scoreOrder(order, p)).toBe(0)
  })
})
