"use client"

import { forwardRef } from "react"
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
  isDragging?: boolean
  isDragOverlay?: boolean
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

const StudentDot = forwardRef<HTMLDivElement, Props>(
  ({ x, y, color, firstName, lastName, isSelected, isDragging, isDragOverlay, onClick, onContextMenu, ...rest }, ref) => {
    return (
      <Box
        ref={ref}
        {...rest}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu?.(e)
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
          opacity: isDragging ? 0.3 : 1,
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
            {firstName.charAt(0)}{lastName.charAt(0)}
          </Typography>
        </Tooltip>
      </Box>
    )
  },
)

StudentDot.displayName = "StudentDot"
export default StudentDot
