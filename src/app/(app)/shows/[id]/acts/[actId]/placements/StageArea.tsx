"use client"

import { forwardRef, useCallback, useMemo } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import StageBox from "@/components/StageBox"
import StudentDot from "./StudentDot"
import { dotColor } from "@/lib/colors"

type Placement = { studentId: string; x: number; y: number }
type Student = { id: string; firstName: string; lastName: string }
type Participant = { student: Student; color: number }

interface Props {
  placements: Placement[]
  participants: Participant[]
  selectedStudentId: string | null
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void
  onDotDrag: (studentId: string, deltaX: number, deltaY: number) => void
  onDotRemove: (studentId: string) => void
}

function DraggableDot({
  placement,
  color,
  firstName,
  lastName,
  isSelected,
  onRemove,
}: {
  placement: Placement
  color: string
  firstName: string
  lastName: string
  isSelected: boolean
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: placement.studentId,
  })

  return (
    <StudentDot
      ref={setNodeRef}
      x={placement.x}
      y={placement.y}
      color={color}
      firstName={firstName}
      lastName={lastName}
      isSelected={isSelected}
      isDragOverlay={isDragging}
      onRemove={onRemove}
      {...attributes}
      {...listeners}
    />
  )
}

const StageArea = forwardRef<HTMLDivElement, Props>(
  ({ placements, participants, selectedStudentId, onClick, onDotDrag, onDotRemove }, ref) => {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
      }),
    )

    const participantMap = useMemo(
      () => new Map(participants.map((p) => [p.student.id, p])),
      [participants],
    )

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, delta } = event
        if (!active?.id) return
        onDotDrag(active.id as string, delta.x, delta.y)
      },
      [onDotDrag],
    )

    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <StageBox
            sx={{
              cursor: selectedStudentId ? "crosshair" : "default",
              "&": { maxWidth: 800 },
            }}
          >
            <Box
              ref={ref}
              onClick={onClick}
              sx={{ position: "absolute", inset: 0 }}
            >
              {placements.length === 0 && !selectedStudentId && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.secondary" variant="body2">
                    Sélectionnez un élève puis cliquez pour le placer
                  </Typography>
                </Box>
              )}

              {placements.map((p) => {
                const participant = participantMap.get(p.studentId)
                if (!participant) return null
                return (
                  <DraggableDot
                    key={p.studentId}
                    placement={p}
                    color={dotColor(participant.color)}
                    firstName={participant.student.firstName}
                    lastName={participant.student.lastName}
                    isSelected={selectedStudentId === p.studentId}
                    onRemove={() => onDotRemove(p.studentId)}
                  />
                )
              })}
            </Box>
          </StageBox>
        </DndContext>
      </Box>
    )
  },
)

StageArea.displayName = "StageArea"
export default StageArea
