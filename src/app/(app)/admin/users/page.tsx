import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import InviteButton from "./InviteButton"

export default async function UsersPage() {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, role: true, createdAt: true },
  })

  return (
    <Box>
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {users.map((user) => (
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
              <Typography variant="body1" sx={{ fontWeight: user.id === session.user.id ? 600 : 400 }}>
                {user.username}
                {user.id === session.user.id ? (
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
            <Typography variant="caption" color="text.secondary">
              {user.createdAt.toLocaleDateString("fr-FR")}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
