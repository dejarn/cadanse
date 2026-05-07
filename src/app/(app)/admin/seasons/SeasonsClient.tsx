"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import CircularProgress from "@mui/material/CircularProgress"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"
import { useEntityDialog } from "@/hooks/useEntityDialog"

type Season = {
  id: string
  label: string
  isActive: boolean
  createdAt: Date
}

type Props = { seasons: Season[] }

export default function SeasonsClient({ seasons }: Props) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [createLabel, setCreateLabel] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const [editLabel, setEditLabel] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [activatingId, setActivatingId] = useState<string | null>(null)
  const editDialog = useEntityDialog(seasons)
  const deleteDialog = useEntityDialog(seasons)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: createLabel }),
    })
    setCreateLoading(false)
    if (res.status === 201) {
      setCreateOpen(false)
      setCreateLabel("")
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setCreateError(data.error ?? "Une erreur est survenue.")
  }

  function openEdit(season: Season) {
    editDialog.open(season)
    setEditLabel(season.label)
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDialog.selected) return
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(`/api/seasons/${editDialog.selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel }),
    })
    setEditLoading(false)
    if (res.ok) {
      editDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setEditError(data.error ?? "Une erreur est survenue.")
  }

  function openDelete(season: Season) {
    deleteDialog.open(season)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteDialog.selected) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/seasons/${deleteDialog.selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
  }

  async function handleActivate(id: string) {
    setActivatingId(id)
    await fetch(`/api/seasons/${id}/activate`, { method: "POST" })
    setActivatingId(null)
    router.refresh()
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Saisons
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {seasons.length} saison{seasons.length > 1 ? "s" : ""}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateLabel("")
            setCreateError(null)
            setCreateOpen(true)
          }}
        >
          Ajouter une saison
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {seasons.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucune saison créée.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {seasons.map((season) => (
            <Box
              key={season.id}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: season.isActive ? 600 : 400 }}>
                  {season.label}
                </Typography>
                {season.isActive ? (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      bgcolor: "rgba(212,168,83,0.15)",
                      color: "primary.main",
                      border: "1px solid",
                      borderColor: "rgba(212,168,83,0.35)",
                    }}
                  />
                ) : null}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  {new Date(season.createdAt).toLocaleDateString("fr-FR")}
                </Typography>

                {!season.isActive ? (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={activatingId === season.id}
                    onClick={() => handleActivate(season.id)}
                    sx={{ fontSize: 11, py: 0.25, px: 1, minWidth: 0 }}
                  >
                    {activatingId === season.id ? <CircularProgress size={12} color="inherit" /> : "Activer"}
                  </Button>
                ) : null}

                <IconButton size="small" onClick={() => openEdit(season)}>
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton size="small" onClick={() => openDelete(season)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <FormDialog
        open={createOpen}
        title="Nouvelle saison"
        submitLabel="Créer"
        loading={createLoading}
        error={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <TextField
          label="Libellé"
          placeholder="2025-2026"
          value={createLabel}
          onChange={(e) => setCreateLabel(e.target.value)}
          required
          fullWidth
          size="small"
          autoFocus
        />
      </FormDialog>

      <FormDialog
        open={!!editDialog.selected}
        title="Renommer la saison"
        submitLabel="Enregistrer"
        loading={editLoading}
        error={editError}
        onClose={editDialog.close}
        onSubmit={handleEdit}
      >
        <TextField
          label="Libellé"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          required
          fullWidth
          size="small"
          autoFocus
        />
      </FormDialog>

      <ConfirmDialog
        open={!!deleteDialog.selected}
        title="Supprimer la saison"
        message={<>Supprimer la saison «&nbsp;{deleteDialog.displaySelected?.label}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={deleteDialog.close}
      />
    </>
  )
}
