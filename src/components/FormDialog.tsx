"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"

type Props = {
  open: boolean
  title: string
  submitLabel?: string
  loading?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}

export default function FormDialog({
  open,
  title,
  submitLabel = "Enregistrer",
  loading = false,
  error,
  onClose,
  onSubmit,
  children,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { bgcolor: "background.paper", border: "1px solid", borderColor: "divider" } } }}
    >
      <DialogTitle sx={{ fontFamily: "'Cormorant Garamond', serif", color: "primary.main", fontSize: "1.5rem" }}>
        {title}
      </DialogTitle>
      <Box component="form" onSubmit={(e) => { e.preventDefault(); onSubmit(e) }}>
        <DialogContent sx={{ pt: 1 }}>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          {children}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined" size="small" disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" size="small" disabled={loading}>
            {loading ? <CircularProgress size={16} color="inherit" /> : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
