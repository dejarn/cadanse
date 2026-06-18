"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useTheme } from "@mui/material/styles"
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
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import AddIcon from "@mui/icons-material/Add"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import PlaceIcon from "@mui/icons-material/Place"
import GroupIcon from "@mui/icons-material/Group"
import LiveTvIcon from "@mui/icons-material/LiveTv"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import ConfirmDialog from "@/components/ConfirmDialog"
import DurationStepper from "@/components/DurationStepper"
import EntityRow from "@/components/EntityRow"
import FormDialog from "@/components/FormDialog"
import SortableActRow from "./SortableActRow"
import { useCrudDialogs } from "@/hooks/useCrudDialogs"
import { applyDragWithLocks } from "@/lib/drag-with-locks"
import { findConflicts, type Conflict, type ParticipantMap } from "@/lib/ordering"
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
  participants: Record<string, string[]>
  studentNames: Record<string, string>
}

const emptyForm = { name: "", classId: "", durationMin: "", durationSec: "", description: "" }

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
      <TextField
        label="Description"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        helperText="Affichée sur la page publique du spectacle."
        fullWidth
        size="small"
        multiline
        minRows={2}
      />
    </Box>
  )
}

function parseDuration(form: ActFormState) {
  const min = parseInt(form.durationMin || "0", 10)
  const sec = parseInt(form.durationSec || "0", 10)
  return (min || sec) ? min * 60 + sec : null
}

export default function OrderClient({ show, classes, participants, studentNames }: Props) {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

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

  // ---- Move-to-position dialog ----
  const [moveActId, setMoveActId] = useState<string | null>(null)
  const [moveValue, setMoveValue] = useState("")

  // ---- Conflicts detail dialog ----
  const [conflictsOpen, setConflictsOpen] = useState(false)

  // ---- Warn on unsaved navigation when in edit mode ----
  useEffect(() => {
    if (!editMode) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [editMode])

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

  const participantMap = useMemo<ParticipantMap>(() => {
    const map: ParticipantMap = {}
    for (const [actId, ids] of Object.entries(participants)) map[actId] = new Set(ids)
    return map
  }, [participants])

  // Live conflicts in edit mode (recomputed on every drag / move / generate)
  const editConflicts = useMemo(
    () => findConflicts(localOrder, participantMap),
    [localOrder, participantMap],
  )
  // Conflicts of the saved order, shown in read view
  const viewConflicts = useMemo(
    () => findConflicts(viewOrder.map((a) => a.id), participantMap),
    [viewOrder, participantMap],
  )
  const conflicts = editMode ? editConflicts : viewConflicts
  const conflictOrder = editMode ? localOrder : viewOrder.map((a) => a.id)

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
      description: act.description ?? "",
    })
  }

  async function handleEdit() {
    await crud.submitEdit({ name: editForm.name, classId: editForm.classId || null, duration: parseDuration(editForm), description: editForm.description })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const ok = await crud.submitCreate({
      name: createForm.name,
      classId: createForm.classId || null,
      duration: parseDuration(createForm),
      description: createForm.description,
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

  function openMove(actId: string) {
    setMoveActId(actId)
    setMoveValue(String(localOrder.indexOf(actId) + 1))
  }

  function handleMove(e: React.FormEvent) {
    e.preventDefault()
    if (!moveActId) return
    const target = parseInt(moveValue, 10)
    const actId = moveActId
    setMoveActId(null)
    if (Number.isNaN(target)) return
    setLocalOrder((prev) => {
      const clamped = Math.min(Math.max(target, 1), prev.length)
      const overId = prev[clamped - 1]
      if (!overId) return prev
      return applyDragWithLocks(prev, actId, overId, lockedIds)
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

  function conflictChip(count: number, withSuccess: boolean) {
    if (count === 0) {
      if (!withSuccess) return null
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Aucun conflit"
          size="small"
          variant="outlined"
          sx={{ height: 24, borderColor: "success.main", color: "success.main" }}
        />
      )
    }
    return (
      <Tooltip title="Voir le détail des conflits">
        <Chip
          icon={<WarningAmberIcon />}
          label={`${count} conflit${count > 1 ? "s" : ""}`}
          size="small"
          variant="outlined"
          onClick={() => setConflictsOpen(true)}
          sx={{ height: 24, borderColor: "warning.main", color: "warning.main", cursor: "pointer" }}
        />
      </Tooltip>
    )
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
          {(editMode || viewConflicts.length > 0) && (
            <Box sx={{ mt: 1 }}>
              {editMode
                ? conflictChip(editConflicts.length, true)
                : conflictChip(viewConflicts.length, false)}
            </Box>
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

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "flex-end", mb: 3 }}>
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
                    onRequestMove={openMove}
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
                  {!isMobile && (
                    <Tooltip title="Placements">
                      <IconButton size="small" component={Link} href={`/shows/${show.id}/acts/${act.id}/placements`}>
                        <PlaceIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
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

      <FormDialog
        open={!!moveActId}
        title="Déplacer le tableau"
        submitLabel="Déplacer"
        onClose={() => setMoveActId(null)}
        onSubmit={handleMove}
      >
        <TextField
          label="Nouvelle position"
          type="number"
          value={moveValue}
          onChange={(e) => setMoveValue(e.target.value)}
          slotProps={{ htmlInput: { min: 1, max: localOrder.length } }}
          helperText={`Entre 1 et ${localOrder.length}`}
          autoFocus
          fullWidth
          size="small"
        />
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

      <Dialog open={conflictsOpen} onClose={() => setConflictsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon sx={{ color: "warning.main" }} fontSize="small" />
          {conflicts.length} conflit{conflicts.length > 1 ? "s" : ""}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ces élèves enchaînent deux tableaux consécutifs.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {conflicts.map((c: Conflict) => {
              const nameA = actMap.get(conflictOrder[c.aIndex])?.name ?? "?"
              const nameB = actMap.get(conflictOrder[c.bIndex])?.name ?? "?"
              return (
                <Box key={`${c.aIndex}-${c.bIndex}`}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Tableau {c.aIndex + 1} · {nameA} ↔ Tableau {c.bIndex + 1} · {nameB}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.shared.map((id) => studentNames[id] ?? id).join(", ")}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictsOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
