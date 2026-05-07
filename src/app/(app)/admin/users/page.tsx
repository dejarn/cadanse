import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

export default async function UsersPage() {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/app/dashboard")

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } })

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Comptes
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {users.length} compte(s) administrateur
      </Typography>
    </Box>
  )
}
