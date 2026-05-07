import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { getActiveSeason } from "@/lib/stats-queries"
import { prisma } from "@/lib/prisma"
import ClassesClient from "./ClassesClient"

export default async function ClassesPage() {
  const season = await getActiveSeason()

  if (!season) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
          Cours
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aucune saison active.
        </Typography>
      </Box>
    )
  }

  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      where: { seasonId: season.id },
      include: { teacher: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({ orderBy: { lastName: "asc" } }),
  ])

  return (
    <Box>
      <ClassesClient classes={classes} teachers={teachers} seasonId={season.id} />
    </Box>
  )
}
