import Box from "@mui/material/Box"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          animation: "pageEnter 200ms ease-out",
          "@keyframes pageEnter": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
