"use client"

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Typography from "@mui/material/Typography"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"

type Props = {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  confirmColor?: "error" | "primary" | "warning"
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  confirmColor = "error",
  loading = false,
  error,
  onConfirm,
  onClose,
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
      <DialogContent sx={{ pt: 1 }}>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined" size="small" disabled={loading}>
          Annuler
        </Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor} size="small" disabled={loading}>
          {loading ? <CircularProgress size={16} color="inherit" /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
