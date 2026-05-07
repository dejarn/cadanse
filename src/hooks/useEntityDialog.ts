import { useState } from "react"

type EntityWithId = { id: string }

export function useEntityDialog<T extends EntityWithId>(items: T[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastSelected, setLastSelected] = useState<T | null>(null)
  const selected = selectedId ? (items.find((item) => item.id === selectedId) ?? null) : null

  return {
    selected,
    get displaySelected() {
      return items.find((item) => item.id === selectedId) ?? lastSelected
    },
    open: (item: T) => {
      setSelectedId(item.id)
      setLastSelected(item)
    },
    close: () => setSelectedId(null),
  }
}
