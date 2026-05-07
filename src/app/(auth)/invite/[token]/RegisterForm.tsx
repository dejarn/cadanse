"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"

export default function RegisterForm({ token }: { token: string }) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setError(null)
    setLoading(true)

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, username, password }),
    })

    setLoading(false)

    if (res.status === 201) {
      router.push("/login")
      return
    }

    const data = await res.json().catch(() => ({}))
    if (res.status === 409) setError("Identifiant déjà utilisé.")
    else if (res.status === 410) setError("Lien d'invitation invalide ou expiré.")
    else setError(data.error ?? "Une erreur est survenue.")
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
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
        autoComplete="new-password"
        required
        fullWidth
        size="small"
      />
      <TextField
        label="Confirmer le mot de passe"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        fullWidth
        size="small"
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 1.5, py: 1.15, fontWeight: 600, letterSpacing: "0.01em" }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : "Créer mon compte"}
      </Button>
    </Box>
  )
}
