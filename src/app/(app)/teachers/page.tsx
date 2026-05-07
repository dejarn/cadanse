import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({ orderBy: { lastName: "asc" } })

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Professeurs
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {teachers.length === 0 ? "Aucun professeur enregistré." : `${teachers.length} professeur(s)`}
      </Typography>
    </Box>
  )
}
