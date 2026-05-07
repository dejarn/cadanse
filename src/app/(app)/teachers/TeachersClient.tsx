"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"

type Teacher = {
  id: string
  firstName: string
  lastName: string
  createdAt: Date
}

type Props = { teachers: Teacher[] }

export default function TeachersClient({ teachers }: Props) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [createFirst, setCreateFirst] = useState("")
  const [createLast, setCreateLast] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null)
  const [editFirst, setEditFirst] = useState("")
  const [editLast, setEditLast] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTeacher, setDeleteTeacher] = useState<Teacher | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: createFirst, lastName: createLast }),
    })
    setCreateLoading(false)
    if (res.status === 201) {
      setCreateOpen(false)
      setCreateFirst("")
      setCreateLast("")
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setCreateError(data.error ?? "Une erreur est survenue.")
  }

  function openEdit(teacher: Teacher) {
    setEditTeacher(teacher)
    setEditFirst(teacher.firstName)
    setEditLast(teacher.lastName)
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTeacher) return
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(`/api/teachers/${editTeacher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: editFirst, lastName: editLast }),
    })
    setEditLoading(false)
    if (res.ok) {
      setEditTeacher(null)
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setEditError(data.error ?? "Une erreur est survenue.")
  }

  function openDelete(teacher: Teacher) {
    setDeleteTeacher(teacher)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteTeacher) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/teachers/${deleteTeacher.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      setDeleteTeacher(null)
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
            Professeurs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {teachers.length} professeur{teachers.length > 1 ? "s" : ""}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateFirst("")
            setCreateLast("")
            setCreateError(null)
            setCreateOpen(true)
          }}
        >
          Nouveau professeur
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {teachers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aucun professeur enregistré.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {teachers.map((teacher) => (
            <Box
              key={teacher.id}
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
              <Typography variant="body1">
                {teacher.firstName} {teacher.lastName}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  {new Date(teacher.createdAt).toLocaleDateString("fr-FR")}
                </Typography>

                <IconButton size="small" onClick={() => openEdit(teacher)}>
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton size="small" onClick={() => openDelete(teacher)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <FormDialog
        open={createOpen}
        title="Nouveau professeur"
        submitLabel="Créer"
        loading={createLoading}
        error={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Prénom"
            value={createFirst}
            onChange={(e) => setCreateFirst(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
          />
          <TextField
            label="Nom"
            value={createLast}
            onChange={(e) => setCreateLast(e.target.value)}
            required
            fullWidth
            size="small"
          />
        </Box>
      </FormDialog>

      <FormDialog
        open={!!editTeacher}
        title="Modifier le professeur"
        submitLabel="Enregistrer"
        loading={editLoading}
        error={editError}
        onClose={() => setEditTeacher(null)}
        onSubmit={handleEdit}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Prénom"
            value={editFirst}
            onChange={(e) => setEditFirst(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
          />
          <TextField
            label="Nom"
            value={editLast}
            onChange={(e) => setEditLast(e.target.value)}
            required
            fullWidth
            size="small"
          />
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTeacher}
        title="Supprimer le professeur"
        message={
          <>
            Supprimer «&nbsp;{deleteTeacher?.firstName} {deleteTeacher?.lastName}&nbsp;» ?
          </>
        }
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => setDeleteTeacher(null)}
      />
    </>
  )
}
