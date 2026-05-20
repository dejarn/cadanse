"use client"

import { useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Switch from "@mui/material/Switch"
import FormControlLabel from "@mui/material/FormControlLabel"
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
  const [showNames, setShowNames] = useState(false)

  const scene = scenes[sceneIndex]

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
            return (
              <Box
                key={p.student.id}
                sx={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: isHighlighted ? 36 : 28,
                  height: isHighlighted ? 36 : 28,
                  borderRadius: "50%",
                  bgcolor: color,
                  border: isHighlighted ? "3px solid #F5F0E8" : "2px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: isHighlighted ? 10 : 1,
                  boxShadow: isHighlighted ? `0 0 16px ${color}88` : "none",
                  transition: "all 200ms ease",
                }}
              >
                {showNames && (
                  <Typography
                    sx={{
                      color: "#0F0E0D",
                      fontWeight: 600,
                      fontSize: isHighlighted ? "0.55rem" : "0.45rem",
                      lineHeight: 1,
                      pointerEvents: "none",
                      textAlign: "center",
                      px: 0.25,
                    }}
                  >
                    {p.student.firstName}
                  </Typography>
                )}
              </Box>
            )
          })}
        </StageBox>
      </Box>

      {/* Controls */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <FormControlLabel
          control={<Switch size="small" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />}
          label={<Typography variant="body2">Afficher les prénoms</Typography>}
        />
      </Box>

      {/* Student list */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {scene.placements.map((p) => {
          const color = dotColor(p.student.color)
          const isHighlighted = highlightedId === p.student.id
          return (
            <Button
              key={p.student.id}
              size="small"
              variant={isHighlighted ? "contained" : "outlined"}
              onClick={() => setHighlightedId(isHighlighted ? null : p.student.id)}
              sx={{
                borderColor: color,
                color: isHighlighted ? "#0F0E0D" : color,
                bgcolor: isHighlighted ? color : "transparent",
                textTransform: "none",
                "&:hover": {
                  borderColor: color,
                  bgcolor: isHighlighted ? color : `${color}15`,
                },
              }}
            >
              {p.student.firstName} {p.student.lastName}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}
