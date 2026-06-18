"use client"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import LockIcon from "@mui/icons-material/Lock"
import LockOpenIcon from "@mui/icons-material/LockOpen"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { teacherName } from "@/lib/teacherName"

type ActWithClass = {
  id: string
  name: string
  class: { name: string; schedule: string; teacher: { firstName: string; lastName: string; displayName: string | null } } | null
}

export default function SortableActRow({
  act,
  position,
  isLocked,
  onToggleLock,
  onRequestMove,
}: {
  act: ActWithClass
  position: number
  isLocked: boolean
  onToggleLock: (actId: string) => void
  onRequestMove: (actId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: act.id,
    disabled: isLocked,
    animateLayoutChanges: () => false,
  })

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderRadius: 1,
        opacity: isDragging ? 0.4 : 1,
        transform: isLocked ? undefined : CSS.Transform.toString(transform),
        transition: isLocked ? undefined : transition,
        bgcolor: isDragging ? "rgba(212,168,83,0.08)" : "transparent",
        "&:hover": { bgcolor: isLocked ? "transparent" : "rgba(212,168,83,0.05)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Tooltip title={isLocked ? "Déverrouiller la position" : "Verrouiller la position"}>
          <IconButton
            size="small"
            onClick={() => onToggleLock(act.id)}
            aria-label={isLocked ? `Libérer la position de ${act.name}` : `Fixer la position de ${act.name}`}
            sx={{
              color: isLocked ? "primary.main" : "text.disabled",
              "&:hover": { color: isLocked ? "primary.light" : "text.secondary" },
            }}
          >
            {isLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={isLocked ? "" : "Déplacer à une position"}>
          <ButtonBase
            onClick={() => onRequestMove(act.id)}
            disabled={isLocked}
            aria-label={`Déplacer ${act.name} à une position`}
            sx={{
              minWidth: 28,
              px: 0.5,
              py: 0.25,
              borderRadius: 1,
              justifyContent: "flex-end",
              color: "text.secondary",
              cursor: isLocked ? "default" : "pointer",
              "&:hover": { bgcolor: isLocked ? "transparent" : "rgba(212,168,83,0.12)", color: isLocked ? "text.secondary" : "primary.main" },
            }}
          >
            <Typography variant="body2" sx={{ textAlign: "right" }}>
              {position}.
            </Typography>
          </ButtonBase>
        </Tooltip>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" noWrap>{act.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {act.class ? `${act.class.name} · ${act.class.schedule} · ${teacherName(act.class.teacher)}` : null}
          </Typography>
        </Box>
      </Box>
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: "flex",
          flexShrink: 0,
          color: isLocked ? "text.disabled" : "text.secondary",
          cursor: isLocked ? "not-allowed" : "grab",
          touchAction: "none",
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
    </Box>
  )
}
