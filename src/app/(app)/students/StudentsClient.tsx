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
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import SchoolIcon from "@mui/icons-material/School"
import ConfirmDialog from "@/components/ConfirmDialog"
import FormDialog from "@/components/FormDialog"
import { useEntityDialog } from "@/hooks/useEntityDialog"

type ClassItem = {
  id: string
  name: string
  schedule: string
  teacher: { firstName: string; lastName: string }
}

type Enrollment = { classId: string; class: ClassItem }

type Student = {
  id: string
  firstName: string
  lastName: string
  createdAt: Date
  enrollments: Enrollment[]
}

type Props = {
  students: Student[]
  classes: ClassItem[]
  hasActiveSeason: boolean
}

export default function StudentsClient({ students, classes, hasActiveSeason }: Props) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [createFirst, setCreateFirst] = useState("")
  const [createLast, setCreateLast] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  const [editFirst, setEditFirst] = useState("")
  const [editLast, setEditLast] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [addClassId, setAddClassId] = useState("")
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const [filterName, setFilterName] = useState("")
  const [filterClassId, setFilterClassId] = useState("")

  const editDialog = useEntityDialog(students)
  const deleteDialog = useEntityDialog(students)
  const classesDialog = useEntityDialog(students)
  const classesStudent = classesDialog.displaySelected

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchesName = fullName.includes(filterName.toLowerCase().trim())
    const matchesClass = !filterClassId || s.enrollments.some((e) => e.classId === filterClassId)
    return matchesName && matchesClass
  })

  const availableClasses = classesStudent
    ? classes.filter((c) => !classesStudent.enrollments.some((e) => e.classId === c.id))
    : []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)
    const res = await fetch("/api/students", {
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

  function openEdit(student: Student) {
    editDialog.open(student)
    setEditFirst(student.firstName)
    setEditLast(student.lastName)
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDialog.selected) return
    setEditError(null)
    setEditLoading(true)
    const res = await fetch(`/api/students/${editDialog.selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: editFirst, lastName: editLast }),
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

  function openDelete(student: Student) {
    deleteDialog.open(student)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteDialog.selected) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/students/${deleteDialog.selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
  }

  function openClasses(student: Student) {
    classesDialog.open(student)
    setAddClassId("")
    setAddError(null)
    setRemoveError(null)
    setRemoveLoadingId(null)
  }

  async function handleAddClass() {
    if (!classesDialog.selected || !addClassId) return
    setAddError(null)
    setAddLoading(true)
    const res = await fetch(`/api/classes/${addClassId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: classesDialog.selected.id }),
    })
    setAddLoading(false)
    if (res.status === 201) {
      setAddClassId("")
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setAddError(data.error ?? "Une erreur est survenue.")
  }

  async function handleRemoveClass(classId: string) {
    if (!classesDialog.selected) return
    setRemoveError(null)
    setRemoveLoadingId(classId)
    const res = await fetch(`/api/classes/${classId}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: classesDialog.selected.id }),
    })
    setRemoveLoadingId(null)
    if (res.status === 204) {
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setRemoveError(data.error ?? "Une erreur est survenue.")
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Élèves
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {students.length} élève{students.length > 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
            Ajouter un élève
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Rechercher un élève"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Cours"
          value={filterClassId}
          onChange={(e) => setFilterClassId(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Tous les cours</MenuItem>
          {classes.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
      </Box>

      {filteredStudents.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun élève enregistré.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filteredStudents.map((student) => (
            <Box
              key={student.id}
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
                {student.firstName} {student.lastName}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  {student.enrollments.length} cours
                </Typography>

                <IconButton size="small" onClick={() => openClasses(student)} title="Gérer les cours">
                  <SchoolIcon fontSize="small" />
                </IconButton>

                <IconButton size="small" onClick={() => openEdit(student)}>
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton size="small" onClick={() => openDelete(student)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Create dialog */}
      <FormDialog
        open={createOpen}
        title="Nouvel élève"
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

      {/* Edit dialog */}
      <FormDialog
        open={!!editDialog.selected}
        title="Modifier l'élève"
        submitLabel="Enregistrer"
        loading={editLoading}
        error={editError}
        onClose={editDialog.close}
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

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteDialog.selected}
        title="Supprimer l'élève"
        message={
          <>
            Supprimer «&nbsp;{deleteDialog.displaySelected?.firstName} {deleteDialog.displaySelected?.lastName}&nbsp;» ? Ses inscriptions aux cours seront également supprimées.
          </>
        }
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={deleteDialog.close}
      />

      {/* Classes dialog */}
      <Dialog
        open={!!classesDialog.selected}
        onClose={classesDialog.close}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: "background.paper", border: "1px solid", borderColor: "divider" } } }}
      >
        <DialogTitle
          sx={{ fontFamily: "'Cormorant Garamond', serif", color: "primary.main", fontSize: "1.5rem" }}
        >
          {classesStudent?.firstName} {classesStudent?.lastName}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {removeError ? <Alert severity="error" sx={{ mb: 2 }}>{removeError}</Alert> : null}

          {classesStudent?.enrollments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun cours attribué.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {classesStudent?.enrollments.map((enrollment) => (
                <Box
                  key={enrollment.classId}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, lineHeight: 1.3, color: "text.primary" }}
                    >
                      {enrollment.class.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.35, letterSpacing: 0.2, opacity: 0.9 }}
                    >
                      {enrollment.class.schedule} · {enrollment.class.teacher.firstName}{" "}
                      {enrollment.class.teacher.lastName}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    disabled={removeLoadingId === enrollment.classId}
                    onClick={() => handleRemoveClass(enrollment.classId)}
                  >
                    {removeLoadingId === enrollment.classId ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DeleteIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {hasActiveSeason ? (
            availableClasses.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <TextField
                  select
                  label="Ajouter un cours"
                  value={addClassId}
                  onChange={(e) => setAddClassId(e.target.value)}
                  size="small"
                  fullWidth
                >
                  {availableClasses.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!addClassId || addLoading}
                  onClick={handleAddClass}
                  sx={{ whiteSpace: "nowrap", alignSelf: "center" }}
                >
                  {addLoading ? <CircularProgress size={16} /> : "Ajouter"}
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Pas d&apos;autres cours disponibles.
              </Typography>
            )
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Aucune saison active.
            </Typography>
          )}

          {addError ? <Alert severity="error" sx={{ mt: 1 }}>{addError}</Alert> : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={classesDialog.close} variant="outlined" size="small">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
