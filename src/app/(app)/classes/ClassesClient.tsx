"use client"

import { useState, useDeferredValue } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import InputAdornment from "@mui/material/InputAdornment"
import SearchIcon from "@mui/icons-material/Search"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ConfirmDialog from "@/components/ConfirmDialog"
import EntityRow from "@/components/EntityRow"
import FormDialog from "@/components/FormDialog"
import { useCrudDialogs } from "@/hooks/useCrudDialogs"
import { teacherName } from "@/lib/teacherName"

type Teacher = { id: string; firstName: string; lastName: string; displayName?: string | null }

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
type FormState = typeof emptyForm

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

export default function ClassesClient({ classes, teachers, seasonId }: Props) {
  const crud = useCrudDialogs<Class>({
    items: classes,
    createUrl: "/api/classes",
    editUrl: (c) => `/api/classes/${c.id}`,
    deleteUrl: (c) => `/api/classes/${c.id}`,
  })

  const [searchText, setSearchText] = useState("")
  const [teacherFilter, setTeacherFilter] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "schedule">("name")
  const deferredSearch = useDeferredValue(searchText)

  const [createForm, setCreateForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  const filteredClasses = classes
    .filter((cls) => {
      const matchesText =
        deferredSearch === "" ||
        cls.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        cls.schedule.toLowerCase().includes(deferredSearch.toLowerCase())
      const matchesTeacher = teacherFilter === "" || cls.teacherId === teacherFilter
      return matchesText && matchesTeacher
    })
    .toSorted((a, b) => a[sortBy].localeCompare(b[sortBy], "fr"))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const ok = await crud.submitCreate({ ...createForm, seasonId })
    if (ok) setCreateForm(emptyForm)
  }

  function openEdit(cls: Class) {
    crud.openEdit(cls)
    setEditForm({ name: cls.name, schedule: cls.schedule, teacherId: cls.teacherId })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    await crud.submitEdit(editForm)
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
              Cours
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredClasses.length === classes.length
                ? `${classes.length} cours`
                : `${filteredClasses.length} / ${classes.length} cours`}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            disabled={teachers.length === 0}
            sx={{ mt: 0.5, flexShrink: 0 }}
            onClick={() => {
              setCreateForm(emptyForm)
              crud.openCreate()
            }}
          >
            Ajouter un cours
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Rechercher par nom ou horaire…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: "1 1 220px" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            sx={{ flex: "0 1 200px", minWidth: 160 }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">Tous les professeurs</MenuItem>
            {teachers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "schedule")}
            sx={{ flex: "0 1 160px", minWidth: 130 }}
          >
            <MenuItem value="name">Trier : nom</MenuItem>
            <MenuItem value="schedule">Trier : horaire</MenuItem>
          </TextField>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {classes.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun cours pour cette saison.
          </Typography>
        </Box>
      ) : filteredClasses.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun cours ne correspond aux filtres.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filteredClasses.map((cls) => (
            <EntityRow
              key={cls.id}
              actions={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton size="small" onClick={() => openEdit(cls)} aria-label={`Modifier ${cls.name}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => crud.openDelete(cls)} aria-label={`Supprimer ${cls.name}`}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <Box>
                <Typography variant="body1">{cls.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {cls.schedule} · {teacherName(cls.teacher)}
                </Typography>
              </Box>
            </EntityRow>
          ))}
        </Box>
      )}

      <FormDialog
        open={crud.createOpen}
        title="Nouveau cours"
        submitLabel="Créer"
        loading={crud.createLoading}
        error={crud.createError}
        onClose={crud.closeCreate}
        onSubmit={handleCreate}
      >
        <ClassForm form={createForm} onChange={setCreateForm} teachers={teachers} />
      </FormDialog>

      <FormDialog
        open={!!crud.editDialog.selected}
        title="Modifier le cours"
        submitLabel="Enregistrer"
        loading={crud.editLoading}
        error={crud.editError}
        onClose={crud.closeEdit}
        onSubmit={handleEdit}
      >
        <ClassForm form={editForm} onChange={setEditForm} teachers={teachers} />
      </FormDialog>

      <ConfirmDialog
        open={!!crud.deleteDialog.selected}
        title="Supprimer le cours"
        message={<>Supprimer le cours «&nbsp;{crud.deleteDialog.displaySelected?.name}&nbsp;» ?</>}
        confirmLabel="Supprimer"
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onClose={crud.closeDelete}
      />
    </>
  )
}
