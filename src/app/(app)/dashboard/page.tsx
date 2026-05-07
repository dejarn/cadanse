import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import { getActiveSeason, getStudentCount, getTeacherCount } from "@/lib/queries"
import { prisma } from "@/lib/prisma"

async function getClassCount(seasonId: string) {
  return prisma.class.count({ where: { seasonId } })
}

async function getShowCount(seasonId: string) {
  return prisma.show.count({ where: { seasonId } })
}

export default async function DashboardPage() {
  const season = await getActiveSeason()

  const [studentCount, teacherCount, classCount, showCount] = await Promise.all([
    getStudentCount(),
    getTeacherCount(),
    season ? getClassCount(season.id) : Promise.resolve(0),
    season ? getShowCount(season.id) : Promise.resolve(0),
  ])

  const stats = [
    { label: "Élèves", value: studentCount },
    { label: "Professeurs", value: teacherCount },
    { label: "Cours", value: classCount },
    { label: "Spectacles", value: showCount },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {season ? `Saison ${season.label}` : "Aucune saison active"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Vue d'ensemble
      </Typography>

      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h3" color="primary">
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
