"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import FormDialog from "@/components/FormDialog"
import { useEntityDialog } from "@/hooks/useEntityDialog"

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

export default function ShowsClient({ shows, seasonId }: Props) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const [editForm, setEditForm] = useState(emptyForm)
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [duplicateLoadingId, setDuplicateLoadingId] = useState<string | null>(null)

  const editDialog = useEntityDialog(shows)
  const deleteDialog = useEntityDialog(shows)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, seasonId }),
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

  function openEdit(show: Show) {
    editDialog.open(show)
    setEditForm({ name: show.name, date: toDateInput(show.date) })
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDialog.selected) return
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(`/api/shows/${editDialog.selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
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

  function openDelete(show: Show) {
    deleteDialog.open(show)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteDialog.selected) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/shows/${deleteDialog.selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
  }

  async function handleDuplicate(show: Show) {
    setDuplicateLoadingId(show.id)
    await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: show.name + " - Copie", date: show.date, seasonId }),
    })
    setDuplicateLoadingId(null)
    router.refresh()
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Spectacles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shows.length} spectacle{shows.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
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
          Ajouter un spectacle
        </Button>
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
            <Box
              key={show.id}
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
                <Typography variant="body1">{show.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(show.date)} · {show._count.acts} tableau{show._count.acts !== 1 ? "x" : ""}
                </Typography>
              </Box>

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
                  <IconButton size="small" onClick={() => openDelete(show)}>
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
        title="Nouveau spectacle"
        submitLabel="Créer"
        loading={createLoading}
        error={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <ShowForm form={createForm} onChange={setCreateForm} />
      </FormDialog>

      <FormDialog
        open={!!editDialog.selected}
        title="Modifier le spectacle"
        submitLabel="Enregistrer"
        loading={editLoading}
        error={editError}
        onClose={editDialog.close}
        onSubmit={handleEdit}
      >
        <ShowForm form={editForm} onChange={setEditForm} />
      </FormDialog>

      <ConfirmDialog
        open={!!deleteDialog.selected}
        title="Supprimer le spectacle"
        message={
          <>
            Supprimer le spectacle «&nbsp;{deleteDialog.displaySelected?.name}&nbsp;» ?
            {deleteDialog.displaySelected && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {formatDate(deleteDialog.displaySelected.date)}
              </Typography>
            )}
          </>
        }
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={deleteDialog.close}
      />
    </>
  )
}

type FormState = { name: string; date: string }

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
