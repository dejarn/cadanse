import { useRef, useState } from "react"

type EntityWithId = { id: string }

export function useEntityDialog<T extends EntityWithId>(items: T[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? (items.find((item) => item.id === selectedId) ?? null) : null
  const selectedRef = useRef<T | null>(null)

  if (selected) selectedRef.current = selected

  return {
    selected,
    displaySelected: selected ?? selectedRef.current,
    open: (item: T) => setSelectedId(item.id),
    close: () => setSelectedId(null),
  }
}
