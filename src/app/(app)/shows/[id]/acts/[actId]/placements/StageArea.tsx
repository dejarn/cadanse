"use client"

import { forwardRef, useCallback, useEffect, useMemo, useState } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import StageBox from "@/components/StageBox"
import StudentDot from "./StudentDot"
import { DOT_COLORS, dotColor } from "@/lib/colors"

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
  onSelectStudent: (studentId: string) => void
  onColorChange: (studentId: string, colorIndex: number) => void
  flipped?: boolean
}

function DraggableDot({
  placement,
  color,
  firstName,
  lastName,
  isSelected,
  isDragging,
  onSelect,
  onContextMenu,
}: {
  placement: Placement
  color: string
  firstName: string
  lastName: string
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
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
      isDragging={isDragging}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    />
  )
}

const StageArea = forwardRef<HTMLDivElement, Props>(
  ({ placements, participants, selectedStudentId, onClick, onDotDrag, onDotRemove, onSelectStudent, onColorChange, flipped }, ref) => {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; studentId: string } | null>(null)

    useEffect(() => {
      if (!contextMenu) return
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setContextMenu(null)
      }
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest("[data-context-menu-popup]")) return
        setContextMenu(null)
      }
      window.addEventListener("keydown", handleKey)
      window.addEventListener("mousedown", handleClick, true)
      return () => {
        window.removeEventListener("keydown", handleKey)
        window.removeEventListener("mousedown", handleClick, true)
      }
    }, [contextMenu])
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
      }),
    )

    const participantMap = useMemo(
      () => new Map(participants.map((p) => [p.student.id, p])),
      [participants],
    )

    const handleDragStart = useCallback((event: DragStartEvent) => {
      setActiveId(event.active.id as string)
    }, [])

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, delta } = event
        setActiveId(null)
        if (!active?.id) return
        onDotDrag(active.id as string, delta.x, delta.y)
      },
      [onDotDrag],
    )

    const handleDragCancel = useCallback(() => {
      setActiveId(null)
    }, [])

    const contextParticipant = contextMenu ? participantMap.get(contextMenu.studentId) : null

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
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <StageBox
            flipped={flipped}
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
                    isDragging={activeId === p.studentId}
                    onSelect={() => { onSelectStudent(p.studentId); setContextMenu(null) }}
                    onContextMenu={(e) => setContextMenu({ x: e.clientX, y: e.clientY, studentId: p.studentId })}
                  />
                )
              })}
            </Box>
          </StageBox>
          <DragOverlay dropAnimation={null}>
            {activeId && (() => {
              const participant = participantMap.get(activeId)
              if (!participant) return null
              const color = dotColor(participant.color)
              return (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: color,
                    border: "2px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 20px ${color}66`,
                    cursor: "grabbing",
                    userSelect: "none",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#0F0E0D", fontWeight: 600, fontSize: "0.65rem", lineHeight: 1, pointerEvents: "none" }}
                  >
                    {participant.student.firstName.charAt(0)}{participant.student.lastName.charAt(0)}
                  </Typography>
                </Box>
              )
            })()}
          </DragOverlay>
        </DndContext>

        {contextMenu && contextParticipant && (
          <Box
            sx={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
          >
            <Box
              data-context-menu-popup
              onContextMenu={(e) => e.preventDefault()}
              sx={{
                position: "fixed",
                left: contextMenu.x,
                top: contextMenu.y,
                bgcolor: "#221F1C",
                border: "1px solid rgba(212,168,83,0.3)",
                borderRadius: 1,
                py: 0.5,
                minWidth: 120,
                zIndex: 10000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                pointerEvents: "auto",
              }}
            >
              <Typography
                variant="caption"
                sx={{ px: 1.5, py: 0.25, color: "text.secondary", display: "block" }}
              >
                {contextParticipant.student.firstName} {contextParticipant.student.lastName}
              </Typography>
              <Box sx={{ px: 1, py: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {DOT_COLORS.map((c, i) => (
                  <Box
                    key={c}
                    onClick={() => {
                      onColorChange(contextMenu.studentId, i)
                      setContextMenu(null)
                    }}
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      bgcolor: c,
                      cursor: "pointer",
                      border: i === contextParticipant.color ? "2px solid #F5F0E8" : "2px solid transparent",
                      "&:hover": { transform: "scale(1.2)" },
                      transition: "transform 100ms ease",
                    }}
                  />
                ))}
              </Box>
              <Box
                onClick={() => {
                  onDotRemove(contextMenu.studentId)
                  setContextMenu(null)
                }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(212,168,83,0.1)" },
                  fontSize: "0.8rem",
                }}
              >
                Retirer de la scène
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    )
  },
)

StageArea.displayName = "StageArea"
export default StageArea
