import { notFound } from "next/navigation"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassDetailPage({ params }: Props) {
  const { id } = await params
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: true,
      season: true,
      enrollments: { include: { student: true } },
    },
  })

  if (!cls) notFound()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {cls.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {cls.schedule} — {cls.teacher.displayName ?? `${cls.teacher.firstName} ${cls.teacher.lastName}`}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {cls.enrollments.length === 0
          ? "Aucun élève inscrit."
          : `${cls.enrollments.length} élève(s)`}
      </Typography>
    </Box>
  )
}
