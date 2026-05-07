import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

export default async function StudentsPage() {
  const students = await prisma.student.findMany({ orderBy: { lastName: "asc" } })

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Élèves
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {students.length === 0 ? "Aucun élève enregistré." : `${students.length} élève(s)`}
      </Typography>
    </Box>
  )
}
