"use client"

import { useState, useRef, useEffect } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore"
import NavigateNextIcon from "@mui/icons-material/NavigateNext"
import StageBox from "@/components/StageBox"
import { dotColor } from "@/lib/colors"

type StudentData = { id: string; firstName: string; lastName: string; color: number }
type PlacementData = { x: number; y: number; student: StudentData }
type SceneData = { id: string; name: string; order: number; placements: PlacementData[] }

interface Props {
  scenes: SceneData[]
}

export default function PlacementsPublicClient({ scenes }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const rowRefs = useRef<Map<string, Element>>(new Map())

  const scene = scenes[sceneIndex]

  useEffect(() => {
    if (highlightedId) {
      rowRefs.current.get(highlightedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [highlightedId])

  if (scenes.length === 0) {
    return <Typography color="text.secondary">Pas de scène disponible.</Typography>
  }

  return (
    <Box>
      {/* Scene navigation */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setSceneIndex((i) => Math.max(0, i - 1))}
            disabled={sceneIndex === 0}
          >
            <NavigateBeforeIcon />
          </IconButton>
          <Typography
            sx={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", color: "primary.main" }}
          >
            {scene.name}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setSceneIndex((i) => Math.min(scenes.length - 1, i + 1))}
            disabled={sceneIndex === scenes.length - 1}
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {sceneIndex + 1} / {scenes.length}
        </Typography>
      </Box>

      {/* Stage */}
      <Box sx={{ mb: 2 }}>
        <StageBox maxWidth={Infinity}>
          {scene.placements.map((p) => {
            const color = dotColor(p.student.color)
            const isHighlighted = highlightedId === p.student.id
            const initials = `${p.student.firstName[0] ?? ""}${p.student.lastName[0] ?? ""}`.toUpperCase()
            return (
              <Box
                key={p.student.id}
                onClick={() => setHighlightedId(isHighlighted ? null : p.student.id)}
                sx={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: isHighlighted ? "clamp(22px, 6.5vw, 32px)" : "clamp(18px, 5vw, 26px)",
                  height: isHighlighted ? "clamp(22px, 6.5vw, 32px)" : "clamp(18px, 5vw, 26px)",
                  borderRadius: "50%",
                  bgcolor: color,
                  border: isHighlighted ? "3px solid #F5F0E8" : "2px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: isHighlighted ? 10 : 1,
                  boxShadow: isHighlighted ? `0 0 16px ${color}88` : "none",
                  transition: "all 200ms ease",
                  cursor: "pointer",
                }}
              >
                <Typography
                  sx={{
                    color: "#0F0E0D",
                    fontWeight: 700,
                    fontSize: isHighlighted ? "clamp(0.4rem, 1.5vw, 0.6rem)" : "clamp(0.35rem, 1.3vw, 0.5rem)",
                    lineHeight: 1,
                    pointerEvents: "none",
                    textAlign: "center",
                    userSelect: "none",
                  }}
                >
                  {initials}
                </Typography>
              </Box>
            )
          })}
        </StageBox>
      </Box>

      {/* Student list */}
      <Box sx={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
        {scene.placements.map((p) => {
          const color = dotColor(p.student.color)
          const isHighlighted = highlightedId === p.student.id
          return (
            <Box
              key={p.student.id}
              ref={(el: Element | null) => {
                if (el) rowRefs.current.set(p.student.id, el)
                else rowRefs.current.delete(p.student.id)
              }}
              onClick={() => setHighlightedId(isHighlighted ? null : p.student.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                cursor: "pointer",
                bgcolor: isHighlighted ? `${color}18` : "transparent",
                border: "1px solid",
                borderColor: isHighlighted ? color : "transparent",
                transition: "all 150ms ease",
                "&:active": { opacity: 0.7 },
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: color,
                  flexShrink: 0,
                  boxShadow: isHighlighted ? `0 0 6px ${color}` : "none",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: isHighlighted ? color : "text.primary",
                  fontWeight: isHighlighted ? 600 : 400,
                  transition: "color 150ms ease",
                }}
              >
                {p.student.firstName} {p.student.lastName}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
