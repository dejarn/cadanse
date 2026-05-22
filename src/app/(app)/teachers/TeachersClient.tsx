"use client"

import { useState } from "react"
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
import EntityRow from "@/components/EntityRow"
import FormDialog from "@/components/FormDialog"
import { useCrudDialogs } from "@/hooks/useCrudDialogs"
import { teacherName } from "@/lib/teacherName"

type Teacher = { id: string; firstName: string; lastName: string; displayName: string | null }

type Props = { teachers: Teacher[] }

const emptyForm = { firstName: "", lastName: "", displayName: "" }
type FormState = typeof emptyForm

function TeacherForm({ form, onChange }: { form: FormState; onChange: (f: FormState) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Prénom"
        value={form.firstName}
        onChange={(e) => onChange({ ...form, firstName: e.target.value })}
        required
        fullWidth
        size="small"
        autoFocus
      />
      <TextField
        label="Nom"
        value={form.lastName}
        onChange={(e) => onChange({ ...form, lastName: e.target.value })}
        required
        fullWidth
        size="small"
      />
      <TextField
        label="Nom affiché (optionnel)"
        value={form.displayName}
        onChange={(e) => onChange({ ...form, displayName: e.target.value })}
        fullWidth
        size="small"
        helperText="Si renseigné, remplace prénom + nom partout dans l'app."
      />
    </Box>
  )
}

export default function TeachersClient({ teachers }: Props) {
  const crud = useCrudDialogs<Teacher>({
    items: teachers,
    createUrl: "/api/teachers",
    editUrl: (t) => `/api/teachers/${t.id}`,
    deleteUrl: (t) => `/api/teachers/${t.id}`,
  })

  const [createForm, setCreateForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const ok = await crud.submitCreate({
      firstName: createForm.firstName,
      lastName: createForm.lastName,
      displayName: createForm.displayName || null,
    })
    if (ok) setCreateForm(emptyForm)
  }

  function openEdit(teacher: Teacher) {
    crud.openEdit(teacher)
    setEditForm({ firstName: teacher.firstName, lastName: teacher.lastName, displayName: teacher.displayName ?? "" })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    await crud.submitEdit({
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      displayName: editForm.displayName || null,
    })
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Professeurs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {teachers.length} professeur{teachers.length > 1 ? "s" : ""}
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
            Ajouter un professeur
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {teachers.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun professeur enregistré.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {teachers.map((teacher) => (
            <EntityRow
              key={teacher.id}
              actions={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton size="small" onClick={() => openEdit(teacher)} aria-label={`Modifier ${teacherName(teacher)}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>

                  <IconButton size="small" onClick={() => crud.openDelete(teacher)} aria-label={`Supprimer ${teacherName(teacher)}`}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <Box>
                <Typography variant="body1">
                  {teacherName(teacher)}
                </Typography>
                {teacher.displayName && (
                  <Typography variant="caption" color="text.secondary">
                    {teacher.firstName} {teacher.lastName}
                  </Typography>
                )}
              </Box>
            </EntityRow>
          ))}
        </Box>
      )}

      <FormDialog
        open={crud.createOpen}
        title="Nouveau professeur"
        submitLabel="Créer"
        loading={crud.createLoading}
        error={crud.createError}
        onClose={crud.closeCreate}
        onSubmit={handleCreate}
      >
        <TeacherForm form={createForm} onChange={setCreateForm} />
      </FormDialog>

      <FormDialog
        open={!!crud.editDialog.selected}
        title="Modifier le professeur"
        submitLabel="Enregistrer"
        loading={crud.editLoading}
        error={crud.editError}
        onClose={crud.closeEdit}
        onSubmit={handleEdit}
      >
        <TeacherForm form={editForm} onChange={setEditForm} />
      </FormDialog>

      <ConfirmDialog
        open={!!crud.deleteDialog.selected}
        title="Supprimer le professeur"
        message={
          <>
            Supprimer «&nbsp;{crud.deleteDialog.displaySelected?.firstName} {crud.deleteDialog.displaySelected?.lastName}
            &nbsp;» ?
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
