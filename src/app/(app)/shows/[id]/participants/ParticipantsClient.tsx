"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import Checkbox from "@mui/material/Checkbox"
import Alert from "@mui/material/Alert"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
type Student = {
  id: string
  firstName: string
  lastName: string
  enrollments: { classId: string }[]
}

type ClassItem = { id: string; name: string }

interface Props {
  show: { id: string; name: string }
  students: Student[]
  participatingIds: string[]
  classes: ClassItem[]
}

export default function ParticipantsClient({ show, students, participatingIds, classes }: Props) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(new Set(participatingIds))
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [filterClassId, setFilterClassId] = useState("")

  const filteredStudents = students.filter((s) => {
    const matchesName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(filterName.toLowerCase().trim())
    const matchesClass = !filterClassId || s.enrollments.some((e) => e.classId === filterClassId)
    return matchesName && matchesClass
  })

  async function handleToggle(studentId: string) {
    if (loadingId || batchLoading) return
    const isParticipating = checked.has(studentId)
    const prev = checked
    setError(null)
    setLoadingId(studentId)

    const next = new Set(prev)
    if (isParticipating) next.delete(studentId)
    else next.add(studentId)
    setChecked(next)

    const res = await fetch(`/api/shows/${show.id}/participants`, {
      method: isParticipating ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    setLoadingId(null)

    const ok = isParticipating ? res.status === 204 : res.status === 201
    if (!ok) {
      setChecked(prev)
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Une erreur est survenue.")
    }
  }

  async function handleSelectAll() {
    const toAdd = filteredStudents.filter((s) => !checked.has(s.id))
    if (toAdd.length === 0 || batchLoading) return
    setError(null)
    setBatchLoading(true)

    const next = new Set(checked)
    let failed = false

    for (const student of toAdd) {
      next.add(student.id)
      setChecked(new Set(next))

      const res = await fetch(`/api/shows/${show.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      })

      if (res.status !== 201) {
        failed = true
        break
      }
    }

    if (failed) {
      router.refresh()
      setError("Erreur lors de l'ajout en masse.")
    }
    setBatchLoading(false)
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Participants
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {show.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {checked.size} participant{checked.size !== 1 ? "s" : ""} sur {students.length} élève{students.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Button
          component={Link}
          href={`/shows/${show.id}/order`}
          size="small"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Retour
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
        <Button
          onClick={handleSelectAll}
          disabled={batchLoading || filteredStudents.every((s) => checked.has(s.id))}
          variant="outlined"
          size="small"
          sx={{ alignSelf: "center", whiteSpace: "nowrap" }}
        >
          Tout sélectionner
        </Button>
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
              onClick={() => handleToggle(student.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                cursor: loadingId ? "default" : "pointer",
                "&:hover": { bgcolor: "rgba(212,168,83,0.05)" },
              }}
            >
              <Checkbox
                checked={checked.has(student.id)}
                disabled={loadingId === student.id}
                size="small"
                sx={{ color: "text.secondary", "&.Mui-checked": { color: "primary.main" } }}
                onClick={(e) => e.stopPropagation()}
                onChange={() => handleToggle(student.id)}
              />
              <Typography variant="body1">
                {student.firstName} {student.lastName}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </>
  )
}
