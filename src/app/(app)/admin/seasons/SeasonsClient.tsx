"use client"

import { useState } from "react"
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
import EntityRow from "@/components/EntityRow"
import FormDialog from "@/components/FormDialog"
import { useCrudDialogs } from "@/hooks/useCrudDialogs"

type Season = {
  id: string
  label: string
  isActive: boolean
  createdAt: Date
}

type Props = { seasons: Season[] }

export default function SeasonsClient({ seasons }: Props) {
  const crud = useCrudDialogs<Season>({
    items: seasons,
    createUrl: "/api/seasons",
    editUrl: (s) => `/api/seasons/${s.id}`,
    deleteUrl: (s) => `/api/seasons/${s.id}`,
  })

  const [createLabel, setCreateLabel] = useState("")
  const [editLabel, setEditLabel] = useState("")
  const [activatingId, setActivatingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const ok = await crud.submitCreate({ label: createLabel })
    if (ok) setCreateLabel("")
  }

  function openEdit(season: Season) {
    crud.openEdit(season)
    setEditLabel(season.label)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    await crud.submitEdit({ label: editLabel })
  }

  async function handleActivate(id: string) {
    setActivatingId(id)
    await fetch(`/api/seasons/${id}/activate`, { method: "POST" })
    setActivatingId(null)
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Saisons
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {seasons.length} saison{seasons.length > 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateLabel("")
              crud.openCreate()
            }}
          >
            Ajouter une saison
          </Button>
        </Box>
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
            <EntityRow
              key={season.id}
              actions={
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

                  <IconButton size="small" onClick={() => crud.openDelete(season)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
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
            </EntityRow>
          ))}
        </Box>
      )}

      <FormDialog
        open={crud.createOpen}
        title="Nouvelle saison"
        submitLabel="Créer"
        loading={crud.createLoading}
        error={crud.createError}
        onClose={crud.closeCreate}
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
        open={!!crud.editDialog.selected}
        title="Renommer la saison"
        submitLabel="Enregistrer"
        loading={crud.editLoading}
        error={crud.editError}
        onClose={crud.closeEdit}
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
        open={!!crud.deleteDialog.selected}
        title="Supprimer la saison"
        message={<>Supprimer la saison «&nbsp;{crud.deleteDialog.displaySelected?.label}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onClose={crud.closeDelete}
      />
    </>
  )
}
