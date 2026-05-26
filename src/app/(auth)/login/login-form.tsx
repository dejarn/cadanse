"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Divider from "@mui/material/Divider"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get("callbackUrl") ?? "/dashboard"
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Identifiants incorrects.")
      return
    }

    router.push(callbackUrl)
  }

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 420,
        border: "1px solid",
        borderColor: "primary.light",
        background:
          "linear-gradient(160deg, rgba(26,25,23,0.98) 0%, rgba(20,19,18,0.96) 55%, rgba(15,14,13,0.98) 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 15% 10%, rgba(212,168,83,0.16) 0%, transparent 42%), radial-gradient(circle at 85% 95%, rgba(212,168,83,0.07) 0%, transparent 38%)",
        },
      }}
    >
      <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
        <Typography
          component="p"
          sx={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "text.secondary",
            mb: 1.5,
          }}
        >
          Espace administration
        </Typography>
        <Typography
          variant="h3"
          sx={{
            mb: 0.5,
            fontFamily: "'Cormorant Garamond', serif",
            color: "primary.main",
            lineHeight: 1,
          }}
        >
          Cadanse
        </Typography>

        <Divider sx={{ borderColor: "primary.light", opacity: 0.6, mb: 3 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Identifiant"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
            size="small"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 1.5,
              py: 1.15,
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Se connecter"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
