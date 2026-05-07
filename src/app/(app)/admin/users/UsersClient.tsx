"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Tooltip from "@mui/material/Tooltip"
import DeleteIcon from "@mui/icons-material/Delete"
import ConfirmDialog from "@/components/ConfirmDialog"
import InviteButton from "./InviteButton"
import { useEntityDialog } from "@/hooks/useEntityDialog"

type User = {
  id: string
  username: string
  role: string
  createdAt: Date
}

type Props = { users: User[]; currentUserId: string }

export default function UsersClient({ users, currentUserId }: Props) {
  const router = useRouter()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const deleteDialog = useEntityDialog(users)

  function openDelete(user: User) {
    deleteDialog.open(user)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteDialog.selected) return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await fetch(`/api/users/${deleteDialog.selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (res.status === 204) {
      deleteDialog.close()
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setDeleteError(data.error ?? "Une erreur est survenue.")
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
            Comptes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {users.length} compte{users.length > 1 ? "s" : ""} administrateur
          </Typography>
        </Box>
        <InviteButton />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {users.length === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Aucun compte administrateur.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {users.map((user) => {
            const isSelf = user.id === currentUserId
            return (
              <Box
                key={user.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(212,168,83,0.05)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: isSelf ? 600 : 400 }}>
                    {user.username}
                    {isSelf ? (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (vous)
                      </Typography>
                    ) : null}
                  </Typography>
                  <Chip
                    label={user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      bgcolor:
                        user.role === "SUPER_ADMIN"
                          ? "rgba(212,168,83,0.15)"
                          : "rgba(154,144,137,0.15)",
                      color: user.role === "SUPER_ADMIN" ? "primary.main" : "text.secondary",
                      border: "1px solid",
                      borderColor:
                        user.role === "SUPER_ADMIN"
                          ? "rgba(212,168,83,0.35)"
                          : "rgba(154,144,137,0.35)",
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    {user.createdAt.toLocaleDateString("fr-FR")}
                  </Typography>
                  <Tooltip title={isSelf ? "Impossible de supprimer son propre compte" : "Supprimer"}>
                    <span>
                      <IconButton size="small" onClick={() => openDelete(user)} disabled={isSelf}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      <ConfirmDialog
        open={!!deleteDialog.selected}
        title="Supprimer le compte"
        message={
          <>
            Supprimer le compte «&nbsp;{deleteDialog.displaySelected?.username}&nbsp;» ? Cette action est irréversible.
          </>
        }
        confirmLabel="Supprimer"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={deleteDialog.close}
      />
    </>
  )
}
