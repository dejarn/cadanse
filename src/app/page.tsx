import { auth } from "@/lib/auth"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Stack
        spacing={3}
        sx={{
          width: "100%",
          maxWidth: 520,
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "primary.main",
            lineHeight: 1.1,
          }}
        >
          Bienvenue sur Cadanse
        </Typography>

        <Button variant="contained" size="large" href="/login">
          Se connecter
        </Button>
      </Stack>
    </Box>
  )
}
