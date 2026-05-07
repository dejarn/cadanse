import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { getActiveSeason } from "@/lib/queries"
import { prisma } from "@/lib/prisma"

export default async function ClassesPage() {
  const season = await getActiveSeason()
  const classes = season
    ? await prisma.class.findMany({
        where: { seasonId: season.id },
        include: { teacher: true },
        orderBy: { name: "asc" },
      })
    : []

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cours
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {!season
          ? "Aucune saison active."
          : classes.length === 0
            ? "Aucun cours pour cette saison."
            : `${classes.length} cours`}
      </Typography>
    </Box>
  )
}
