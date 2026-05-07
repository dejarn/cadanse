"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"
import { useEntityDialog } from "@/hooks/useEntityDialog"

type Teacher = { id: string; firstName: string; lastName: string }

type Class = {
  id: string
  name: string
  schedule: string
  teacherId: string
  teacher: Teacher
  createdAt: Date
}

type Props = {
  classes: Class[]
  teachers: Teacher[]
  seasonId: string
}

const emptyForm = { name: "", schedule: "", teacherId: "" }

export default function ClassesClient({ classes, teachers, seasonId }: Props) {
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

  const editDialog = useEntityDialog(classes)
  const deleteDialog = useEntityDialog(classes)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch("/api/classes", {
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

  function openEdit(cls: Class) {
    editDialog.open(cls)
    setEditForm({ name: cls.name, schedule: cls.schedule, teacherId: cls.teacherId })
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDialog.selected) return
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(`/api/classes/${editDialog.selected.id}`, {
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

  function openDelete(cls: Class) {
    deleteDialog.open(cls)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteDialog.selected) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/classes/${deleteDialog.selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Cours
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {classes.length} cours
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          disabled={teachers.length === 0}
          onClick={() => {
            setCreateForm(emptyForm)
            setCreateError(null)
            setCreateOpen(true)
          }}
        >
          Ajouter un cours
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {classes.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun cours pour cette saison.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {classes.map((cls) => (
            <Box
              key={cls.id}
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
                <Typography variant="body1">{cls.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {cls.schedule} · {cls.teacher.firstName} {cls.teacher.lastName}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="small" onClick={() => openEdit(cls)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => openDelete(cls)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <FormDialog
        open={createOpen}
        title="Nouveau cours"
        submitLabel="Créer"
        loading={createLoading}
        error={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <ClassForm form={createForm} onChange={setCreateForm} teachers={teachers} />
      </FormDialog>

      <FormDialog
        open={!!editDialog.selected}
        title="Modifier le cours"
        submitLabel="Enregistrer"
        loading={editLoading}
        error={editError}
        onClose={editDialog.close}
        onSubmit={handleEdit}
      >
        <ClassForm form={editForm} onChange={setEditForm} teachers={teachers} />
      </FormDialog>

      <ConfirmDialog
        open={!!deleteDialog.selected}
        title="Supprimer le cours"
        message={<>Supprimer le cours «&nbsp;{deleteDialog.displaySelected?.name}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={deleteDialog.close}
      />
    </>
  )
}

type FormState = { name: string; schedule: string; teacherId: string }

function ClassForm({
  form,
  onChange,
  teachers,
}: {
  form: FormState
  onChange: (f: FormState) => void
  teachers: Teacher[]
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Nom du cours"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        required
        fullWidth
        size="small"
        autoFocus
      />
      <TextField
        label="Horaire"
        placeholder="Lundi 18h-19h"
        value={form.schedule}
        onChange={(e) => onChange({ ...form, schedule: e.target.value })}
        required
        fullWidth
        size="small"
      />
      <TextField
        select
        label="Professeur"
        value={form.teacherId}
        onChange={(e) => onChange({ ...form, teacherId: e.target.value })}
        required
        fullWidth
        size="small"
      >
        {teachers.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.firstName} {t.lastName}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  )
}
