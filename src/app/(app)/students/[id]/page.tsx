import { notFound } from "next/navigation"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: { class: { include: { season: true, teacher: true } } },
      },
    },
  })

  if (!student) notFound()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {student.firstName} {student.lastName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {student.enrollments.length === 0
          ? "Aucune inscription."
          : `${student.enrollments.length} cours`}
      </Typography>
    </Box>
  )
}
