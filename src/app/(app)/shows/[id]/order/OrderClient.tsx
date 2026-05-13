"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, type SortingStrategy } from "@dnd-kit/sortable"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
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
import EditIcon from "@mui/icons-material/Edit"
import GroupIcon from "@mui/icons-material/Group"
import LiveTvIcon from "@mui/icons-material/LiveTv"
import ConfirmDialog from "@/components/ConfirmDialog"
import DurationStepper from "@/components/DurationStepper"
import EntityRow from "@/components/EntityRow"
import FormDialog from "@/components/FormDialog"
import SortableActRow from "./SortableActRow"
import { useCrudDialogs } from "@/hooks/useCrudDialogs"
import { applyDragWithLocks } from "@/lib/drag-with-locks"
import { teacherName } from "@/lib/teacherName"
import type { Act, ActPosition, Class, Show, Teacher } from "@prisma/client"

type ActWithClass = Act & { class: (Class & { teacher: Teacher }) | null }

type ShowWithActs = Show & {
  acts: ActWithClass[]
  actPositions: ActPosition[]
}

interface Props {
  show: ShowWithActs
  classes: Class[]
}

const emptyForm = { name: "", classId: "", durationMin: "", durationSec: "" }

type ActFormState = typeof emptyForm

function ActFormFields({
  form,
  onChange,
  classes,
}: {
  form: ActFormState
  onChange: (f: ActFormState) => void
  classes: { id: string; name: string; schedule: string }[]
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Nom du tableau"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        required
        fullWidth
        size="small"
        autoFocus
      />
      <TextField
        select
        label="Cours"
        value={form.classId}
        onChange={(e) => onChange({ ...form, classId: e.target.value })}
        fullWidth
        size="small"
      >
        <MenuItem value="">Sans cours</MenuItem>
        {classes.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name} · {c.schedule}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 1 }}>
        <DurationStepper
          value={form.durationMin}
          onChange={(v) => onChange({ ...form, durationMin: v })}
          label="min"
        />
        <Typography color="text.secondary" sx={{ fontSize: "1.75rem", fontWeight: 300, lineHeight: 1, pb: 3 }}>
          :
        </Typography>
        <DurationStepper
          value={form.durationSec}
          onChange={(v) => onChange({ ...form, durationSec: v })}
          label="sec"
          max={59}
        />
      </Box>
    </Box>
  )
}

function parseDuration(form: ActFormState) {
  const min = parseInt(form.durationMin || "0", 10)
  const sec = parseInt(form.durationSec || "0", 10)
  return (min || sec) ? min * 60 + sec : null
}

export default function OrderClient({ show, classes }: Props) {
  const crud = useCrudDialogs<ActWithClass>({
    items: show.acts,
    createUrl: `/api/shows/${show.id}/acts`,
    editUrl: (act) => `/api/shows/${show.id}/acts/${act.id}`,
    deleteUrl: (act) => `/api/shows/${show.id}/acts/${act.id}`,
  })

  const [createForm, setCreateForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

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

  const durationStats = useMemo(() => {
    const total = show.acts.reduce((sum, a) => sum + (a.duration ?? 0), 0)
    const missing = show.acts.filter((a) => a.duration == null).length
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const formatted = h > 0
      ? `${h}h${String(m).padStart(2, "0")}min`
      : `${m}min${s > 0 ? ` ${String(s).padStart(2, "0")}s` : ""}`
    return { total, missing, formatted }
  }, [show.acts])

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
  function openEdit(act: ActWithClass) {
    crud.openEdit(act)
    setEditForm({
      name: act.name,
      classId: act.classId ?? "",
      durationMin: act.duration != null ? String(Math.floor(act.duration / 60)) : "",
      durationSec: act.duration != null ? String(act.duration % 60) : "",
    })
  }

  async function handleEdit() {
    await crud.submitEdit({ name: editForm.name, classId: editForm.classId || null, duration: parseDuration(editForm) })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const ok = await crud.submitCreate({
      name: createForm.name,
      classId: createForm.classId || null,
      duration: parseDuration(createForm),
    })
    if (ok) setCreateForm(emptyForm)
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
          {show.acts.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {durationStats.total > 0 ? durationStats.formatted : "0min"}
              {durationStats.missing > 0 && ` · ${durationStats.missing} sans durée`}
            </Typography>
          )}
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
                crud.openCreate()
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
            <EntityRow
              key={act.id}
              actions={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {act.duration != null && (
                    <Chip
                      label={`${Math.floor(act.duration / 60)}:${String(act.duration % 60).padStart(2, "0")}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: "rgba(212,168,83,0.35)",
                        color: "primary.main",
                        fontSize: "0.7rem",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "0.06em",
                        height: 22,
                      }}
                    />
                  )}
                  <Tooltip title="Participants">
                    <IconButton size="small" component={Link} href={`/shows/${show.id}/acts/${act.id}/participants`}>
                      <GroupIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => openEdit(act)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton size="small" onClick={() => crud.openDelete(act)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
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
                    {act.class ? `${act.class.name} · ${act.class.schedule} · ${teacherName(act.class.teacher)}` : null}
                  </Typography>
                </Box>
              </Box>
            </EntityRow>
          ))}
        </Box>
      )}

      <FormDialog
        open={crud.createOpen}
        title="Nouveau tableau"
        submitLabel="Créer"
        loading={crud.createLoading}
        error={crud.createError}
        onClose={crud.closeCreate}
        onSubmit={handleCreate}
      >
        <ActFormFields form={createForm} onChange={setCreateForm} classes={classes} />
      </FormDialog>

      <FormDialog
        open={!!crud.editDialog.selected}
        title="Modifier le tableau"
        submitLabel="Enregistrer"
        loading={crud.editLoading}
        error={crud.editError}
        onClose={crud.closeEdit}
        onSubmit={handleEdit}
      >
        <ActFormFields form={editForm} onChange={setEditForm} classes={classes} />
      </FormDialog>

      <ConfirmDialog
        open={!!crud.deleteDialog.selected}
        title="Supprimer le tableau"
        message={<>Supprimer le tableau «&nbsp;{crud.deleteDialog.displaySelected?.name}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onClose={crud.closeDelete}
      />
    </>
  )
}
