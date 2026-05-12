import Box from "@mui/material/Box"
import type { SxProps, Theme } from "@mui/material/styles"

type Props = {
  children: React.ReactNode
  actions?: React.ReactNode
  sx?: SxProps<Theme>
}

export default function EntityRow({ children, actions, sx }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderRadius: 1,
        "&:hover": { bgcolor: "rgba(212,168,83,0.05)" },
        ...sx,
      }}
    >
      {children}
      {actions}
    </Box>
  )
}
