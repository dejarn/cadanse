"use client"

import { forwardRef, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Tooltip from "@mui/material/Tooltip"

interface Props {
  x: number
  y: number
  color: string
  firstName: string
  lastName: string
  isSelected?: boolean
  isDragOverlay?: boolean
  onRemove?: () => void
}

const StudentDot = forwardRef<HTMLDivElement, Props>(
  ({ x, y, color, firstName, lastName, isSelected, isDragOverlay, onRemove, ...rest }, ref) => {
    const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null)

    return (
      <>
        <Box
          ref={ref}
          {...rest}
          onContextMenu={(e) => {
            if (!onRemove) return
            e.preventDefault()
            e.stopPropagation()
            setMenuAnchor({ x: e.clientX, y: e.clientY })
          }}
          sx={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: color,
            border: isSelected ? "3px solid #F5F0E8" : "2px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isDragOverlay ? "grabbing" : "grab",
            zIndex: isSelected ? 10 : 1,
            boxShadow: isDragOverlay
              ? `0 4px 20px ${color}66`
              : `0 2px 8px rgba(0,0,0,0.3)`,
            transition: isDragOverlay ? "none" : "box-shadow 150ms ease",
            userSelect: "none",
            "&:hover": isDragOverlay
              ? {}
              : {
                  boxShadow: `0 4px 16px ${color}44`,
                },
          }}
        >
          <Tooltip title={`${firstName} ${lastName}`}>
            <Typography
              variant="caption"
              sx={{
                color: "#0F0E0D",
                fontWeight: 600,
                fontSize: "0.65rem",
                lineHeight: 1,
                pointerEvents: "none",
              }}
            >
              {firstName.charAt(0)}
            </Typography>
          </Tooltip>
        </Box>

        {menuAnchor && (
          <Box
            onClick={() => setMenuAnchor(null)}
            sx={{ position: "fixed", inset: 0, zIndex: 9999 }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: "fixed",
                left: menuAnchor.x,
                top: menuAnchor.y,
                bgcolor: "#221F1C",
                border: "1px solid rgba(212,168,83,0.3)",
                borderRadius: 1,
                py: 0.5,
                minWidth: 120,
                zIndex: 10000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ px: 1.5, py: 0.25, color: "text.secondary", display: "block" }}
              >
                {firstName} {lastName}
              </Typography>
              <Box
                onClick={() => {
                  onRemove?.()
                  setMenuAnchor(null)
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
      </>
    )
  },
)

StudentDot.displayName = "StudentDot"
export default StudentDot
