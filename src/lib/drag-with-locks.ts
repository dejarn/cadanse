import { arrayMove } from "@dnd-kit/sortable"

export function applyDragWithLocks(
  prev: string[],
  activeId: string,
  overId: string,
  lockedIds: Set<string>,
): string[] {
  if (lockedIds.has(activeId)) return prev

  const lockedPositions = new Map<string, number>()
  for (const id of lockedIds) lockedPositions.set(id, prev.indexOf(id))

  const unlocked = prev.filter((id) => !lockedIds.has(id))
  const oldIdx = unlocked.indexOf(activeId)

  let newIdx: number
  if (lockedIds.has(overId)) {
    const activeFullIdx = prev.indexOf(activeId)
    const overFullIdx = prev.indexOf(overId)
    const rest = unlocked.filter((id) => id !== activeId)
    if (activeFullIdx < overFullIdx) {
      newIdx = rest.filter((id) => prev.indexOf(id) < overFullIdx).length
    } else {
      newIdx = rest.filter((id) => prev.indexOf(id) <= overFullIdx).length
    }
  } else {
    newIdx = unlocked.indexOf(overId)
  }

  if (oldIdx === newIdx) return prev

  const newUnlocked = arrayMove(unlocked, oldIdx, newIdx)

  const result = new Array<string>(prev.length)
  for (const [id, idx] of lockedPositions) result[idx] = id
  let ui = 0
  for (let i = 0; i < result.length; i++) {
    if (!result[i]) result[i] = newUnlocked[ui++]
  }
  return result
}
