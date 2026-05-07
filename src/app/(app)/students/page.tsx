import Box from "@mui/material/Box"
import { getActiveSeason } from "@/lib/stats-queries"
import { prisma } from "@/lib/prisma"
import StudentsClient from "./StudentsClient"

export default async function StudentsPage() {
  const season = await getActiveSeason()

  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      include: { enrollments: { include: { class: { include: { teacher: true } } } } },
    }),
    season
      ? prisma.class.findMany({
          where: { seasonId: season.id },
          include: { teacher: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ])

  return (
    <Box>
      <StudentsClient students={students} classes={classes} hasActiveSeason={!!season} />
    </Box>
  )
}
