import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEntityDialog } from "./useEntityDialog"

type CrudConfig<T extends { id: string }> = {
  items: T[]
  createUrl: string
  editUrl: (item: T) => string
  deleteUrl: (item: T) => string
}

export function useCrudDialogs<T extends { id: string }>(config: CrudConfig<T>) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const editDialog = useEntityDialog<T>(config.items)
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const deleteDialog = useEntityDialog<T>(config.items)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function submitCreate(body: unknown): Promise<boolean> {
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch(config.createUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setCreateLoading(false)
    if (res.status === 201) {
      setCreateOpen(false)
      router.refresh()
      return true
    }
    const data = await res.json().catch(() => ({}))
    setCreateError(data.error ?? "Une erreur est survenue.")
    return false
  }

  async function submitEdit(body: unknown): Promise<boolean> {
    if (!editDialog.selected) return false
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(config.editUrl(editDialog.selected), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setEditLoading(false)
    if (res.ok) {
      editDialog.close()
      router.refresh()
      return true
    }
    const data = await res.json().catch(() => ({}))
    setEditError(data.error ?? "Une erreur est survenue.")
    return false
  }

  async function confirmDelete(): Promise<boolean> {
    if (!deleteDialog.selected) return false
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(config.deleteUrl(deleteDialog.selected), { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return true
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
    return false
  }

  return {
    createOpen,
    createError,
    createLoading,
    openCreate: () => { setCreateError(null); setCreateOpen(true) },
    closeCreate: () => setCreateOpen(false),
    submitCreate,

    editDialog,
    editError,
    editLoading,
    openEdit: (item: T) => { editDialog.open(item); setEditError(null) },
    closeEdit: editDialog.close,
    submitEdit,

    deleteDialog,
    deleteError,
    deleteLoading,
    openDelete: (item: T) => { deleteDialog.open(item); setDeleteError(null) },
    closeDelete: deleteDialog.close,
    confirmDelete,
  }
}
