"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import GroupIcon from "@mui/icons-material/Group"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"
import { useEntityDialog } from "@/hooks/useEntityDialog"
import type { Act, ActPosition, Class, Show, Teacher } from "@prisma/client"

type ShowWithActs = Show & {
  acts: (Act & { class: Class & { teacher: Teacher } })[]
  actPositions: ActPosition[]
}

interface Props {
  show: ShowWithActs
  classes: Class[]
}

const emptyForm = { name: "", classId: "" }

export default function OrderClient({ show, classes }: Props) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const deleteDialog = useEntityDialog(show.acts)

  function openDelete(act: Act & { class: Class & { teacher: Teacher } }) {
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

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Ordre de passage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {show.name} · {show.acts.length} tableau{show.acts.length !== 1 ? "x" : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/shows/${show.id}/participants`}
            size="small"
            variant="outlined"
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
            Ajouter un tableau
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {show.acts.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun tableau pour ce spectacle.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {show.acts.map((act) => (
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
              <Box>
                <Typography variant="body1">{act.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {act.class.name} · {act.class.schedule} · {act.class.teacher.firstName} {act.class.teacher.lastName}
                </Typography>
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
