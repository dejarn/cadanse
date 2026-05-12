"use client"

import { useState } from "react"
import Link from "next/link"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import CircularProgress from "@mui/material/CircularProgress"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import TuneIcon from "@mui/icons-material/Tune"
import ConfirmDialog from "@/components/ConfirmDialog"
import EntityRow from "@/components/EntityRow"
import FormDialog from "@/components/FormDialog"
import { useCrudDialogs } from "@/hooks/useCrudDialogs"

type Show = {
  id: string
  name: string
  date: Date
  seasonId: string
  _count: { acts: number }
}

type Props = {
  shows: Show[]
  seasonId: string
}

const emptyForm = { name: "", date: "" }

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("fr-FR", { dateStyle: "long" })
}

function toDateInput(date: Date) {
  return new Date(date).toISOString().slice(0, 10)
}

type FormState = typeof emptyForm

function ShowForm({ form, onChange }: { form: FormState; onChange: (f: FormState) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Nom du spectacle"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        required
        fullWidth
        size="small"
        autoFocus
      />
      <TextField
        label="Date"
        type="date"
        value={form.date}
        onChange={(e) => onChange({ ...form, date: e.target.value })}
        required
        fullWidth
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  )
}

export default function ShowsClient({ shows, seasonId }: Props) {
  const crud = useCrudDialogs<Show>({
    items: shows,
    createUrl: "/api/shows",
    editUrl: (s) => `/api/shows/${s.id}`,
    deleteUrl: (s) => `/api/shows/${s.id}`,
  })

  const [createForm, setCreateForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [duplicateLoadingId, setDuplicateLoadingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const ok = await crud.submitCreate({ ...createForm, seasonId })
    if (ok) setCreateForm(emptyForm)
  }

  function openEdit(show: Show) {
    crud.openEdit(show)
    setEditForm({ name: show.name, date: toDateInput(show.date) })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    await crud.submitEdit(editForm)
  }

  async function handleDuplicate(show: Show) {
    setDuplicateLoadingId(show.id)
    await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: show.name + " - Copie", date: show.date, seasonId }),
    })
    setDuplicateLoadingId(null)
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Spectacles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shows.length} spectacle{shows.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateForm(emptyForm)
              crud.openCreate()
            }}
          >
            Ajouter un spectacle
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {shows.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun spectacle pour cette saison.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {shows.map((show) => (
            <EntityRow
              key={show.id}
              actions={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Button
                    component={Link}
                    href={`/shows/${show.id}/order`}
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon fontSize="small" />}
                    sx={{ fontSize: "0.75rem", py: 0.5 }}
                  >
                    Organiser
                  </Button>
                  <Tooltip title="Dupliquer">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicate(show)}
                        disabled={duplicateLoadingId === show.id}
                      >
                        {duplicateLoadingId === show.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ContentCopyIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => openEdit(show)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton size="small" onClick={() => crud.openDelete(show)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <Box>
                <Typography variant="body1">{show.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(show.date)} · {show._count.acts} tableau{show._count.acts !== 1 ? "x" : ""}
                </Typography>
              </Box>
            </EntityRow>
          ))}
        </Box>
      )}

      <FormDialog
        open={crud.createOpen}
        title="Nouveau spectacle"
        submitLabel="Créer"
        loading={crud.createLoading}
        error={crud.createError}
        onClose={crud.closeCreate}
        onSubmit={handleCreate}
      >
        <ShowForm form={createForm} onChange={setCreateForm} />
      </FormDialog>

      <FormDialog
        open={!!crud.editDialog.selected}
        title="Modifier le spectacle"
        submitLabel="Enregistrer"
        loading={crud.editLoading}
        error={crud.editError}
        onClose={crud.closeEdit}
        onSubmit={handleEdit}
      >
        <ShowForm form={editForm} onChange={setEditForm} />
      </FormDialog>

      <ConfirmDialog
        open={!!crud.deleteDialog.selected}
        title="Supprimer le spectacle"
        message={
          <>
            Supprimer le spectacle «&nbsp;{crud.deleteDialog.displaySelected?.name}&nbsp;» ?
            {crud.deleteDialog.displaySelected && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {formatDate(crud.deleteDialog.displaySelected.date)}
              </Typography>
            )}
          </>
        }
        confirmLabel="Supprimer"
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onClose={crud.closeDelete}
      />
    </>
  )
}
