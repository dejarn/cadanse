"use client"

import { useState, useMemo } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import Divider from "@mui/material/Divider"
import { dotColor } from "@/lib/colors"

type Student = { id: string; firstName: string; lastName: string }
type Participant = { student: Student; color: number }

interface Props {
  participants: Participant[]
  placedStudentIds: Set<string>
  selectedStudentId: string | null
  onSelectStudent: (id: string | null) => void
}

function StudentRow({
  participant,
  isPlaced,
  isSelected,
  onSelect,
}: {
  participant: Participant
  isPlaced: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  const color = dotColor(participant.color)

  return (
    <Box
      onClick={onSelect}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        cursor: "pointer",
        bgcolor: isSelected ? "rgba(212,168,83,0.1)" : "transparent",
        borderLeft: isSelected ? "3px solid #D4A853" : "3px solid transparent",
        "&:hover": { bgcolor: isSelected ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.03)" },
      }}
    >
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          bgcolor: isPlaced ? color : "transparent",
          border: `2px solid ${color}`,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {participant.student.firstName} {participant.student.lastName}
      </Typography>
    </Box>
  )
}

export default function StudentSidebar({
  participants,
  placedStudentIds,
  selectedStudentId,
  onSelectStudent,
}: Props) {
  const [search, setSearch] = useState("")

  const { placed, unplaced } = useMemo(() => {
    const q = search.toLowerCase().trim()
    const filtered = q
      ? participants.filter((p) =>
          `${p.student.firstName} ${p.student.lastName}`.toLowerCase().includes(q),
        )
      : participants

    const placed: Participant[] = []
    const unplaced: Participant[] = []
    for (const p of filtered) {
      if (placedStudentIds.has(p.student.id)) placed.push(p)
      else unplaced.push(p)
    }
    return { placed, unplaced }
  }, [participants, placedStudentIds, search])

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        overflow: "hidden",
      }}
    >
      <TextField
        placeholder="Rechercher un élève"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        fullWidth
      />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {placed.length === 0 && unplaced.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>
            Aucun élève trouvé.
          </Typography>
        ) : (
          <>
            {placed.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                  Placés ({placed.length})
                </Typography>
                {placed.map((p) => (
                  <StudentRow
                    key={p.student.id}
                    participant={p}
                    isPlaced
                    isSelected={selectedStudentId === p.student.id}
                    onSelect={() => onSelectStudent(selectedStudentId === p.student.id ? null : p.student.id)}
                  />
                ))}
                <Divider sx={{ my: 1 }} />
              </>
            )}
            {unplaced.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                  À placer ({unplaced.length})
                </Typography>
                {unplaced.map((p) => (
                  <StudentRow
                    key={p.student.id}
                    participant={p}
                    isPlaced={false}
                    isSelected={selectedStudentId === p.student.id}
                    onSelect={() => onSelectStudent(selectedStudentId === p.student.id ? null : p.student.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
