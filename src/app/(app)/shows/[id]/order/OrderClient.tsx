"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  type SortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import AddIcon from "@mui/icons-material/Add"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"
import DeleteIcon from "@mui/icons-material/Delete"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import EditIcon from "@mui/icons-material/Edit"
import GroupIcon from "@mui/icons-material/Group"
import LiveTvIcon from "@mui/icons-material/LiveTv"
import LockIcon from "@mui/icons-material/Lock"
import LockOpenIcon from "@mui/icons-material/LockOpen"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"
import { useEntityDialog } from "@/hooks/useEntityDialog"
import type { Act, ActPosition, Class, Show, Teacher } from "@prisma/client"

type ActWithClass = Act & { class: Class & { teacher: Teacher } }

type ShowWithActs = Show & {
  acts: ActWithClass[]
  actPositions: ActPosition[]
}

interface Props {
  show: ShowWithActs
  classes: Class[]
}

const emptyForm = { name: "", classId: "" }

// Locked acts stay at their indices; unlocked acts flow around them.
function applyDragWithLocks(
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

function SortableActRow({
  act,
  position,
  isLocked,
  onToggleLock,
}: {
  act: ActWithClass
  position: number
  isLocked: boolean
  onToggleLock: (actId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: act.id,
    disabled: isLocked,
    animateLayoutChanges: () => false,
  })

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderRadius: 1,
        opacity: isDragging ? 0.4 : 1,
        transform: isLocked ? undefined : CSS.Transform.toString(transform),
        transition: isLocked ? undefined : transition,
        bgcolor: isDragging ? "rgba(212,168,83,0.08)" : "transparent",
        "&:hover": { bgcolor: isLocked ? "transparent" : "rgba(212,168,83,0.05)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={isLocked ? "Déverrouiller la position" : "Verrouiller la position"}>
          <IconButton
            size="small"
            onClick={() => onToggleLock(act.id)}
            sx={{
              color: isLocked ? "primary.main" : "text.disabled",
              "&:hover": { color: isLocked ? "primary.light" : "text.secondary" },
            }}
          >
            {isLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: "right" }}>
          {position}.
        </Typography>
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: "flex",
            color: isLocked ? "text.disabled" : "text.secondary",
            cursor: isLocked ? "not-allowed" : "grab",
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="body1">{act.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {act.class.name} · {act.class.schedule} · {act.class.teacher.firstName} {act.class.teacher.lastName}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default function OrderClient({ show, classes }: Props) {
  const router = useRouter()

  // ---- Create act ----
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  // ---- Delete act ----
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const deleteDialog = useEntityDialog(show.acts)

  // ---- Order mode ----
  const [editMode, setEditMode] = useState(false)
  const [localOrder, setLocalOrder] = useState<string[]>([])
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ---- Derived ----
  const actMap = useMemo(() => new Map(show.acts.map((a) => [a.id, a])), [show.acts])

  const viewOrder = useMemo(() => {
    if (show.actPositions.length === 0) return show.acts
    const posMap = new Map(show.actPositions.map((p) => [p.actId, p.position]))
    return [...show.acts].sort((a, b) => (posMap.get(a.id) ?? Infinity) - (posMap.get(b.id) ?? Infinity))
  }, [show.acts, show.actPositions])

  const sensors = useSensors(useSensor(PointerSensor))

  const lockedSortingStrategy = useMemo<SortingStrategy>(
    () =>
      ({ activeIndex, overIndex, index, rects }) => {
        if (index === activeIndex) return null

        const activeId = localOrder[activeIndex]
        const overId = localOrder[overIndex]
        if (!activeId || !overId) return { x: 0, y: 0, scaleX: 1, scaleY: 1 }

        const finalOrder = applyDragWithLocks(localOrder, activeId, overId, lockedIds)
        const finalPos = finalOrder.indexOf(localOrder[index])

        if (finalPos === index) return { x: 0, y: 0, scaleX: 1, scaleY: 1 }

        let y = 0
        if (finalPos > index) {
          for (let i = index + 1; i <= finalPos; i++) y += rects[i]?.height ?? 0
        } else {
          for (let i = finalPos; i < index; i++) y -= rects[i]?.height ?? 0
        }

        return { x: 0, y, scaleX: 1, scaleY: 1 }
      },
    [localOrder, lockedIds],
  )

  // ---- Handlers ----
  function openDelete(act: ActWithClass) {
    deleteDialog.open(act)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteDialog.selected) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/shows/${show.id}/acts/${deleteDialog.selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch(`/api/shows/${show.id}/acts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    setCreateLoading(false)
    if (res.status === 201) {
      setCreateOpen(false)
      setCreateForm(emptyForm)
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setCreateError(data.error ?? "Une erreur est survenue.")
  }

  function handleEnterEdit() {
    const ordered = viewOrder.map((a) => a.id)
    setLocalOrder(ordered)
    setLockedIds(new Set(show.acts.filter((a) => a.fixedPosition != null).map((a) => a.id)))
    setGenerateError(null)
    setSaveError(null)
    setEditMode(true)
  }

  function handleCancelEdit() {
    setEditMode(false)
    setGenerateError(null)
    setSaveError(null)
  }

  function toggleLock(actId: string) {
    setLockedIds((prev) => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLocalOrder((prev) =>
      applyDragWithLocks(prev, active.id as string, over.id as string, lockedIds)
    )
  }

  async function handleGenerate() {
    setGenerateError(null)
    setGenerateLoading(true)
    const actConfigs = localOrder.map((actId, index) => ({
      actId,
      fixedPosition: lockedIds.has(actId) ? index : undefined,
    }))
    const res = await fetch(`/api/shows/${show.id}/order/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actConfigs }),
    })
    setGenerateLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setGenerateError(data.error ?? "Une erreur est survenue.")
      return
    }
    const { data } = (await res.json()) as { data: { actId: string; position: number }[] }
    setLocalOrder([...data].sort((a, b) => a.position - b.position).map((p) => p.actId))
  }

  async function handleSave() {
    setSaveError(null)
    setSaveLoading(true)

    const patches = localOrder
      .map((actId, index) => {
        const act = actMap.get(actId)!
        const newFP = lockedIds.has(actId) ? index : null
        const fpChanged = act.fixedPosition !== newFP
        if (!fpChanged) return null
        const data: Record<string, unknown> = {}
        data.fixedPosition = newFP
        return fetch(`/api/shows/${show.id}/acts/${actId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      })
      .filter(Boolean) as Promise<Response>[]

    const orderFetch = fetch(`/api/shows/${show.id}/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions: localOrder.map((actId, i) => ({ actId, position: i })) }),
    })

    let results: Response[]
    try {
      results = await Promise.all([...patches, orderFetch])
    } catch {
      setSaveError("Une erreur est survenue.")
      setSaveLoading(false)
      return
    }

    const failed = results.find((r) => !r.ok)
    if (failed) {
      const data = await failed.json().catch(() => ({}))
      setSaveError(data.error ?? "Une erreur est survenue.")
      setSaveLoading(false)
      return
    }

    setSaveLoading(false)
    setEditMode(false)
    router.refresh()
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1, gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Ordre de passage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {show.name} · {show.acts.length} tableau{show.acts.length !== 1 ? "x" : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button
            component={Link}
            href="/shows"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
          >
            Retour
          </Button>
          <Button
            component={Link}
            href={`/shows/${show.id}/live`}
            variant="outlined"
            size="small"
            startIcon={<LiveTvIcon />}
          >
            Live
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mb: 3 }}>
        {editMode ? (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={generateLoading ? <CircularProgress size={14} /> : <AutoFixHighIcon />}
              onClick={handleGenerate}
              disabled={generateLoading || saveLoading}
            >
              Générer
            </Button>
            <Button variant="outlined" size="small" onClick={handleCancelEdit} disabled={saveLoading}>
              Annuler
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={saveLoading}
              startIcon={saveLoading ? <CircularProgress size={14} /> : undefined}
            >
              Valider
            </Button>
          </>
        ) : (
          <>
            <Button
              component={Link}
              href={`/shows/${show.id}/participants`}
              variant="outlined"
              size="small"
              startIcon={<GroupIcon />}
            >
              Participants
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreateForm(emptyForm)
                setCreateError(null)
                setCreateOpen(true)
              }}
            >
              Ajouter
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEnterEdit}
              disabled={show.acts.length === 0}
            >
              Modifier l&apos;ordre
            </Button>
          </>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {generateError && <Alert severity="error" sx={{ mb: 2 }}>{generateError}</Alert>}
      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}

      {show.acts.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun tableau pour ce spectacle.
          </Typography>
        </Box>
      ) : editMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localOrder} strategy={lockedSortingStrategy}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {localOrder.map((actId, index) => {
                const act = actMap.get(actId)
                if (!act) return null
                return (
                  <SortableActRow
                    key={actId}
                    act={act}
                    position={index + 1}
                    isLocked={lockedIds.has(actId)}
                    onToggleLock={toggleLock}
                  />
                )
              })}
            </Box>
          </SortableContext>
        </DndContext>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {viewOrder.map((act, index) => (
            <Box
              key={act.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(212,168,83,0.05)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {show.actPositions.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: "right" }}>
                    {index + 1}.
                  </Typography>
                )}
                <Box>
                  <Typography variant="body1">{act.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {act.class.name} · {act.class.schedule} · {act.class.teacher.firstName}{" "}
                    {act.class.teacher.lastName}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Supprimer">
                  <IconButton size="small" onClick={() => openDelete(act)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <FormDialog
        open={createOpen}
        title="Nouveau tableau"
        submitLabel="Créer"
        loading={createLoading}
        error={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nom du tableau"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            required
            fullWidth
            size="small"
            autoFocus
          />
          <TextField
            select
            label="Cours"
            value={createForm.classId}
            onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
            required
            fullWidth
            size="small"
          >
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} · {c.schedule}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteDialog.selected}
        title="Supprimer le tableau"
        message={<>Supprimer le tableau «&nbsp;{deleteDialog.displaySelected?.name}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={deleteDialog.close}
      />
    </>
  )
}
