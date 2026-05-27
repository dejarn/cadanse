import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { prisma } from "@/lib/prisma"
import { getActiveSeason } from "@/lib/stats-queries"
import { teacherName } from "@/lib/teacherName"
import RollCallClient from "./RollCallClient"

export const dynamic = "force-dynamic"

export default async function RollCallPage() {
  const season = await getActiveSeason()

  if (!season) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Appel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aucune saison active.
        </Typography>
      </Box>
    )
  }

  const classes = await prisma.class.findMany({
    where: { seasonId: season.id },
    include: {
      teacher: true,
      enrollments: {
        include: { student: true },
        orderBy: { student: { lastName: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  })

  const classData = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    schedule: cls.schedule,
    teacherName: teacherName(cls.teacher),
    students: cls.enrollments.map((e) => ({
      id: e.student.id,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
    })),
  }))

  return <RollCallClient classes={classData} />
}
