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

  const [editClass, setEditClass] = useState<Class | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [deleteClass, setDeleteClass] = useState<Class | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
    setEditClass(cls)
    setEditForm({ name: cls.name, schedule: cls.schedule, teacherId: cls.teacherId })
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editClass) return
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(`/api/classes/${editClass.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    setEditLoading(false)
    if (res.ok) {
      setEditClass(null)
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setEditError(data.error ?? "Une erreur est survenue.")
  }

  function openDelete(cls: Class) {
    setDeleteClass(cls)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteClass) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/classes/${deleteClass.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      setDeleteClass(null)
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
          Nouveau cours
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {classes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aucun cours pour cette saison.
        </Typography>
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
        open={!!editClass}
        title="Modifier le cours"
        submitLabel="Enregistrer"
        loading={editLoading}
        error={editError}
        onClose={() => setEditClass(null)}
        onSubmit={handleEdit}
      >
        <ClassForm form={editForm} onChange={setEditForm} teachers={teachers} />
      </FormDialog>

      <ConfirmDialog
        open={!!deleteClass}
        title="Supprimer le cours"
        message={<>Supprimer le cours «&nbsp;{deleteClass?.name}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => setDeleteClass(null)}
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
