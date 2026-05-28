"use client"

import { useState, useCallback, useSyncExternalStore } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"
import Checkbox from "@mui/material/Checkbox"
import Divider from "@mui/material/Divider"

type Student = { id: string; firstName: string; lastName: string }

type ClassData = {
  id: string
  name: string
  schedule: string
  teacherName: string
  students: Student[]
}

interface Props {
  classes: ClassData[]
}

function storageKey(classId: string) {
  return `cadanse:rollcall:${classId}`
}

function loadAttendance(classId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(storageKey(classId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAttendance(classId: string, data: Record<string, boolean>) {
  sessionStorage.setItem(storageKey(classId), JSON.stringify(data))
}

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function RollCallClient({ classes }: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const hydrated = useHydrated()

  const selectClass = useCallback((classId: string) => {
    setSelectedClassId(classId)
    setAttendance(classId ? loadAttendance(classId) : {})
  }, [])

  const toggle = useCallback(
    (studentId: string) => {
      if (!selectedClassId) return
      setAttendance((prev) => {
        const next = { ...prev, [studentId]: !prev[studentId] }
        saveAttendance(selectedClassId, next)
        return next
      })
    },
    [selectedClassId],
  )

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const presentCount = selectedClass
    ? selectedClass.students.filter((s) => attendance[s.id]).length
    : 0

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Appel
      </Typography>

      <Autocomplete
        options={classes}
        getOptionLabel={(cls) => `${cls.name} — ${cls.schedule} · ${cls.teacherName}`}
        value={classes.find((c) => c.id === selectedClassId) ?? null}
        onChange={(_, cls) => {
          selectClass(cls?.id ?? "")
        }}
        renderInput={(params) => <TextField {...params} label="Cours" placeholder="Rechercher un cours…" />}
        size="small"
        sx={{ mb: 3 }}
      />

      {selectedClass && hydrated && (
        <>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {presentCount} présent{presentCount !== 1 ? "s" : ""} sur{" "}
            {selectedClass.students.length} élève
            {selectedClass.students.length !== 1 ? "s" : ""}
          </Typography>

          {selectedClass.students.length === 0 ? (
            <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Aucun élève inscrit dans ce cours.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {selectedClass.students.map((student) => (
                <Box
                  key={student.id}
                  onClick={() => toggle(student.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(212,168,83,0.05)" },
                  }}
                >
                  <Checkbox
                    checked={!!attendance[student.id]}
                    size="small"
                    sx={{ color: "text.secondary", "&.Mui-checked": { color: "primary.main" } }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggle(student.id)}
                  />
                  <Typography variant="body1">
                    {student.lastName} {student.firstName}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
