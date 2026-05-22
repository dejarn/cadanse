"use client"

import { useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import AddIcon from "@mui/icons-material/Add"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"
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
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Scene = { id: string; name: string; order: number }

interface Props {
  scenes: Scene[]
  activeSceneId: string | null
  dirtySceneIds?: Set<string>
  onSceneChange: (sceneId: string) => void
  onAddScene: () => void
  onDeleteScene: (sceneId: string) => void
  onRenameScene: (sceneId: string, name: string) => void
  onDuplicateScene: (sceneId: string) => void
  onReorderScenes: (ids: string[]) => void
}

function SortableSceneTab({
  scene,
  isActive,
  onSceneChange,
  onRename,
  onDelete,
}: {
  scene: Scene
  isActive: boolean
  onSceneChange: (id: string) => void
  onRename: (scene: Scene) => void
  onDelete: (scene: Scene) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
    animateLayoutChanges: () => false,
  })

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        px: 1,
        minHeight: 36,
        flexShrink: 0,
        userSelect: "none",
        borderBottom: isActive ? "2px solid" : "2px solid transparent",
        borderColor: isActive ? "primary.main" : "transparent",
        color: isActive ? "primary.main" : "text.primary",
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        bgcolor: isDragging ? "rgba(212,168,83,0.06)" : "transparent",
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: "flex",
          alignItems: "center",
          color: "text.disabled",
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 14 }} />
      </Box>

      {/* Scene name — click to select */}
      <Box
        component="span"
        onClick={() => onSceneChange(scene.id)}
        sx={{ cursor: "pointer", fontSize: "0.875rem", px: 0.5 }}
      >
        {scene.name}
      </Box>

      {/* Actions */}
      <Box component="span" sx={{ display: "inline-flex", gap: 0.25, ml: 0.25 }}>
        <Tooltip title="Renommer">
          <Box
            component="span"
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onRename(scene) }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onRename(scene) }
            }}
            sx={{ display: "inline-flex", p: 0.25, cursor: "pointer", borderRadius: 1 }}
          >
            <EditIcon sx={{ fontSize: 14 }} />
          </Box>
        </Tooltip>
        <Tooltip title="Supprimer">
          <Box
            component="span"
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onDelete(scene) }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onDelete(scene) }
            }}
            sx={{ display: "inline-flex", p: 0.25, cursor: "pointer", borderRadius: 1 }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default function SceneTabs({
  scenes,
  activeSceneId,
  dirtySceneIds,
  onSceneChange,
  onAddScene,
  onDeleteScene,
  onRenameScene,
  onDuplicateScene,
  onReorderScenes,
}: Props) {
  const [renameTarget, setRenameTarget] = useState<Scene | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Scene | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const openRename = (scene: Scene) => {
    setRenameTarget(scene)
    setRenameValue(scene.name)
    setRenameError(null)
  }

  const submitRename = () => {
    if (!renameValue.trim()) {
      setRenameError("Le nom ne peut pas être vide.")
      return
    }
    if (renameTarget) {
      onRenameScene(renameTarget.id, renameValue.trim())
    }
    setRenameTarget(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = scenes.map((s) => s.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    onReorderScenes(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, flex: 1, minWidth: 0 }}>
        <DndContext id="scene-tabs-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            <Box
              sx={{
                display: "flex",
                overflowX: "auto",
                flex: 1,
                minWidth: 0,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {scenes.map((scene) => (
                <SortableSceneTab
                  key={scene.id}
                  scene={scene}
                  isActive={scene.id === activeSceneId}
                  onSceneChange={onSceneChange}
                  onRename={openRename}
                  onDelete={setDeleteTarget}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>

        <Tooltip title="Nouvelle scène">
          <IconButton size="small" onClick={onAddScene} aria-label="Ajouter une scène">
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Dupliquer la scène">
          <span>
            <IconButton
              size="small"
              disabled={!activeSceneId}
              onClick={() => activeSceneId && onDuplicateScene(activeSceneId)}
              aria-label="Dupliquer la scène"
            >
              <ContentCopyIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <FormDialog
        open={!!renameTarget}
        title="Renommer la scène"
        submitLabel="Enregistrer"
        error={renameError}
        onClose={() => { setRenameTarget(null); setRenameError(null) }}
        onSubmit={submitRename}
      >
        <TextField
          autoFocus
          value={renameValue}
          onChange={(e) => { setRenameValue(e.target.value); setRenameError(null) }}
          fullWidth
          size="small"
          sx={{ pt: 1 }}
        />
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la scène"
        message={
          <>
            <Typography variant="body2">
              Supprimer la scène « {deleteTarget?.name} » ?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Les placements de cette scène seront perdus
              {deleteTarget && dirtySceneIds?.has(deleteTarget.id) ? ", dont des modifications non sauvegardées" : ""}.
            </Typography>
          </>
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (deleteTarget) onDeleteScene(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
