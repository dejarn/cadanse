import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { SxProps, Theme } from "@mui/material/styles"

interface Props {
  children: React.ReactNode
  maxWidth?: number
  sx?: SxProps<Theme>
}

const stageSx = {
  width: "100%",
  aspectRatio: "4/3" as const,
  bgcolor: "#1A1917",
  border: "1px solid rgba(212,168,83,0.3)",
  borderRadius: 2,
  position: "relative" as const,
  overflow: "hidden" as const,
  backgroundImage: "radial-gradient(circle, rgba(212,168,83,0.06) 1px, transparent 1px)",
  backgroundSize: "5% 5%",
}

const labelSx = {
  position: "absolute" as const,
  left: "50%",
  transform: "translateX(-50%)",
  color: "text.secondary",
  opacity: 0.4,
  pointerEvents: "none" as const,
}

export default function StageBox({ children, maxWidth = 800, sx }: Props) {
  return (
    <Box sx={{ ...stageSx, maxWidth, ...sx }}>
      {children}
      <Typography variant="caption" sx={{ ...labelSx, top: 4 }}>
        Public
      </Typography>
      <Typography variant="caption" sx={{ position: "absolute", top: "50%", left: 4, transform: "translateY(-50%)", color: "text.secondary", opacity: 0.4, pointerEvents: "none" }}>
        Côté cour
      </Typography>
      <Typography variant="caption" sx={{ position: "absolute", top: "50%", right: 4, transform: "translateY(-50%)", color: "text.secondary", opacity: 0.4, pointerEvents: "none" }}>
        Côté jardin
      </Typography>
    </Box>
  )
}
