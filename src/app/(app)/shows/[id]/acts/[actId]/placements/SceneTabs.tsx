"use client"

import { useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import TextField from "@mui/material/TextField"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"

type Scene = { id: string; name: string; order: number }

interface Props {
  scenes: Scene[]
  activeSceneId: string | null
  onSceneChange: (sceneId: string) => void
  onAddScene: () => void
  onDeleteScene: (sceneId: string) => void
  onRenameScene: (sceneId: string, name: string) => void
}

export default function SceneTabs({
  scenes,
  activeSceneId,
  onSceneChange,
  onAddScene,
  onDeleteScene,
  onRenameScene,
}: Props) {
  const [renameTarget, setRenameTarget] = useState<Scene | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Scene | null>(null)

  const handleTabChange = (_: React.SyntheticEvent, value: string) => {
    onSceneChange(value)
  }

  const openRename = (scene: Scene) => {
    setRenameTarget(scene)
    setRenameValue(scene.name)
  }

  const submitRename = () => {
    if (renameTarget && renameValue.trim()) {
      onRenameScene(renameTarget.id, renameValue.trim())
    }
    setRenameTarget(null)
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
        <Tabs
          value={activeSceneId ?? false}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 36, flex: 1, minWidth: 0 }}
        >
          {scenes.map((scene) => (
            <Tab
              key={scene.id}
              value={scene.id}
              label={scene.name}
              sx={{ minHeight: 36, py: 0, textTransform: "none" }}
              icon={
                <Box sx={{ display: "flex", gap: 0.25, ml: "auto" }}>
                  <Tooltip title="Renommer">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        openRename(scene)
                      }}
                      sx={{ p: 0.25 }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(scene)
                      }}
                      sx={{ p: 0.25 }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              iconPosition="end"
            />
          ))}
        </Tabs>
        <Tooltip title="Nouvelle scène">
          <IconButton size="small" onClick={onAddScene}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <FormDialog
        open={!!renameTarget}
        title="Renommer la scène"
        submitLabel="Enregistrer"
        onClose={() => setRenameTarget(null)}
        onSubmit={submitRename}
      >
        <TextField
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitRename()}
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
              Les placements de cette scène seront perdus.
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
