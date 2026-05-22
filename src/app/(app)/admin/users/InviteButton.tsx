"use client"

import { useState } from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import TextField from "@mui/material/TextField"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckIcon from "@mui/icons-material/Check"
import PersonAddIcon from "@mui/icons-material/PersonAdd"

export default function InviteButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await fetch("/api/invites", { method: "POST" })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) {
      setInviteUrl(`${window.location.origin}/invite/${data.token}`)
      setOpen(true)
    } else {
      setError(data.error ?? "Erreur lors de la génération du lien.")
    }
  }

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleClose() {
    setOpen(false)
    setInviteUrl(null)
    setCopied(false)
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
        onClick={handleGenerate}
        disabled={loading}
        size="small"
      >
        Inviter un administrateur
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
          {error}
        </Typography>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Cormorant Garamond', serif", color: "primary.main", fontSize: "1.5rem" }}>
          Lien d&apos;invitation
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Partagez ce lien avec la personne à inviter. Valide 48 heures — usage unique.
          </Typography>

          <TextField
            value={inviteUrl ?? ""}
            fullWidth
            size="small"
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopy} edge="end" size="small" color={copied ? "success" : "default"}>
                      {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {copied ? (
            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
              Lien copié !
            </Typography>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} variant="outlined" size="small">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
