import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

export default async function SeasonsPage() {
  const session = await auth()
  if (session?.user.role !== "SUPER_ADMIN") redirect("/")

  const seasons = await prisma.season.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Saisons
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {seasons.length === 0 ? "Aucune saison créée." : `${seasons.length} saison(s)`}
      </Typography>
    </Box>
  )
}
